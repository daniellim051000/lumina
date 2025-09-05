"""API views for task management."""

from datetime import timedelta

from django.db.models import Q
from django.utils import timezone
from drf_spectacular.utils import OpenApiExample, OpenApiParameter, extend_schema
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Label, Project, Task, TaskComment
from .serializers import (
    LabelSerializer,
    ProjectSerializer,
    TaskCommentSerializer,
    TaskListSerializer,
    TaskQuickCreateSerializer,
    TaskSerializer,
)


class ProjectListCreateView(generics.ListCreateAPIView):
    """List and create projects."""

    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Project.objects.filter(user=self.request.user, is_active=True)


class ProjectDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a project."""

    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Project.objects.filter(user=self.request.user)

    def perform_destroy(self, instance):
        # Soft delete by marking as inactive
        instance.is_active = False
        instance.save()


class LabelListCreateView(generics.ListCreateAPIView):
    """List and create labels."""

    serializer_class = LabelSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Label.objects.filter(user=self.request.user)


class LabelDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a label."""

    serializer_class = LabelSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Label.objects.filter(user=self.request.user)


@extend_schema(
    summary="List and create tasks",
    description="Get all tasks for the authenticated user with optional filtering, or create a new task.",
    parameters=[
        OpenApiParameter(
            name="view",
            description="Filter by special views",
            enum=["today", "week", "overdue"],
            required=False,
        ),
        OpenApiParameter(
            name="priority",
            description="Filter by priority level",
            enum=["P1", "P2", "P3", "P4", ""],
            required=False,
        ),
        OpenApiParameter(
            name="project",
            description="Filter by project ID",
            type=int,
            required=False,
        ),
        OpenApiParameter(
            name="completed",
            description="Filter by completion status",
            type=bool,
            required=False,
        ),
        OpenApiParameter(
            name="search",
            description="Search in title, description, and notes",
            type=str,
            required=False,
        ),
        OpenApiParameter(
            name="subtasks",
            description="Include subtasks in results",
            enum=["include"],
            required=False,
        ),
    ],
    examples=[
        OpenApiExample(
            "Today's Tasks",
            description="Get tasks scheduled for today",
            value={"view": "today"},
            request_only=True,
        ),
        OpenApiExample(
            "High Priority Tasks",
            description="Get P1 and P2 priority tasks",
            value={"priority": "P1"},
            request_only=True,
        ),
    ],
)
class TaskListCreateView(generics.ListCreateAPIView):
    """List and create tasks with filtering."""

    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return TaskSerializer
        return TaskListSerializer

    def get_queryset(self):
        queryset = Task.objects.filter(user=self.request.user)

        # Filter parameters
        project_id = self.request.query_params.get("project")
        priority = self.request.query_params.get("priority")
        is_completed = self.request.query_params.get("completed")
        parent_task_id = self.request.query_params.get("parent_task")
        search = self.request.query_params.get("search")
        view = self.request.query_params.get("view")  # today, week, overdue

        if project_id:
            queryset = queryset.filter(project_id=project_id)

        if priority:
            queryset = queryset.filter(priority=priority)

        if is_completed is not None:
            completed_bool = is_completed.lower() == "true"
            queryset = queryset.filter(is_completed=completed_bool)

        if parent_task_id:
            queryset = queryset.filter(parent_task_id=parent_task_id)
        elif (
            parent_task_id is None
            and self.request.query_params.get("subtasks") != "include"
        ):
            # Exclude subtasks by default unless explicitly requested
            queryset = queryset.filter(parent_task__isnull=True)

        if search:
            queryset = queryset.filter(
                Q(title__icontains=search)
                | Q(description__icontains=search)
                | Q(notes__icontains=search)
            )

        # Special views
        today = timezone.now().date()
        if view == "today":
            queryset = queryset.filter(Q(date=today) | Q(due_date=today)).filter(
                is_completed=False
            )
        elif view == "week":
            week_end = today + timedelta(days=7)
            queryset = queryset.filter(
                Q(date__lte=week_end) | Q(due_date__lte=week_end)
            ).filter(is_completed=False)
        elif view == "overdue":
            queryset = queryset.filter(due_date__lt=today, is_completed=False)

        return queryset.order_by("position", "-created_at")


class TaskDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a task."""

    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Task.objects.filter(user=self.request.user)


class TaskQuickCreateView(generics.CreateAPIView):
    """Quick task creation with minimal fields."""

    serializer_class = TaskQuickCreateSerializer
    permission_classes = [IsAuthenticated]


@extend_schema(
    summary="Bulk update tasks",
    description="Perform bulk operations on multiple tasks like completing, uncompleting, or reordering.",
    examples=[
        OpenApiExample(
            "Complete Multiple Tasks",
            description="Mark multiple tasks as completed",
            value={"task_ids": [1, 2, 3], "action": "complete"},
        ),
        OpenApiExample(
            "Reorder Tasks",
            description="Update task positions for ordering",
            value={
                "task_ids": [1, 2, 3],
                "action": "reorder",
                "positions": {"1": 0, "2": 1, "3": 2},
            },
        ),
    ],
)
class TaskBulkUpdateView(APIView):
    """Bulk update tasks (reorder, complete/uncomplete, etc)."""

    permission_classes = [IsAuthenticated]

    def patch(self, request):
        task_ids = request.data.get("task_ids", [])
        action = request.data.get("action")

        if not task_ids or not action:
            return Response(
                {"error": "task_ids and action are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        queryset = Task.objects.filter(user=request.user, id__in=task_ids)

        if action == "complete":
            queryset.update(is_completed=True, completed_at=timezone.now())
        elif action == "uncomplete":
            queryset.update(is_completed=False, completed_at=None)
        elif action == "reorder":
            positions = request.data.get("positions", {})
            for task in queryset:
                if str(task.id) in positions:
                    task.position = positions[str(task.id)]
                    task.save()
        else:
            return Response(
                {"error": "Invalid action"}, status=status.HTTP_400_BAD_REQUEST
            )

        return Response({"message": f"{action} completed for {queryset.count()} tasks"})


class TaskCommentListCreateView(generics.ListCreateAPIView):
    """List and create comments for a task."""

    serializer_class = TaskCommentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        task_id = self.kwargs["task_id"]
        return TaskComment.objects.filter(
            task__id=task_id, task__user=self.request.user
        )

    def get_serializer_context(self):
        context = super().get_serializer_context()
        task_id = self.kwargs["task_id"]
        try:
            task = Task.objects.get(id=task_id, user=self.request.user)
            context["task"] = task
        except Task.DoesNotExist:
            pass
        return context


class TaskCommentDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a task comment."""

    serializer_class = TaskCommentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return TaskComment.objects.filter(
            task__user=self.request.user, user=self.request.user
        )


@extend_schema(
    summary="Get task statistics",
    description="Get comprehensive statistics about tasks for the authenticated user including counts by status, priority, and time-based views.",
    examples=[
        OpenApiExample(
            "Task Statistics Response",
            description="Example response with task statistics",
            value={
                "total": 25,
                "completed": 15,
                "pending": 10,
                "overdue": 3,
                "today": 5,
                "this_week": 8,
                "priority_breakdown": {"P1": 2, "P2": 4, "P3": 3, "P4": 1, "none": 0},
            },
            response_only=True,
        ),
    ],
)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def task_stats(request):
    """Get task statistics for the authenticated user."""
    user_tasks = Task.objects.filter(user=request.user)
    today = timezone.now().date()

    stats = {
        "total": user_tasks.count(),
        "completed": user_tasks.filter(is_completed=True).count(),
        "pending": user_tasks.filter(is_completed=False).count(),
        "overdue": user_tasks.filter(due_date__lt=today, is_completed=False).count(),
        "today": user_tasks.filter(Q(date=today) | Q(due_date=today))
        .filter(is_completed=False)
        .count(),
        "this_week": user_tasks.filter(
            Q(date__lte=today + timedelta(days=7))
            | Q(due_date__lte=today + timedelta(days=7))
        )
        .filter(is_completed=False)
        .count(),
        "priority_breakdown": {
            "P1": user_tasks.filter(priority="P1", is_completed=False).count(),
            "P2": user_tasks.filter(priority="P2", is_completed=False).count(),
            "P3": user_tasks.filter(priority="P3", is_completed=False).count(),
            "P4": user_tasks.filter(priority="P4", is_completed=False).count(),
            "none": user_tasks.filter(priority="", is_completed=False).count(),
        },
    }

    return Response(stats)

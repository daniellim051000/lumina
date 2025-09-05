"""URL patterns for task management API."""

from django.urls import path

from . import views

app_name = "task"

urlpatterns = [
    # Projects
    path("projects/", views.ProjectListCreateView.as_view(), name="project-list"),
    path(
        "projects/<int:pk>/", views.ProjectDetailView.as_view(), name="project-detail"
    ),
    # Labels
    path("labels/", views.LabelListCreateView.as_view(), name="label-list"),
    path("labels/<int:pk>/", views.LabelDetailView.as_view(), name="label-detail"),
    # Tasks
    path("tasks/", views.TaskListCreateView.as_view(), name="task-list"),
    path("tasks/<int:pk>/", views.TaskDetailView.as_view(), name="task-detail"),
    path("tasks/quick/", views.TaskQuickCreateView.as_view(), name="task-quick-create"),
    path("tasks/bulk/", views.TaskBulkUpdateView.as_view(), name="task-bulk-update"),
    path("tasks/stats/", views.task_stats, name="task-stats"),
    # Task Comments
    path(
        "tasks/<int:task_id>/comments/",
        views.TaskCommentListCreateView.as_view(),
        name="task-comment-list",
    ),
    path(
        "comments/<int:pk>/",
        views.TaskCommentDetailView.as_view(),
        name="task-comment-detail",
    ),
]

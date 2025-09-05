"""API serializers for task management."""

from django.contrib.auth.models import User
from rest_framework import serializers

from .models import Label, Project, Task, TaskComment


class UserSimpleSerializer(serializers.ModelSerializer):
    """Simple user serializer for nested relationships."""

    class Meta:
        model = User
        fields = ["id", "username", "first_name", "last_name"]


class LabelSerializer(serializers.ModelSerializer):
    """Label serializer."""

    class Meta:
        model = Label
        fields = ["id", "name", "color", "created_at"]
        read_only_fields = ["created_at"]

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)


class ProjectSerializer(serializers.ModelSerializer):
    """Project serializer."""

    user = UserSimpleSerializer(read_only=True)
    parent = serializers.PrimaryKeyRelatedField(
        queryset=Project.objects.none(), required=False, allow_null=True
    )
    task_count = serializers.SerializerMethodField()
    completed_task_count = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            "id",
            "name",
            "description",
            "color",
            "user",
            "parent",
            "position",
            "is_active",
            "task_count",
            "completed_task_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if (
            self.context.get("request")
            and hasattr(self.context["request"], "user")
            and self.context["request"].user.is_authenticated
        ):
            user = self.context["request"].user
            self.fields["parent"].queryset = Project.objects.filter(user=user)

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)

    def get_task_count(self, obj):
        return obj.tasks.count()

    def get_completed_task_count(self, obj):
        return obj.tasks.filter(is_completed=True).count()


class TaskCommentSerializer(serializers.ModelSerializer):
    """Task comment serializer."""

    user = UserSimpleSerializer(read_only=True)

    class Meta:
        model = TaskComment
        fields = ["id", "user", "content", "created_at", "updated_at"]
        read_only_fields = ["created_at", "updated_at"]

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        validated_data["task"] = self.context["task"]
        return super().create(validated_data)


class TaskSerializer(serializers.ModelSerializer):
    """Task serializer with full details."""

    user = UserSimpleSerializer(read_only=True)
    project = ProjectSerializer(read_only=True)
    project_id = serializers.PrimaryKeyRelatedField(
        queryset=Project.objects.none(),
        source="project",
        required=False,
        allow_null=True,
        write_only=True,
    )
    parent_task = serializers.PrimaryKeyRelatedField(
        queryset=Task.objects.none(), required=False, allow_null=True
    )
    labels = LabelSerializer(many=True, read_only=True)
    label_ids = serializers.PrimaryKeyRelatedField(
        queryset=Label.objects.none(),
        source="labels",
        many=True,
        write_only=True,
        required=False,
    )
    comments = TaskCommentSerializer(many=True, read_only=True)
    is_overdue = serializers.ReadOnlyField()
    subtask_count = serializers.ReadOnlyField()
    completed_subtask_count = serializers.ReadOnlyField()

    class Meta:
        model = Task
        fields = [
            "id",
            "title",
            "description",
            "notes",
            "priority",
            "date",
            "due_date",
            "is_completed",
            "completed_at",
            "user",
            "project",
            "project_id",
            "parent_task",
            "labels",
            "label_ids",
            "position",
            "comments",
            "is_overdue",
            "subtask_count",
            "completed_subtask_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["completed_at", "created_at", "updated_at"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if (
            self.context.get("request")
            and hasattr(self.context["request"], "user")
            and self.context["request"].user.is_authenticated
        ):
            user = self.context["request"].user
            self.fields["project_id"].queryset = Project.objects.filter(user=user)
            self.fields["parent_task"].queryset = Task.objects.filter(user=user)
            self.fields["label_ids"].queryset = Label.objects.filter(user=user)

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        labels = validated_data.pop("labels", [])
        task = super().create(validated_data)
        if labels:
            task.labels.set(labels)
        return task

    def update(self, instance, validated_data):
        labels = validated_data.pop("labels", None)
        task = super().update(instance, validated_data)
        if labels is not None:
            task.labels.set(labels)
        return task


class TaskListSerializer(serializers.ModelSerializer):
    """Lightweight task serializer for list views."""

    project = serializers.SerializerMethodField()
    labels = LabelSerializer(many=True, read_only=True)
    is_overdue = serializers.ReadOnlyField()
    subtask_count = serializers.ReadOnlyField()
    completed_subtask_count = serializers.ReadOnlyField()

    class Meta:
        model = Task
        fields = [
            "id",
            "title",
            "priority",
            "date",
            "due_date",
            "is_completed",
            "project",
            "parent_task",
            "labels",
            "position",
            "is_overdue",
            "subtask_count",
            "completed_subtask_count",
            "created_at",
            "updated_at",
        ]

    def get_project(self, obj):
        if obj.project:
            return {
                "id": obj.project.id,
                "name": obj.project.name,
                "color": obj.project.color,
            }
        return None


class TaskQuickCreateSerializer(serializers.ModelSerializer):
    """Quick task creation serializer with minimal fields."""

    project_id = serializers.PrimaryKeyRelatedField(
        queryset=Project.objects.none(),
        source="project",
        required=False,
        allow_null=True,
    )

    class Meta:
        model = Task
        fields = ["title", "priority", "date", "due_date", "project_id", "parent_task"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if (
            self.context.get("request")
            and hasattr(self.context["request"], "user")
            and self.context["request"].user.is_authenticated
        ):
            user = self.context["request"].user
            self.fields["project_id"].queryset = Project.objects.filter(user=user)

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)

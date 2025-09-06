"""API serializers for task management."""

from django.contrib.auth.models import User
from django.utils.html import strip_tags
from rest_framework import serializers

from .models import Label, Project, Task, TaskComment, validate_hex_color


class UserSimpleSerializer(serializers.ModelSerializer):
    """Simple user serializer for nested relationships."""

    class Meta:
        model = User
        fields = ["id", "username", "first_name", "last_name"]


class LabelSerializer(serializers.ModelSerializer):
    """Label serializer with validation."""

    class Meta:
        model = Label
        fields = ["id", "name", "color", "created_at"]
        read_only_fields = ["created_at"]

    def validate_name(self, value):
        """Validate and sanitize label name."""
        if not value or len(value.strip()) < 1:
            raise serializers.ValidationError("Label name cannot be empty.")

        # Sanitize input
        cleaned = strip_tags(value).strip()
        if len(cleaned) > 100:
            raise serializers.ValidationError(
                "Label name is too long (maximum 100 characters)."
            )

        return cleaned

    def validate_color(self, value):
        """Validate hex color format."""
        validate_hex_color(value)  # Use the model validator
        return value

    def validate(self, attrs):
        """Validate label data including unique constraints."""
        user = self.context["request"].user
        name = attrs.get("name")

        # Check for duplicate label name for the same user
        if name and Label.objects.filter(user=user, name=name).exists():
            raise serializers.ValidationError(
                {"name": "You already have a label with this name."}
            )

        return attrs

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)


class ProjectSerializer(serializers.ModelSerializer):
    """Project serializer with validation."""

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

    def validate_name(self, value):
        """Validate and sanitize project name."""
        if not value or len(value.strip()) < 1:
            raise serializers.ValidationError("Project name cannot be empty.")

        # Sanitize input
        cleaned = strip_tags(value).strip()
        if len(cleaned) > 255:
            raise serializers.ValidationError(
                "Project name is too long (maximum 255 characters)."
            )

        return cleaned

    def validate_color(self, value):
        """Validate hex color format."""
        validate_hex_color(value)  # Use the model validator
        return value

    def validate_description(self, value):
        """Validate and sanitize project description."""
        if value:
            # Sanitize input
            cleaned = strip_tags(value).strip()
            if len(cleaned) > 5000:
                raise serializers.ValidationError(
                    "Project description is too long (maximum 5000 characters)."
                )
            return cleaned
        return value

    def validate(self, attrs):
        """Validate project data including unique constraints."""
        user = self.context["request"].user
        name = attrs.get("name")

        # Check for duplicate project name for the same user
        if name and Project.objects.filter(user=user, name=name).exists():
            raise serializers.ValidationError(
                {"name": "You already have a project with this name."}
            )

        return attrs

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)

    def get_task_count(self, obj):
        return obj.tasks.count()

    def get_completed_task_count(self, obj):
        return obj.tasks.filter(is_completed=True).count()


class TaskCommentSerializer(serializers.ModelSerializer):
    """Task comment serializer with validation."""

    user = UserSimpleSerializer(read_only=True)

    class Meta:
        model = TaskComment
        fields = ["id", "user", "content", "created_at", "updated_at"]
        read_only_fields = ["created_at", "updated_at"]

    def validate_content(self, value):
        """Validate and sanitize comment content."""
        if not value or len(value.strip()) < 1:
            raise serializers.ValidationError("Comment content cannot be empty.")

        # Sanitize input
        cleaned = strip_tags(value).strip()
        if len(cleaned) > 5000:
            raise serializers.ValidationError(
                "Comment content is too long (maximum 5000 characters)."
            )

        return cleaned

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

    def validate_title(self, value):
        """Validate and sanitize task title."""
        if not value or len(value.strip()) < 1:
            raise serializers.ValidationError("Task title cannot be empty.")

        # Sanitize input
        cleaned = strip_tags(value).strip()
        if len(cleaned) > 500:
            raise serializers.ValidationError(
                "Task title is too long (maximum 500 characters)."
            )

        return cleaned

    def validate_description(self, value):
        """Validate and sanitize task description."""
        if value:
            # Sanitize input
            cleaned = strip_tags(value).strip()
            if len(cleaned) > 10000:
                raise serializers.ValidationError(
                    "Task description is too long (maximum 10000 characters)."
                )
            return cleaned
        return value

    def validate_notes(self, value):
        """Validate and sanitize task notes."""
        if value:
            # Sanitize input
            cleaned = strip_tags(value).strip()
            if len(cleaned) > 50000:
                raise serializers.ValidationError(
                    "Task notes are too long (maximum 50000 characters)."
                )
            return cleaned
        return value

    def validate_priority(self, value):
        """Validate task priority."""
        valid_priorities = [choice[0] for choice in Task.PRIORITY_CHOICES]
        if value and value not in valid_priorities:
            raise serializers.ValidationError(
                f"Invalid priority. Must be one of: {valid_priorities}"
            )
        return value

    def validate(self, data):
        """Cross-field validation."""
        # Check date logic
        if (
            data.get("date")
            and data.get("due_date")
            and data["date"] > data["due_date"]
        ):
            raise serializers.ValidationError("Task date cannot be after due date.")

        return data

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

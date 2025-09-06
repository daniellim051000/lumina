"""Serializers for Pomodoro timer models."""

from django.utils import timezone
from rest_framework import serializers

from .models import PomodoroPreset, PomodoroSession, PomodoroSettings


class PomodoroSettingsSerializer(serializers.ModelSerializer):
    """Serializer for PomodoroSettings model."""

    class Meta:
        model = PomodoroSettings
        fields = [
            "id",
            "work_duration",
            "short_break_duration",
            "long_break_duration",
            "sessions_until_long_break",
            "auto_start_breaks",
            "auto_start_work",
            "enable_audio",
            "work_sound",
            "break_sound",
            "volume",
            "enable_notifications",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_work_duration(self, value):
        """Validate work duration is reasonable."""
        if value < 1 or value > 120:
            raise serializers.ValidationError(
                "Work duration must be between 1 and 120 minutes."
            )
        return value

    def validate_short_break_duration(self, value):
        """Validate short break duration is reasonable."""
        if value < 1 or value > 60:
            raise serializers.ValidationError(
                "Short break duration must be between 1 and 60 minutes."
            )
        return value

    def validate_long_break_duration(self, value):
        """Validate long break duration is reasonable."""
        if value < 1 or value > 120:
            raise serializers.ValidationError(
                "Long break duration must be between 1 and 120 minutes."
            )
        return value

    def validate_volume(self, value):
        """Validate volume is between 0 and 1."""
        if value < 0.0 or value > 1.0:
            raise serializers.ValidationError("Volume must be between 0.0 and 1.0.")
        return value


class PomodoroPresetSerializer(serializers.ModelSerializer):
    """Serializer for PomodoroPreset model."""

    class Meta:
        model = PomodoroPreset
        fields = [
            "id",
            "name",
            "work_duration",
            "short_break_duration",
            "long_break_duration",
            "sessions_until_long_break",
            "is_default",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_name(self, value):
        """Validate preset name is not empty and unique for user."""
        if not value or len(value.strip()) == 0:
            raise serializers.ValidationError("Preset name cannot be empty.")
        return value.strip()

    def validate(self, attrs):
        """Validate the entire preset."""
        # Check for duplicate names for the same user
        user = self.context["request"].user
        name = attrs.get("name")

        if name:
            existing_preset = PomodoroPreset.objects.filter(user=user, name=name)
            if self.instance:
                existing_preset = existing_preset.exclude(pk=self.instance.pk)

            if existing_preset.exists():
                raise serializers.ValidationError(
                    {"name": "A preset with this name already exists."}
                )

        return attrs


class PomodoroSessionSerializer(serializers.ModelSerializer):
    """Serializer for PomodoroSession model."""

    task_title = serializers.CharField(source="task.title", read_only=True)
    elapsed_minutes = serializers.IntegerField(read_only=True)
    remaining_minutes = serializers.IntegerField(read_only=True)

    class Meta:
        model = PomodoroSession
        fields = [
            "id",
            "task",
            "task_title",
            "session_type",
            "status",
            "planned_duration",
            "actual_duration",
            "started_at",
            "paused_at",
            "completed_at",
            "session_number",
            "notes",
            "productivity_rating",
            "elapsed_minutes",
            "remaining_minutes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "started_at",
            "elapsed_minutes",
            "remaining_minutes",
            "created_at",
            "updated_at",
        ]

    def validate_task(self, value):
        """Validate that task belongs to the current user."""
        if value and value.user != self.context["request"].user:
            raise serializers.ValidationError("Task must belong to the current user.")
        return value

    def validate_productivity_rating(self, value):
        """Validate productivity rating is only set for work sessions."""
        if value is not None:
            session_type = self.initial_data.get("session_type")
            if session_type and session_type != "work":
                raise serializers.ValidationError(
                    "Productivity rating can only be set for work sessions."
                )
        return value

    def validate_status(self, value):
        """Validate status transitions are logical."""
        if self.instance:
            current_status = self.instance.status

            # Define valid transitions
            valid_transitions = {
                "active": ["paused", "completed", "skipped", "cancelled"],
                "paused": ["active", "completed", "skipped", "cancelled"],
                "completed": [],  # Completed sessions cannot be changed
                "skipped": [],  # Skipped sessions cannot be changed
                "cancelled": [],  # Cancelled sessions cannot be changed
            }

            if current_status in ["completed", "skipped", "cancelled"]:
                raise serializers.ValidationError(
                    f"Cannot change status of a {current_status} session."
                )

            if value not in valid_transitions.get(current_status, []):
                raise serializers.ValidationError(
                    f"Invalid status transition from {current_status} to {value}."
                )

        return value

    def update(self, instance, validated_data):
        """Handle status transitions and timing updates."""
        new_status = validated_data.get("status", instance.status)

        # Handle paused state
        if new_status == "paused" and instance.status != "paused":
            validated_data["paused_at"] = timezone.now()
        elif new_status == "active" and instance.status == "paused":
            # Clear paused_at when resuming
            validated_data["paused_at"] = None

        return super().update(instance, validated_data)


class PomodoroSessionCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new Pomodoro sessions."""

    class Meta:
        model = PomodoroSession
        fields = [
            "task",
            "session_type",
            "planned_duration",
            "session_number",
            "notes",
        ]

    def validate_task(self, value):
        """Validate that task belongs to the current user."""
        if value and value.user != self.context["request"].user:
            raise serializers.ValidationError("Task must belong to the current user.")
        return value

    def create(self, validated_data):
        """Create a new session for the current user."""
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)


class PomodoroSessionStatsSerializer(serializers.Serializer):
    """Serializer for Pomodoro session statistics."""

    total_sessions = serializers.IntegerField()
    completed_sessions = serializers.IntegerField()
    work_sessions = serializers.IntegerField()
    break_sessions = serializers.IntegerField()
    total_focus_time = serializers.IntegerField(
        help_text="Total focused time in minutes"
    )
    average_session_duration = serializers.FloatField()
    completion_rate = serializers.FloatField(
        help_text="Percentage of sessions completed"
    )
    daily_average = serializers.FloatField()
    current_streak = serializers.IntegerField()
    longest_streak = serializers.IntegerField()

    # Daily breakdown
    sessions_by_day = serializers.DictField(child=serializers.IntegerField())
    focus_time_by_day = serializers.DictField(child=serializers.IntegerField())

    # Productivity ratings
    average_productivity = serializers.FloatField(allow_null=True)
    productivity_distribution = serializers.DictField(child=serializers.IntegerField())

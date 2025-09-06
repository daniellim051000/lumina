"""Admin configuration for Pomodoro timer models."""

from django.contrib import admin

from .models import PomodoroPreset, PomodoroSession, PomodoroSettings


@admin.register(PomodoroSettings)
class PomodoroSettingsAdmin(admin.ModelAdmin):
    """Admin interface for PomodoroSettings."""

    list_display = [
        "user",
        "work_duration",
        "short_break_duration",
        "long_break_duration",
        "sessions_until_long_break",
        "enable_audio",
        "enable_notifications",
        "created_at",
    ]
    list_filter = [
        "enable_audio",
        "enable_notifications",
        "auto_start_breaks",
        "auto_start_work",
        "created_at",
    ]
    search_fields = ["user__username", "user__email"]
    readonly_fields = ["created_at", "updated_at"]

    fieldsets = (
        ("User", {"fields": ("user",)}),
        (
            "Timer Durations",
            {
                "fields": (
                    "work_duration",
                    "short_break_duration",
                    "long_break_duration",
                    "sessions_until_long_break",
                )
            },
        ),
        ("Auto-start Settings", {"fields": ("auto_start_breaks", "auto_start_work")}),
        (
            "Audio Settings",
            {
                "fields": (
                    "enable_audio",
                    "work_sound",
                    "break_sound",
                    "volume",
                )
            },
        ),
        ("Notification Settings", {"fields": ("enable_notifications",)}),
        (
            "Timestamps",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )


@admin.register(PomodoroPreset)
class PomodoroPresetAdmin(admin.ModelAdmin):
    """Admin interface for PomodoroPreset."""

    list_display = [
        "name",
        "user",
        "work_duration",
        "short_break_duration",
        "long_break_duration",
        "is_default",
        "created_at",
    ]
    list_filter = ["is_default", "created_at"]
    search_fields = ["name", "user__username", "user__email"]
    readonly_fields = ["created_at", "updated_at"]

    fieldsets = (
        ("Basic Information", {"fields": ("user", "name", "is_default")}),
        (
            "Timer Configuration",
            {
                "fields": (
                    "work_duration",
                    "short_break_duration",
                    "long_break_duration",
                    "sessions_until_long_break",
                )
            },
        ),
        (
            "Timestamps",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )


@admin.register(PomodoroSession)
class PomodoroSessionAdmin(admin.ModelAdmin):
    """Admin interface for PomodoroSession."""

    list_display = [
        "user",
        "session_type",
        "status",
        "planned_duration",
        "actual_duration",
        "started_at",
        "completed_at",
        "task",
        "productivity_rating",
    ]
    list_filter = [
        "session_type",
        "status",
        "started_at",
        "completed_at",
        "productivity_rating",
    ]
    search_fields = [
        "user__username",
        "user__email",
        "task__title",
        "notes",
    ]
    readonly_fields = [
        "created_at",
        "updated_at",
        "elapsed_minutes",
        "remaining_minutes",
    ]
    date_hierarchy = "started_at"

    fieldsets = (
        ("Basic Information", {"fields": ("user", "task", "session_type", "status")}),
        (
            "Duration & Timing",
            {
                "fields": (
                    "planned_duration",
                    "actual_duration",
                    "started_at",
                    "paused_at",
                    "completed_at",
                    "elapsed_minutes",
                    "remaining_minutes",
                )
            },
        ),
        (
            "Session Details",
            {
                "fields": (
                    "session_number",
                    "notes",
                    "productivity_rating",
                )
            },
        ),
        (
            "Timestamps",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )

    def get_queryset(self, request):
        """Optimize queryset with select_related."""
        return super().get_queryset(request).select_related("user", "task")

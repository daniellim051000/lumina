"""Admin configuration for task models."""

from django.contrib import admin

from .models import Label, Project, Task, TaskComment


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ["name", "user", "parent", "is_active", "created_at"]
    list_filter = ["is_active", "created_at", "user"]
    search_fields = ["name", "description"]
    ordering = ["user", "position", "name"]


@admin.register(Label)
class LabelAdmin(admin.ModelAdmin):
    list_display = ["name", "color", "user", "created_at"]
    list_filter = ["created_at", "user"]
    search_fields = ["name"]
    ordering = ["user", "name"]


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = [
        "title",
        "user",
        "project",
        "priority",
        "is_completed",
        "due_date",
        "created_at",
    ]
    list_filter = [
        "is_completed",
        "priority",
        "project",
        "created_at",
        "due_date",
        "user",
    ]
    search_fields = ["title", "description", "notes"]
    filter_horizontal = ["labels"]
    ordering = ["user", "position", "-created_at"]

    fieldsets = (
        (
            "Basic Info",
            {"fields": ("title", "description", "user", "project", "parent_task")},
        ),
        ("Scheduling", {"fields": ("priority", "date", "due_date")}),
        ("Status", {"fields": ("is_completed", "completed_at", "position")}),
        ("Additional", {"fields": ("notes", "labels"), "classes": ["collapse"]}),
    )
    readonly_fields = ["completed_at"]


@admin.register(TaskComment)
class TaskCommentAdmin(admin.ModelAdmin):
    list_display = ["task", "user", "content_preview", "created_at"]
    list_filter = ["created_at", "user"]
    search_fields = ["content", "task__title"]
    ordering = ["-created_at"]

    def content_preview(self, obj):
        return obj.content[:50] + "..." if len(obj.content) > 50 else obj.content

    content_preview.short_description = "Content Preview"

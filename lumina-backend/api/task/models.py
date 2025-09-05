"""Task management models for Lumina."""

from django.contrib.auth.models import User
from django.db import models
from django.utils import timezone


class Project(models.Model):
    """Project model for grouping tasks."""

    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    color = models.CharField(max_length=7, default="#3B82F6")  # Hex color code
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="projects")
    parent = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="sub_projects",
    )
    position = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["position", "name"]
        unique_together = ["user", "name"]

    def __str__(self):
        return f"{self.user.username} - {self.name}"


class Label(models.Model):
    """Label model for flexible task categorization."""

    name = models.CharField(max_length=100)
    color = models.CharField(max_length=7, default="#6B7280")  # Hex color code
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="labels")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]
        unique_together = ["user", "name"]

    def __str__(self):
        return f"{self.user.username} - {self.name}"


class Task(models.Model):
    """Enhanced Task model inspired by Todoist and Notion."""

    PRIORITY_CHOICES = [
        ("P1", "Priority 1 (Urgent)"),
        ("P2", "Priority 2 (High)"),
        ("P3", "Priority 3 (Medium)"),
        ("P4", "Priority 4 (Low)"),
        ("", "No Priority"),
    ]

    title = models.CharField(max_length=500, help_text="The task title or name")
    description = models.TextField(blank=True, help_text="Optional task description")
    notes = models.TextField(
        blank=True,
        help_text="Rich notes section for detailed information, similar to Notion",
    )

    # Priority system (P1-P4 or None)
    priority = models.CharField(
        max_length=2,
        choices=PRIORITY_CHOICES,
        blank=True,
        default="",
        help_text="Task priority level (P1=Urgent, P2=High, P3=Medium, P4=Low, empty=No priority)",
    )

    # Dates
    date = models.DateField(
        null=True, blank=True, help_text="When to work on this task"
    )
    due_date = models.DateField(null=True, blank=True, help_text="Task deadline")

    # Completion
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)

    # Relationships
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="tasks")
    project = models.ForeignKey(
        Project, on_delete=models.SET_NULL, null=True, blank=True, related_name="tasks"
    )
    parent_task = models.ForeignKey(
        "self", on_delete=models.CASCADE, null=True, blank=True, related_name="subtasks"
    )
    labels = models.ManyToManyField(Label, blank=True, related_name="tasks")

    # Ordering
    position = models.PositiveIntegerField(default=0)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["position", "-created_at"]

    def __str__(self):
        return f"{self.title} ({self.user.username})"

    def save(self, *args, **kwargs):
        # Set completed_at when task is marked complete
        if self.is_completed and not self.completed_at:
            self.completed_at = timezone.now()
        elif not self.is_completed:
            self.completed_at = None
        super().save(*args, **kwargs)

    @property
    def is_overdue(self):
        """Check if task is overdue."""
        if self.due_date and not self.is_completed:
            return self.due_date < timezone.now().date()
        return False

    @property
    def subtask_count(self):
        """Get count of subtasks."""
        return self.subtasks.count()

    @property
    def completed_subtask_count(self):
        """Get count of completed subtasks."""
        return self.subtasks.filter(is_completed=True).count()


class TaskComment(models.Model):
    """Comments on tasks for discussions and notes."""

    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name="comments")
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="task_comments"
    )
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Comment by {self.user.username} on {self.task.title}"

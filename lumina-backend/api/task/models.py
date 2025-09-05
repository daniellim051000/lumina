"""Task management models for Lumina."""

import re
from html import escape

from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.core.validators import RegexValidator
from django.db import models
from django.utils import timezone
from django.utils.html import strip_tags


def validate_hex_color(value):
    """Validate that a color value is a valid hex color code."""
    if not re.match(r"^#[0-9A-Fa-f]{6}$", value):
        raise ValidationError(
            f"'{value}' is not a valid hex color code. Use format: #RRGGBB"
        )


def sanitize_text_input(text):
    """Sanitize text input by stripping HTML tags and escaping special characters."""
    if not text:
        return text
    # Strip HTML tags and escape remaining content
    cleaned = strip_tags(text)
    # Remove any remaining script-like content
    cleaned = re.sub(r"<script[^>]*>.*?</script>", "", cleaned, flags=re.IGNORECASE)
    return cleaned.strip()


def validate_text_length(value, max_length=10000):
    """Validate text length to prevent excessively long inputs."""
    if value and len(value) > max_length:
        raise ValidationError(
            f"Text is too long. Maximum {max_length} characters allowed."
        )


class Project(models.Model):
    """Project model for grouping tasks."""

    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    color = models.CharField(
        max_length=7, 
        default="#3B82F6",
        validators=[validate_hex_color],
        help_text="Hex color code (e.g., #3B82F6)"
    )
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

    def clean(self):
        """Validate and sanitize project data."""
        super().clean()
        
        # Sanitize text inputs
        if self.name:
            self.name = sanitize_text_input(self.name)
        if self.description:
            self.description = sanitize_text_input(self.description)
            validate_text_length(self.description, 5000)
            
        # Validate name length and content
        if self.name and len(self.name.strip()) < 1:
            raise ValidationError("Project name cannot be empty.")
        if self.name and len(self.name) > 255:
            raise ValidationError("Project name is too long (maximum 255 characters).")

    def save(self, *args, **kwargs):
        """Override save to ensure validation."""
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user.username} - {self.name}"


class Label(models.Model):
    """Label model for flexible task categorization."""

    name = models.CharField(max_length=100)
    color = models.CharField(
        max_length=7, 
        default="#6B7280",
        validators=[validate_hex_color],
        help_text="Hex color code (e.g., #6B7280)"
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="labels")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]
        unique_together = ["user", "name"]

    def clean(self):
        """Validate and sanitize label data."""
        super().clean()
        
        # Sanitize text inputs
        if self.name:
            self.name = sanitize_text_input(self.name)
            
        # Validate name length and content
        if self.name and len(self.name.strip()) < 1:
            raise ValidationError("Label name cannot be empty.")
        if self.name and len(self.name) > 100:
            raise ValidationError("Label name is too long (maximum 100 characters).")

    def save(self, *args, **kwargs):
        """Override save to ensure validation."""
        self.full_clean()
        super().save(*args, **kwargs)

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

    def clean(self):
        """Validate and sanitize task data."""
        super().clean()
        
        # Sanitize text inputs
        if self.title:
            self.title = sanitize_text_input(self.title)
        if self.description:
            self.description = sanitize_text_input(self.description)
            validate_text_length(self.description, 10000)
        if self.notes:
            self.notes = sanitize_text_input(self.notes)
            validate_text_length(self.notes, 50000)
            
        # Validate title length and content
        if self.title and len(self.title.strip()) < 1:
            raise ValidationError("Task title cannot be empty.")
        if self.title and len(self.title) > 500:
            raise ValidationError("Task title is too long (maximum 500 characters).")
            
        # Validate priority
        if self.priority and self.priority not in [choice[0] for choice in self.PRIORITY_CHOICES]:
            raise ValidationError("Invalid priority value.")
            
        # Validate dates
        if self.date and self.due_date and self.date > self.due_date:
            raise ValidationError("Task date cannot be after due date.")

    def __str__(self):
        return f"{self.title} ({self.user.username})"

    def save(self, *args, **kwargs):
        # Validate before saving
        self.full_clean()
        
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

    def clean(self):
        """Validate and sanitize comment data."""
        super().clean()
        
        # Sanitize text inputs
        if self.content:
            self.content = sanitize_text_input(self.content)
            validate_text_length(self.content, 5000)
            
        # Validate content
        if self.content and len(self.content.strip()) < 1:
            raise ValidationError("Comment content cannot be empty.")

    def save(self, *args, **kwargs):
        """Override save to ensure validation."""
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Comment by {self.user.username} on {self.task.title}"

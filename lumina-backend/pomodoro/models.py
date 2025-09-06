"""Pomodoro timer models for Lumina."""

from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.utils import timezone

from api.task.models import Task, sanitize_text_input, validate_text_length


class PomodoroSettings(models.Model):
    """User's Pomodoro timer preferences and settings."""

    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="pomodoro_settings"
    )

    # Timer durations in minutes
    work_duration = models.PositiveIntegerField(
        default=25,
        validators=[MinValueValidator(1), MaxValueValidator(120)],
        help_text="Work session duration in minutes (1-120)",
    )
    short_break_duration = models.PositiveIntegerField(
        default=5,
        validators=[MinValueValidator(1), MaxValueValidator(60)],
        help_text="Short break duration in minutes (1-60)",
    )
    long_break_duration = models.PositiveIntegerField(
        default=15,
        validators=[MinValueValidator(1), MaxValueValidator(120)],
        help_text="Long break duration in minutes (1-120)",
    )

    # Session configuration
    sessions_until_long_break = models.PositiveIntegerField(
        default=4,
        validators=[MinValueValidator(2), MaxValueValidator(12)],
        help_text="Number of work sessions before long break (2-12)",
    )

    # Auto-start settings
    auto_start_breaks = models.BooleanField(
        default=False, help_text="Automatically start break sessions"
    )
    auto_start_work = models.BooleanField(
        default=False, help_text="Automatically start work sessions after breaks"
    )

    # Audio settings
    enable_audio = models.BooleanField(
        default=True, help_text="Enable audio notifications"
    )
    work_sound = models.CharField(
        max_length=50, default="bell", help_text="Sound for work session completion"
    )
    break_sound = models.CharField(
        max_length=50, default="chime", help_text="Sound for break session completion"
    )
    volume = models.FloatField(
        default=0.7,
        validators=[MinValueValidator(0.0), MaxValueValidator(1.0)],
        help_text="Volume level (0.0-1.0)",
    )

    # System notifications
    enable_notifications = models.BooleanField(
        default=True, help_text="Enable system notifications"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Pomodoro Settings"
        verbose_name_plural = "Pomodoro Settings"

    def __str__(self):
        return f"{self.user.username}'s Pomodoro Settings"


class PomodoroPreset(models.Model):
    """Predefined timer configurations that users can save and reuse."""

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="pomodoro_presets"
    )
    name = models.CharField(max_length=100, help_text="Preset name")

    # Timer durations in minutes
    work_duration = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(120)]
    )
    short_break_duration = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(60)]
    )
    long_break_duration = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(120)]
    )
    sessions_until_long_break = models.PositiveIntegerField(
        validators=[MinValueValidator(2), MaxValueValidator(12)]
    )

    is_default = models.BooleanField(
        default=False, help_text="Whether this is the default preset for the user"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ["user", "name"]
        ordering = ["name"]

    def clean(self):
        """Validate and sanitize preset data."""
        super().clean()

        # Sanitize name
        if self.name:
            self.name = sanitize_text_input(self.name)
            validate_text_length(self.name, 100)

        # Validate name length and content
        if self.name and len(self.name.strip()) < 1:
            raise ValidationError("Preset name cannot be empty.")

    def save(self, *args, **kwargs):
        """Override save to ensure validation and handle default preset."""
        self.full_clean()

        # If this is set as default, unset other defaults for this user
        if self.is_default:
            PomodoroPreset.objects.filter(user=self.user, is_default=True).update(
                is_default=False
            )

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user.username} - {self.name}"


class PomodoroSession(models.Model):
    """Individual Pomodoro session records."""

    SESSION_TYPES = [
        ("work", "Work Session"),
        ("short_break", "Short Break"),
        ("long_break", "Long Break"),
    ]

    STATUS_CHOICES = [
        ("active", "Active"),
        ("paused", "Paused"),
        ("completed", "Completed"),
        ("skipped", "Skipped"),
        ("cancelled", "Cancelled"),
    ]

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="pomodoro_sessions"
    )
    task = models.ForeignKey(
        Task,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="pomodoro_sessions",
        help_text="Optional task associated with this session",
    )

    # Session details
    session_type = models.CharField(
        max_length=15, choices=SESSION_TYPES, help_text="Type of Pomodoro session"
    )
    status = models.CharField(
        max_length=15,
        choices=STATUS_CHOICES,
        default="active",
        help_text="Current session status",
    )

    # Duration configuration (in minutes)
    planned_duration = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(120)],
        help_text="Planned session duration in minutes",
    )
    actual_duration = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Actual session duration in minutes (when completed)",
    )

    # Session timing
    started_at = models.DateTimeField(auto_now_add=True)
    paused_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    # Session sequence tracking
    session_number = models.PositiveIntegerField(
        default=1, help_text="Session number in current cycle (resets after long break)"
    )

    # Notes and feedback
    notes = models.TextField(blank=True, help_text="Optional notes about this session")
    productivity_rating = models.PositiveIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="Self-rated productivity for work sessions (1-5)",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-started_at"]

    def clean(self):
        """Validate and sanitize session data."""
        super().clean()

        # Sanitize notes
        if self.notes:
            self.notes = sanitize_text_input(self.notes)
            validate_text_length(self.notes, 1000)

        # Validate productivity rating only for work sessions
        if self.productivity_rating and self.session_type != "work":
            raise ValidationError(
                "Productivity rating can only be set for work sessions."
            )

    def save(self, *args, **kwargs):
        """Override save to ensure validation and handle status transitions."""
        self.full_clean()

        # Set completed_at when status changes to completed
        if self.status == "completed" and not self.completed_at:
            self.completed_at = timezone.now()

            # Calculate actual duration if not set
            if not self.actual_duration and self.started_at:
                duration_seconds = (self.completed_at - self.started_at).total_seconds()
                # Account for paused time if session was paused
                if self.paused_at:
                    paused_duration = (
                        self.completed_at - self.paused_at
                    ).total_seconds()
                    duration_seconds -= paused_duration

                self.actual_duration = max(
                    1, int(duration_seconds / 60)
                )  # Convert to minutes

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user.username} - {self.get_session_type_display()} ({self.started_at.strftime('%Y-%m-%d %H:%M')})"

    @property
    def is_work_session(self):
        """Check if this is a work session."""
        return self.session_type == "work"

    @property
    def is_break_session(self):
        """Check if this is any type of break session."""
        return self.session_type in ["short_break", "long_break"]

    @property
    def elapsed_minutes(self):
        """Get elapsed time in minutes since session started (excluding paused time)."""
        if not self.started_at:
            return 0

        end_time = self.completed_at or timezone.now()
        elapsed_seconds = (end_time - self.started_at).total_seconds()

        # Subtract paused time if applicable
        if self.paused_at and self.status == "paused":
            paused_seconds = (timezone.now() - self.paused_at).total_seconds()
            elapsed_seconds -= paused_seconds

        return int(elapsed_seconds / 60)

    @property
    def remaining_minutes(self):
        """Get remaining time in minutes for this session."""
        return max(0, self.planned_duration - self.elapsed_minutes)

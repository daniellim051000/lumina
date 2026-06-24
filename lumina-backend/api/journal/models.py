"""Journal models for Lumina."""

from datetime import date

from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.db import models

# Reuse the established sanitization/validation helpers from the task app.
from api.task.models import sanitize_text_input, validate_text_length


class JournalEntry(models.Model):
    """A dated journal entry belonging to a user."""

    MOOD_CHOICES = [
        ("great", "Great"),
        ("good", "Good"),
        ("okay", "Okay"),
        ("bad", "Bad"),
        ("awful", "Awful"),
        ("", "No mood"),
    ]

    title = models.CharField(max_length=255, help_text="The entry title")
    content = models.TextField(blank=True, help_text="The journal entry body")
    mood = models.CharField(
        max_length=10,
        choices=MOOD_CHOICES,
        blank=True,
        default="",
        help_text="Optional mood for the entry",
    )
    date = models.DateField(
        default=date.today, help_text="The date this entry is for"
    )
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="journal_entries"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-date", "-created_at"]
        verbose_name_plural = "journal entries"

    def clean(self):
        """Validate and sanitize journal entry data."""
        super().clean()

        # Sanitize text inputs
        if self.title:
            self.title = sanitize_text_input(self.title)
        if self.content:
            self.content = sanitize_text_input(self.content)
            validate_text_length(self.content, 50000)

        # Validate title content and length
        if not self.title or len(self.title.strip()) < 1:
            raise ValidationError("Journal entry title cannot be empty.")
        if len(self.title) > 255:
            raise ValidationError(
                "Journal entry title is too long (maximum 255 characters)."
            )

        # Validate mood
        if self.mood and self.mood not in [choice[0] for choice in self.MOOD_CHOICES]:
            raise ValidationError("Invalid mood value.")

    def save(self, *args, **kwargs):
        """Override save to ensure validation."""
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.title} ({self.user.username})"

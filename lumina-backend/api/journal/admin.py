"""Admin configuration for journal models."""

from django.contrib import admin

from .models import JournalEntry


@admin.register(JournalEntry)
class JournalEntryAdmin(admin.ModelAdmin):
    list_display = ["title", "user", "mood", "date", "created_at"]
    list_filter = ["mood", "date", "created_at", "user"]
    search_fields = ["title", "content"]
    ordering = ["user", "-date", "-created_at"]

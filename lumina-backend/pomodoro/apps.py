"""Pomodoro timer Django app configuration."""

from django.apps import AppConfig


class PomodoroConfig(AppConfig):
    """Configuration for the Pomodoro timer app."""

    default_auto_field = "django.db.models.BigAutoField"
    name = "pomodoro"
    verbose_name = "Pomodoro Timer"

"""Django app configuration for the user module."""

from django.apps import AppConfig


class UserConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "api.user"
    verbose_name = "User Accounts"

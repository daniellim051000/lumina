"""URL configuration for Pomodoro timer app."""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    PomodoroPresetViewSet,
    PomodoroSessionViewSet,
    PomodoroSettingsViewSet,
)

# Create router and register viewsets
router = DefaultRouter()
router.register(r"settings", PomodoroSettingsViewSet, basename="pomodoro-settings")
router.register(r"presets", PomodoroPresetViewSet, basename="pomodoro-presets")
router.register(r"sessions", PomodoroSessionViewSet, basename="pomodoro-sessions")

urlpatterns = [
    path("", include(router.urls)),
]

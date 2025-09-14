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
# Settings are handled manually to support singleton pattern (PATCH without ID)
# router.register(r"settings", PomodoroSettingsViewSet, basename="pomodoro-settings")
router.register(r"presets", PomodoroPresetViewSet, basename="pomodoro-presets")
router.register(r"sessions", PomodoroSessionViewSet, basename="pomodoro-sessions")

urlpatterns = [
    # Custom endpoint for singleton settings update without ID - must come BEFORE router
    path(
        "settings/",
        PomodoroSettingsViewSet.as_view({
            "get": "list",
            "post": "create",
            "patch": "partial_update",
            "delete": "destroy"
        }),
        name="pomodoro-settings-singleton",
    ),
    path("", include(router.urls)),
]

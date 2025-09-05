"""Common module URL configuration."""

from django.urls import path

from .views import api_info, health_check

urlpatterns = [
    path("health/", health_check, name="health-check"),
    path("info/", api_info, name="api-info"),
]

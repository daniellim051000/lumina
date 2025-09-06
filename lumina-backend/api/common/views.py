"""Common utility views."""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response


@api_view(["GET"])
@permission_classes([AllowAny])
def health_check(_request):
    """Test API connectivity with simple health check."""
    return Response(
        {
            "status": "healthy",
            "message": "Lumina API is running successfully",
            "version": "1.0.0",
        }
    )


@api_view(["GET"])
@permission_classes([AllowAny])
def api_info(_request):
    """Provide basic API information for testing Electron-Django communication."""
    return Response(
        {
            "api_name": "Lumina Backend API",
            "description": "REST API for Lumina Desktop Application",
            "framework": "Django REST Framework",
            "database": "PostgreSQL",
            "cors_enabled": True,
            "endpoints": [
                "/api/health/",
                "/api/info/",
                "/api/auth/signup/",
                "/api/auth/signin/",
                "/api/auth/logout/",
                "/api/auth/refresh/",
                "/api/auth/profile/",
                "/api/auth/change-password/",
            ],
        }
    )

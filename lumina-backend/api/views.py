from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate
from django.contrib.auth.models import User


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """
    Simple health check endpoint to test API connectivity
    """
    return Response({
        'status': 'healthy',
        'message': 'Lumina API is running successfully',
        'version': '1.0.0'
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def api_info(request):
    """
    Provides basic API information for testing Electron-Django communication
    """
    return Response({
        'api_name': 'Lumina Backend API',
        'description': 'REST API for Lumina Desktop Application',
        'framework': 'Django REST Framework',
        'database': 'PostgreSQL',
        'cors_enabled': True,
        'endpoints': [
            '/api/health/',
            '/api/info/',
        ]
    })

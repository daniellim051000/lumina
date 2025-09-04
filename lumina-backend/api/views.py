from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView
from .serializers import (
    UserRegistrationSerializer,
    UserLoginSerializer, 
    UserProfileSerializer,
    TokenSerializer
)


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
            '/api/auth/signup/',
            '/api/auth/signin/',
            '/api/auth/logout/',
            '/api/auth/refresh/',
            '/api/auth/profile/',
        ]
    })


class SignUpView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            tokens = TokenSerializer.get_tokens_for_user(user)
            user_data = UserProfileSerializer(user).data
            
            return Response({
                'message': 'User registered successfully',
                'user': user_data,
                'access_token': tokens['access_token'],
                'refresh_token': tokens['refresh_token']
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SignInView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserLoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            tokens = TokenSerializer.get_tokens_for_user(user)
            user_data = UserProfileSerializer(user).data
            
            return Response({
                'message': 'Login successful',
                'user': user_data,
                'access_token': tokens['access_token'],
                'refresh_token': tokens['refresh_token']
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_401_UNAUTHORIZED)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh_token')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            return Response({
                'message': 'Logout successful'
            }, status=status.HTTP_200_OK)
        except Exception:
            return Response({
                'error': 'Invalid token'
            }, status=status.HTTP_400_BAD_REQUEST)


class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request):
        serializer = UserProfileSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

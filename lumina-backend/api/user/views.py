"""User authentication and profile views."""

import logging

from django.conf import settings
from django.utils.decorators import method_decorator
from django_ratelimit.decorators import ratelimit
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView

logger = logging.getLogger(__name__)


def set_jwt_cookies(response, tokens):
    """Set JWT tokens as httpOnly cookies."""
    response.set_cookie(
        settings.JWT_COOKIE_NAME,
        tokens["access_token"],
        max_age=settings.JWT_COOKIE_MAX_AGE,
        httponly=settings.JWT_COOKIE_HTTPONLY,
        secure=settings.JWT_COOKIE_SECURE,
        samesite=settings.JWT_COOKIE_SAMESITE,
    )
    response.set_cookie(
        settings.JWT_REFRESH_COOKIE_NAME,
        tokens["refresh_token"],
        max_age=settings.JWT_REFRESH_COOKIE_MAX_AGE,
        httponly=settings.JWT_COOKIE_HTTPONLY,
        secure=settings.JWT_COOKIE_SECURE,
        samesite=settings.JWT_COOKIE_SAMESITE,
    )
    return response


def clear_jwt_cookies(response):
    """Clear JWT cookies on logout."""
    response.delete_cookie(
        settings.JWT_COOKIE_NAME,
        samesite=settings.JWT_COOKIE_SAMESITE,
    )
    response.delete_cookie(
        settings.JWT_REFRESH_COOKIE_NAME,
        samesite=settings.JWT_COOKIE_SAMESITE,
    )
    return response

from .serializers import (
    PasswordChangeSerializer,
    TokenSerializer,
    UserLoginSerializer,
    UserProfileSerializer,
    UserRegistrationSerializer,
)


@method_decorator(
    ratelimit(key="ip", rate=settings.AUTH_SIGNUP_RATE_LIMIT, method="POST"),
    name="post",
)
class SignUpView(APIView):
    """User registration view with rate limiting."""

    permission_classes = [AllowAny]

    def post(self, request):
        """Handle user registration."""
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            try:
                user = serializer.save()
                tokens = TokenSerializer.get_tokens_for_user(user)
                user_data = UserProfileSerializer(user).data

                logger.info(f"User registered successfully: {user.username}")
                response = Response(
                    {
                        "message": "User registered successfully",
                        "user": user_data,
                    },
                    status=status.HTTP_201_CREATED,
                )
                return set_jwt_cookies(response, tokens)
            except Exception as e:
                logger.error(
                    f"Registration failed for user: {request.data.get('username', 'unknown')}: {str(e)}"
                )
                return Response(
                    {"error": "Registration failed. Please try again."},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

        logger.warning(
            f"Registration attempt with invalid data: {list(serializer.errors.keys())}"
        )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@method_decorator(
    ratelimit(key="ip", rate=settings.AUTH_SIGNIN_RATE_LIMIT, method="POST"),
    name="post",
)
class SignInView(APIView):
    """User login view with rate limiting."""

    permission_classes = [AllowAny]

    def post(self, request):
        """Handle user login."""
        serializer = UserLoginSerializer(data=request.data)
        if serializer.is_valid():
            try:
                user = serializer.validated_data["user"]
                tokens = TokenSerializer.get_tokens_for_user(user)
                user_data = UserProfileSerializer(user).data

                logger.info(f"User logged in successfully: {user.username}")
                response = Response(
                    {
                        "message": "Login successful",
                        "user": user_data,
                    },
                    status=status.HTTP_200_OK,
                )
                return set_jwt_cookies(response, tokens)
            except Exception as e:
                logger.error(
                    f"Login failed for user: {request.data.get('username', 'unknown')}: {str(e)}"
                )
                return Response(
                    {"error": "Login failed. Please try again."},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

        # Log failed login attempts without exposing whether username exists
        username = request.data.get("username", "unknown")
        logger.warning(f"Failed login attempt for username: {username}")

        # Always return generic error message
        return Response(
            {"non_field_errors": ["Invalid credentials"]},
            status=status.HTTP_401_UNAUTHORIZED,
        )


class LogoutView(APIView):
    """User logout view with token blacklisting."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Handle user logout and token blacklisting."""
        try:
            # Try to get refresh token from cookies first, then from request data
            refresh_token = request.COOKIES.get(settings.JWT_REFRESH_COOKIE_NAME)
            if not refresh_token:
                refresh_token = request.data.get("refresh_token")
            
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
                logger.info(f"User logged out successfully: {request.user.username}")
            else:
                logger.warning(
                    f"Logout attempt without refresh token: {request.user.username}"
                )

            response = Response({"message": "Logout successful"}, status=status.HTTP_200_OK)
            return clear_jwt_cookies(response)
        except Exception as e:
            logger.error(f"Logout failed for user {request.user.username}: {str(e)}")
            response = Response(
                {"error": "Logout failed. Please try again."},
                status=status.HTTP_400_BAD_REQUEST,
            )
            # Clear cookies even if logout fails
            return clear_jwt_cookies(response)


class UserProfileView(APIView):
    """User profile view."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request):
        serializer = UserProfileSerializer(
            request.user, data=request.data, partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PasswordChangeView(APIView):
    """Password change view."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = PasswordChangeSerializer(
            data=request.data, context={"request": request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "Password changed successfully"}, status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class JWTCookieTokenRefreshView(APIView):
    """
    Custom token refresh view that reads refresh token from cookies
    and sets new access token as httpOnly cookie.
    """
    
    permission_classes = [AllowAny]
    
    def post(self, request):
        """Handle token refresh using cookies."""
        try:
            # Get refresh token from cookies
            refresh_token = request.COOKIES.get(settings.JWT_REFRESH_COOKIE_NAME)
            if not refresh_token:
                return Response(
                    {"error": "Refresh token not found"},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            # Create refresh token instance and get new access token
            token = RefreshToken(refresh_token)
            new_access_token = str(token.access_token)
            
            # If rotation is enabled, get new refresh token
            new_refresh_token = str(token) if settings.SIMPLE_JWT.get('ROTATE_REFRESH_TOKENS', False) else refresh_token
            
            tokens = {
                "access_token": new_access_token,
                "refresh_token": new_refresh_token
            }
            
            response = Response(
                {"message": "Token refreshed successfully"},
                status=status.HTTP_200_OK
            )
            
            return set_jwt_cookies(response, tokens)
            
        except Exception as e:
            logger.error(f"Token refresh failed: {str(e)}")
            return Response(
                {"error": "Token refresh failed"},
                status=status.HTTP_401_UNAUTHORIZED
            )

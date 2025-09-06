"""Custom authentication classes for JWT token handling.

This module provides enhanced JWT authentication for the Lumina API that supports
both httpOnly cookies and Authorization headers for flexible token handling.

Features:
- Secure httpOnly cookie authentication for web applications
- Fallback to Authorization header for API clients and mobile apps
- Enhanced error handling and token validation
- Compatible with Django REST Framework and SimpleJWT

Classes:
    JWTCookieAuthentication: Enhanced JWT authentication with cookie support

Security Considerations:
- httpOnly cookies prevent XSS attacks on tokens
- Secure cookie settings prevent MITM attacks over HTTP
- Proper token validation and error handling
- Graceful fallback mechanisms
"""

from django.conf import settings
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError


class JWTCookieAuthentication(JWTAuthentication):
    """Custom JWT authentication that reads tokens from httpOnly cookies.

    This authentication class extends SimpleJWT's JWTAuthentication to support
    secure httpOnly cookies as the primary token source, with fallback to the
    standard Authorization header for API clients.

    Authentication Flow:
        1. Check for JWT token in httpOnly cookies (primary method)
        2. If not found, check Authorization header (fallback)
        3. Validate token and return authenticated user
        4. Handle token errors gracefully with appropriate responses

    Security Benefits:
        - httpOnly cookies prevent XSS token theft
        - Automatic secure cookie handling
        - CSRF protection through cookie SameSite settings
        - Backward compatibility with header-based authentication
    """

    def authenticate(self, request):
        """Authenticate request using JWT token from cookies or Authorization header.

        This method implements a dual authentication strategy:
        1. Primary: Extract JWT token from httpOnly cookies
        2. Fallback: Use standard Authorization header

        Args:
            request (HttpRequest): The incoming request object

        Returns:
            tuple: (User, Token) if authentication succeeds
            None: If no authentication credentials are provided

        Raises:
            InvalidToken: If token is present but invalid

        """
        # First try to get token from cookies
        raw_token = request.COOKIES.get(settings.JWT_COOKIE_NAME)

        if raw_token is None:
            # Fallback to standard Authorization header
            return super().authenticate(request)

        try:
            validated_token = self.get_validated_token(raw_token)
            user = self.get_user(validated_token)
            return (user, validated_token)
        except TokenError as e:
            # If cookie token is invalid, try Authorization header as fallback
            header_result = super().authenticate(request)
            if header_result is not None:
                return header_result
            raise InvalidToken(e.args[0]) from e

    def authenticate_header(self, request):
        """Return the authentication header for challenge responses.

        This method is called by DRF when authentication fails to provide
        the appropriate WWW-Authenticate header for 401 responses.

        Args:
            request (HttpRequest): The incoming request object

        Returns:
            str: The authentication scheme name for the WWW-Authenticate header

        """
        return "Bearer"

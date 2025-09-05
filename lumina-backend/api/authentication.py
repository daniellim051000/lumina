"""Custom authentication classes for JWT token handling."""

from django.conf import settings
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError


class JWTCookieAuthentication(JWTAuthentication):
    """Custom JWT authentication that reads tokens from httpOnly cookies.
    Falls back to standard Authorization header if cookies are not present.
    """

    def authenticate(self, request):
        """Authenticate request using JWT token from cookies or Authorization header."""
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
        """Return the authentication header for challenge responses."""
        return "Bearer"

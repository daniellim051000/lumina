"""Pytest configuration and fixtures for lumina backend tests."""

import os

import django
import pytest
from django.conf import settings

# Configure Django settings for tests
if not settings.configured:
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "lumina.settings")
    django.setup()


# Override cache settings for testing to avoid Redis rate limiting issues
@pytest.fixture(scope="session", autouse=True)
def configure_test_settings():
    """Override Django settings for testing."""
    settings.CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.dummy.DummyCache",
        }
    }
    # Also disable rate limiting by setting a high limit for tests
    settings.RATELIMIT_ENABLE = getattr(settings, "RATELIMIT_ENABLE", True)


from django.contrib.auth.models import User
from django.test import RequestFactory
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken


@pytest.fixture
def api_client():
    """Fixture for DRF API client."""
    return APIClient()


@pytest.fixture
def request_factory():
    """Fixture for Django request factory."""
    return RequestFactory()


@pytest.fixture
def user_data():
    """Fixture for user registration data."""
    return {
        "username": "testuser",
        "email": "test@example.com",
        "password": "TestPass123!",
        "password_confirm": "TestPass123!",
        "first_name": "Test",
        "last_name": "User",
    }


@pytest.fixture
def user(db):
    """Fixture for creating a test user."""
    return User.objects.create_user(
        username="testuser",
        email="test@example.com",
        password="TestPass123!",
        first_name="Test",
        last_name="User",
    )


@pytest.fixture
def another_user(db):
    """Fixture for creating another test user."""
    return User.objects.create_user(
        username="anotheruser",
        email="another@example.com",
        password="anotherpass123",
        first_name="Another",
        last_name="User",
    )


@pytest.fixture
def superuser(db):
    """Fixture for creating a superuser."""
    return User.objects.create_superuser(
        username="admin", email="admin@example.com", password="adminpass123"
    )


@pytest.fixture
def tokens(user):
    """Fixture for generating JWT tokens for user."""
    refresh = RefreshToken.for_user(user)
    return {"refresh": str(refresh), "access": str(refresh.access_token)}


@pytest.fixture
def authenticated_client(api_client, tokens):
    """Fixture for authenticated API client."""
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")
    return api_client


@pytest.fixture
def login_data():
    """Fixture for login data."""
    return {"username": "testuser", "password": "TestPass123!"}


@pytest.fixture
def invalid_login_data():
    """Fixture for invalid login data."""
    return {"username": "nonexistent", "password": "wrongpass"}


@pytest.fixture
def password_change_data():
    """Fixture for password change data."""
    return {
        "current_password": "TestPass123!",
        "new_password": "NewTestPass456!",
        "new_password_confirm": "NewTestPass456!",
    }

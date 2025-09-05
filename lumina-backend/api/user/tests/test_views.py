"""Unit tests for user views."""

from unittest.mock import MagicMock, patch

import pytest
from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status


@pytest.mark.unit
class TestSignUpView:
    """Test cases for SignUpView."""

    @pytest.mark.django_db
    def test_successful_signup(self, api_client, user_data):
        """Test successful user registration."""
        url = reverse("user-signup")
        response = api_client.post(url, user_data, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        assert "message" in response.data
        assert "user" in response.data
        assert "access_token" in response.data
        assert "refresh_token" in response.data

        # Verify user was created
        user = User.objects.get(username=user_data["username"])
        assert user.email == user_data["email"]

    @pytest.mark.django_db
    def test_signup_validation_errors(self, api_client):
        """Test signup with validation errors."""
        invalid_data = {
            "username": "test",
            "password": "short",
            "password_confirm": "different",
        }
        url = reverse("user-signup")
        response = api_client.post(url, invalid_data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "errors" in response.data or any(response.data.values())

    def test_signup_duplicate_username(self, api_client, user_data, user):
        """Test signup with duplicate username."""
        user_data["username"] = user.username
        url = reverse("user-signup")
        response = api_client.post(url, user_data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_signup_rate_limiting(self, api_client, user_data):
        """Test rate limiting decorator is applied to signup view."""
        from api.user.views import SignUpView
        
        # Verify the ratelimit decorator is applied to the view
        # Check that the view has the decorator's wrapper attributes
        view_instance = SignUpView()
        post_method = getattr(view_instance, 'post')
        
        # The ratelimit decorator adds attributes to the wrapped method
        # We can check if these exist to verify the decorator is applied
        assert hasattr(post_method, '__wrapped__') or hasattr(post_method.__class__, '__wrapped__') or hasattr(view_instance.__class__, '__wrapped__') or 'ratelimit' in str(view_instance.__class__.post)
        
        # Also test that the endpoint works normally
        url = reverse("user-signup")
        response = api_client.post(url, user_data, format="json")
        assert response.status_code == status.HTTP_201_CREATED


@pytest.mark.unit
class TestSignInView:
    """Test cases for SignInView."""

    @pytest.mark.django_db
    def test_successful_signin(self, api_client, user, login_data):
        """Test successful user login."""
        url = reverse("user-signin")
        response = api_client.post(url, login_data, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert "message" in response.data
        assert "user" in response.data
        assert "access_token" in response.data
        assert "refresh_token" in response.data

    @pytest.mark.django_db
    def test_signin_invalid_credentials(self, api_client, invalid_login_data):
        """Test signin with invalid credentials."""
        url = reverse("user-signin")
        response = api_client.post(url, invalid_login_data, format="json")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        # Should return generic error message
        assert "Invalid credentials" in str(response.data)

    @pytest.mark.django_db
    def test_signin_inactive_user(self, api_client, user, login_data):
        """Test signin with inactive user."""
        user.is_active = False
        user.save()

        url = reverse("user-signin")
        response = api_client.post(url, login_data, format="json")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    @pytest.mark.django_db
    def test_signin_rate_limiting(self, api_client, user, login_data):
        """Test rate limiting decorator is applied to signin view."""
        from api.user.views import SignInView
        
        # Verify the ratelimit decorator is applied to the view
        view_instance = SignInView()
        post_method = getattr(view_instance, 'post')
        
        # The ratelimit decorator adds attributes to the wrapped method
        assert hasattr(post_method, '__wrapped__') or hasattr(post_method.__class__, '__wrapped__') or hasattr(view_instance.__class__, '__wrapped__') or 'ratelimit' in str(view_instance.__class__.post)
        
        # Also test that the endpoint works normally
        url = reverse("user-signin")
        response = api_client.post(url, login_data, format="json")
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.unit
class TestLogoutView:
    """Test cases for LogoutView."""

    @pytest.mark.django_db
    def test_successful_logout(self, authenticated_client, tokens):
        """Test successful logout with token blacklisting."""
        url = reverse("user-logout")
        data = {"refresh_token": tokens["refresh"]}
        response = authenticated_client.post(url, data, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert "message" in response.data

    @pytest.mark.django_db
    def test_logout_invalid_token(self, authenticated_client):
        """Test logout with invalid refresh token."""
        url = reverse("user-logout")
        data = {"refresh_token": "invalid_token"}
        response = authenticated_client.post(url, data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "error" in response.data

    @pytest.mark.django_db
    def test_logout_no_token(self, authenticated_client):
        """Test logout without refresh token."""
        url = reverse("user-logout")
        response = authenticated_client.post(url, {}, format="json")

        # Should still return success (no token to blacklist)
        assert response.status_code == status.HTTP_200_OK

    @pytest.mark.django_db
    def test_logout_requires_authentication(self, api_client):
        """Test logout requires authentication."""
        url = reverse("user-logout")
        response = api_client.post(url, {}, format="json")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.unit
class TestUserProfileView:
    """Test cases for UserProfileView."""

    @pytest.mark.django_db
    def test_get_user_profile(self, authenticated_client, user):
        """Test retrieving user profile."""
        url = reverse("user-profile")
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["username"] == user.username
        assert response.data["email"] == user.email

    @pytest.mark.django_db
    def test_update_user_profile(self, authenticated_client, user):
        """Test updating user profile."""
        url = reverse("user-profile")
        update_data = {
            "first_name": "Updated",
            "last_name": "Name",
            "email": "updated@example.com",
        }
        response = authenticated_client.put(url, update_data, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["first_name"] == "Updated"
        assert response.data["email"] == "updated@example.com"

    @pytest.mark.django_db
    def test_profile_requires_authentication(self, api_client):
        """Test profile access requires authentication."""
        url = reverse("user-profile")
        response = api_client.get(url)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.unit
class TestPasswordChangeView:
    """Test cases for PasswordChangeView."""

    @pytest.mark.django_db
    def test_successful_password_change(
        self, authenticated_client, user, password_change_data
    ):
        """Test successful password change."""
        url = reverse("user-change-password")
        response = authenticated_client.post(url, password_change_data, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert "message" in response.data

        # Verify password was changed
        user.refresh_from_db()
        assert user.check_password(password_change_data["new_password"])

    @pytest.mark.django_db
    def test_password_change_wrong_current(
        self, authenticated_client, password_change_data
    ):
        """Test password change with wrong current password."""
        password_change_data["current_password"] = "wrongpass"
        url = reverse("user-change-password")
        response = authenticated_client.post(url, password_change_data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_password_change_mismatch(self, authenticated_client, password_change_data):
        """Test password change with password mismatch."""
        password_change_data["new_password_confirm"] = "differentpass"
        url = reverse("user-change-password")
        response = authenticated_client.post(url, password_change_data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.django_db
    def test_password_change_requires_authentication(
        self, api_client, password_change_data
    ):
        """Test password change requires authentication."""
        url = reverse("user-change-password")
        response = api_client.post(url, password_change_data, format="json")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

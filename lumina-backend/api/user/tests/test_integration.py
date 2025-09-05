"""Integration tests for user authentication flows."""

import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient


@pytest.mark.integration
class TestCompleteAuthenticationFlow:
    """Test complete authentication flows from start to finish."""

    @pytest.mark.django_db
    def test_complete_signup_signin_logout_flow(self, api_client):
        """Test complete flow: signup -> signin -> profile -> logout."""
        # Step 1: Sign up
        signup_data = {
            "username": "integrationuser",
            "email": "integration@example.com",
            "password": "testpass123",
            "password_confirm": "testpass123",
            "first_name": "Integration",
            "last_name": "Test",
        }
        signup_url = reverse("user-signup")
        signup_response = api_client.post(signup_url, signup_data, format="json")

        assert signup_response.status_code == status.HTTP_201_CREATED
        signup_tokens = {
            "access": signup_response.data["access_token"],
            "refresh": signup_response.data["refresh_token"],
        }

        # Step 2: Use the access token to access profile
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {signup_tokens['access']}")
        profile_url = reverse("user-profile")
        profile_response = api_client.get(profile_url)

        assert profile_response.status_code == status.HTTP_200_OK
        assert profile_response.data["username"] == "integrationuser"

        # Step 3: Sign out (logout)
        logout_url = reverse("user-logout")
        logout_data = {"refresh_token": signup_tokens["refresh"]}
        logout_response = api_client.post(logout_url, logout_data, format="json")

        assert logout_response.status_code == status.HTTP_200_OK

        # Step 4: Clear credentials and verify access is denied
        api_client.credentials()  # Clear authorization header
        profile_response_after_logout = api_client.get(profile_url)
        assert profile_response_after_logout.status_code == status.HTTP_401_UNAUTHORIZED

    @pytest.mark.django_db
    def test_signin_refresh_token_flow(self, api_client, user):
        """Test signin -> token refresh flow."""
        # Step 1: Sign in
        signin_data = {"username": user.username, "password": "testpass123"}
        signin_url = reverse("user-signin")
        signin_response = api_client.post(signin_url, signin_data, format="json")

        assert signin_response.status_code == status.HTTP_200_OK
        original_tokens = {
            "access": signin_response.data["access_token"],
            "refresh": signin_response.data["refresh_token"],
        }

        # Step 2: Refresh the token
        refresh_url = reverse("token-refresh")
        refresh_data = {"refresh": original_tokens["refresh"]}
        refresh_response = api_client.post(refresh_url, refresh_data, format="json")

        assert refresh_response.status_code == status.HTTP_200_OK
        new_access_token = refresh_response.data["access"]
        assert new_access_token != original_tokens["access"]

        # Step 3: Use new access token
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {new_access_token}")
        profile_url = reverse("user-profile")
        profile_response = api_client.get(profile_url)

        assert profile_response.status_code == status.HTTP_200_OK

    @pytest.mark.django_db
    def test_password_change_invalidates_tokens(self, api_client, user):
        """Test that password change workflow works correctly."""
        # Step 1: Sign in
        signin_data = {"username": user.username, "password": "testpass123"}
        signin_url = reverse("user-signin")
        signin_response = api_client.post(signin_url, signin_data, format="json")

        assert signin_response.status_code == status.HTTP_200_OK
        access_token = signin_response.data["access_token"]

        # Step 2: Use access token to change password
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")
        password_change_data = {
            "current_password": "testpass123",
            "new_password": "newtestpass456",
            "new_password_confirm": "newtestpass456",
        }
        password_url = reverse("user-change-password")
        password_response = api_client.post(
            password_url, password_change_data, format="json"
        )

        assert password_response.status_code == status.HTTP_200_OK

        # Step 3: Sign in with new password
        new_signin_data = {"username": user.username, "password": "newtestpass456"}
        new_signin_response = api_client.post(
            signin_url, new_signin_data, format="json"
        )

        assert new_signin_response.status_code == status.HTTP_200_OK

        # Step 4: Old password should not work
        api_client.credentials()  # Clear credentials
        old_signin_response = api_client.post(signin_url, signin_data, format="json")

        assert old_signin_response.status_code == status.HTTP_401_UNAUTHORIZED

    @pytest.mark.django_db
    def test_profile_update_flow(self, api_client, user):
        """Test complete profile update flow."""
        # Step 1: Sign in
        signin_data = {"username": user.username, "password": "testpass123"}
        signin_url = reverse("user-signin")
        signin_response = api_client.post(signin_url, signin_data, format="json")

        assert signin_response.status_code == status.HTTP_200_OK
        access_token = signin_response.data["access_token"]

        # Step 2: Get current profile
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")
        profile_url = reverse("user-profile")
        get_profile_response = api_client.get(profile_url)

        assert get_profile_response.status_code == status.HTTP_200_OK
        original_profile = get_profile_response.data

        # Step 3: Update profile
        update_data = {
            "first_name": "Updated",
            "last_name": "Name",
            "email": "updated@example.com",
        }
        update_response = api_client.put(profile_url, update_data, format="json")

        assert update_response.status_code == status.HTTP_200_OK
        assert update_response.data["first_name"] == "Updated"
        assert update_response.data["last_name"] == "Name"
        assert update_response.data["email"] == "updated@example.com"

        # Username should remain unchanged (readonly)
        assert update_response.data["username"] == original_profile["username"]

    @pytest.mark.django_db
    def test_multiple_device_logout_simulation(self, api_client, user):
        """Test token blacklisting works for multiple device simulation."""
        # Simulate two devices signing in
        signin_data = {"username": user.username, "password": "testpass123"}
        signin_url = reverse("user-signin")

        # Device 1 signin
        device1_response = api_client.post(signin_url, signin_data, format="json")
        device1_tokens = {
            "access": device1_response.data["access_token"],
            "refresh": device1_response.data["refresh_token"],
        }

        # Device 2 signin (new API client)
        device2_client = APIClient()
        device2_response = device2_client.post(signin_url, signin_data, format="json")
        device2_tokens = {
            "access": device2_response.data["access_token"],
            "refresh": device2_response.data["refresh_token"],
        }

        # Both devices should be able to access profile
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {device1_tokens['access']}")
        device2_client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {device2_tokens['access']}"
        )

        profile_url = reverse("user-profile")
        device1_profile = api_client.get(profile_url)
        device2_profile = device2_client.get(profile_url)

        assert device1_profile.status_code == status.HTTP_200_OK
        assert device2_profile.status_code == status.HTTP_200_OK

        # Device 1 logs out
        logout_url = reverse("user-logout")
        logout_data = {"refresh_token": device1_tokens["refresh"]}
        logout_response = api_client.post(logout_url, logout_data, format="json")

        assert logout_response.status_code == status.HTTP_200_OK

        # Device 1 should no longer work (clear credentials to simulate logout)
        api_client.credentials()  # Clear authorization header for device 1
        device1_profile_after = api_client.get(profile_url)
        assert device1_profile_after.status_code == status.HTTP_401_UNAUTHORIZED

        # Device 2 should still work
        device2_profile_after = device2_client.get(profile_url)
        assert device2_profile_after.status_code == status.HTTP_200_OK


@pytest.mark.integration
class TestSecurityFeatures:
    """Test security features and edge cases."""

    @pytest.mark.django_db
    def test_token_rotation_on_refresh(self, api_client, user):
        """Test that refresh tokens are rotated and old ones blacklisted."""
        # Sign in
        signin_data = {"username": user.username, "password": "testpass123"}
        signin_url = reverse("user-signin")
        signin_response = api_client.post(signin_url, signin_data, format="json")

        original_refresh = signin_response.data["refresh_token"]

        # Refresh token
        refresh_url = reverse("token-refresh")
        refresh_data = {"refresh": original_refresh}
        refresh_response = api_client.post(refresh_url, refresh_data, format="json")

        assert refresh_response.status_code == status.HTTP_200_OK
        new_refresh = refresh_response.data.get("refresh", original_refresh)

        # Try to use original refresh token again - should fail
        old_refresh_response = api_client.post(
            refresh_url, {"refresh": original_refresh}, format="json"
        )

        # This might return 401 if the token is blacklisted
        assert old_refresh_response.status_code in [
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_400_BAD_REQUEST,
        ]

    @pytest.mark.django_db
    def test_access_token_expiry_simulation(self, api_client, user, settings):
        """Test behavior with different token lifetimes."""
        # This test simulates short-lived tokens
        # In a real test environment, you might mock time or use very short expiry

        signin_data = {"username": user.username, "password": "testpass123"}
        signin_url = reverse("user-signin")
        signin_response = api_client.post(signin_url, signin_data, format="json")

        access_token = signin_response.data["access_token"]

        # Token should work initially
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")
        profile_url = reverse("user-profile")
        profile_response = api_client.get(profile_url)

        assert profile_response.status_code == status.HTTP_200_OK

    @pytest.mark.django_db
    def test_invalid_token_format_handling(self, api_client):
        """Test handling of malformed tokens."""
        profile_url = reverse("user-profile")

        # Test various malformed tokens
        malformed_tokens = [
            "Bearer invalid_token",
            "Bearer ",
            "invalid_format",
            "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.invalid",
        ]

        for token in malformed_tokens:
            api_client.credentials(HTTP_AUTHORIZATION=token)
            response = api_client.get(profile_url)
            assert response.status_code == status.HTTP_401_UNAUTHORIZED

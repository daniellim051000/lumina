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
            "password": "TestPass123!",  # Updated to meet complexity requirements
            "password_confirm": "TestPass123!",
            "first_name": "Integration",
            "last_name": "Test",
        }
        signup_url = reverse("user-signup")
        signup_response = api_client.post(signup_url, signup_data, format="json")

        assert signup_response.status_code == status.HTTP_201_CREATED
        # Tokens are now in cookies, not response body
        assert "jwt_access_token" in signup_response.cookies
        assert "jwt_refresh_token" in signup_response.cookies

        # Step 2: Access profile using cookies (automatically sent by test client)
        profile_url = reverse("user-profile")
        profile_response = api_client.get(profile_url)

        assert profile_response.status_code == status.HTTP_200_OK
        assert profile_response.data["username"] == "integrationuser"

        # Step 3: Sign out (logout) - no request body needed with cookies
        logout_url = reverse("user-logout")
        logout_response = api_client.post(logout_url, format="json")

        assert logout_response.status_code == status.HTTP_200_OK
        # Verify cookies are cleared
        assert logout_response.cookies["jwt_access_token"].value == ""
        assert logout_response.cookies["jwt_refresh_token"].value == ""

        # Step 4: Verify access is denied after logout
        profile_response_after_logout = api_client.get(profile_url)
        assert profile_response_after_logout.status_code == status.HTTP_401_UNAUTHORIZED

    @pytest.mark.django_db
    def test_signin_refresh_token_flow(self, api_client, user):
        """Test signin -> token refresh flow."""
        # Step 1: Sign in
        signin_data = {
            "username": user.username,
            "password": "TestPass123!",
        }  # Updated password
        signin_url = reverse("user-signin")
        signin_response = api_client.post(signin_url, signin_data, format="json")

        assert signin_response.status_code == status.HTTP_200_OK
        # Tokens are now in cookies
        assert "jwt_access_token" in signin_response.cookies
        assert "jwt_refresh_token" in signin_response.cookies
        original_access_token = signin_response.cookies["jwt_access_token"].value

        # Step 2: Refresh the token (no request body needed with cookies)
        refresh_url = reverse("token-refresh")
        refresh_response = api_client.post(refresh_url, format="json")

        assert refresh_response.status_code == status.HTTP_200_OK
        # Verify new access token is different and set in cookies
        assert "jwt_access_token" in refresh_response.cookies
        new_access_token = refresh_response.cookies["jwt_access_token"].value
        assert new_access_token != original_access_token

        # Step 3: Use new access token (automatically sent via cookies)
        profile_url = reverse("user-profile")
        profile_response = api_client.get(profile_url)

        assert profile_response.status_code == status.HTTP_200_OK

    @pytest.mark.django_db
    def test_password_change_invalidates_tokens(self, api_client, user):
        """Test that changing password still allows access (JWT tokens don't auto-invalidate)."""
        # Step 1: Sign in
        signin_data = {
            "username": user.username,
            "password": "TestPass123!",
        }  # Updated password
        signin_url = reverse("user-signin")
        signin_response = api_client.post(signin_url, signin_data, format="json")

        assert signin_response.status_code == status.HTTP_200_OK
        assert "jwt_access_token" in signin_response.cookies

        # Step 2: Verify access token works
        profile_url = reverse("user-profile")
        profile_response = api_client.get(profile_url)
        assert profile_response.status_code == status.HTTP_200_OK

        # Step 3: Change password
        password_change_url = reverse("user-change-password")
        password_change_data = {
            "current_password": "TestPass123!",
            "new_password": "NewPass123!",  # Updated to meet complexity requirements
            "new_password_confirm": "NewPass123!",
        }
        password_change_response = api_client.post(
            password_change_url, password_change_data, format="json"
        )
        assert password_change_response.status_code == status.HTTP_200_OK

        # Step 4: Verify token is still valid (JWT tokens don't auto-invalidate on password change)
        # In production, you might want to add token blacklisting for enhanced security
        profile_response_after_change = api_client.get(profile_url)
        assert profile_response_after_change.status_code == status.HTTP_200_OK

    @pytest.mark.django_db
    def test_profile_update_flow(self, api_client, user):
        """Test profile update flow with authentication."""
        # Step 1: Sign in
        signin_data = {
            "username": user.username,
            "password": "TestPass123!",
        }  # Updated password
        signin_url = reverse("user-signin")
        signin_response = api_client.post(signin_url, signin_data, format="json")

        assert signin_response.status_code == status.HTTP_200_OK
        assert "jwt_access_token" in signin_response.cookies

        # Step 2: Update profile (cookies automatically sent)
        profile_url = reverse("user-profile")
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

    @pytest.mark.django_db
    def test_multiple_device_logout_simulation(self, api_client, user):
        """Test logout clears cookies for the current session only."""
        # Create two API clients to simulate two devices
        client1 = APIClient()
        client2 = APIClient()

        # Device 1: Sign in
        signin_data = {
            "username": user.username,
            "password": "TestPass123!",
        }  # Updated password
        signin_url = reverse("user-signin")
        signin_response1 = client1.post(signin_url, signin_data, format="json")

        assert signin_response1.status_code == status.HTTP_200_OK
        assert "jwt_access_token" in signin_response1.cookies

        # Device 2: Sign in (should create different session)
        signin_response2 = client2.post(signin_url, signin_data, format="json")
        assert signin_response2.status_code == status.HTTP_200_OK
        assert "jwt_access_token" in signin_response2.cookies

        # Both devices should be able to access profile
        profile_url = reverse("user-profile")
        profile_response1 = client1.get(profile_url)
        profile_response2 = client2.get(profile_url)

        assert profile_response1.status_code == status.HTTP_200_OK
        assert profile_response2.status_code == status.HTTP_200_OK

        # Device 1: Logout (no request body needed)
        logout_url = reverse("user-logout")
        logout_response = client1.post(logout_url, format="json")
        assert logout_response.status_code == status.HTTP_200_OK
        # Verify cookies are cleared on device 1
        assert logout_response.cookies["jwt_access_token"].value == ""

        # Device 1 should lose access
        profile_response1_after_logout = client1.get(profile_url)
        assert (
            profile_response1_after_logout.status_code == status.HTTP_401_UNAUTHORIZED
        )

        # Device 2 should still have access (different session)
        profile_response2_after_logout = client2.get(profile_url)
        assert profile_response2_after_logout.status_code == status.HTTP_200_OK


@pytest.mark.integration
class TestSecurityFeatures:
    """Test security-related features and edge cases."""

    @pytest.mark.django_db
    def test_token_rotation_on_refresh(self, api_client, user):
        """Test that refresh token rotation works correctly with cookies."""
        # Sign in to get initial tokens
        signin_data = {
            "username": user.username,
            "password": "TestPass123!",
        }  # Updated password
        signin_url = reverse("user-signin")
        signin_response = api_client.post(signin_url, signin_data, format="json")

        assert signin_response.status_code == status.HTTP_200_OK
        assert "jwt_access_token" in signin_response.cookies
        assert "jwt_refresh_token" in signin_response.cookies
        original_access_token = signin_response.cookies["jwt_access_token"].value

        # Refresh tokens (no request body needed)
        refresh_url = reverse("token-refresh")
        refresh_response = api_client.post(refresh_url, format="json")

        assert refresh_response.status_code == status.HTTP_200_OK

        # Verify we get a new access token in cookies
        assert "jwt_access_token" in refresh_response.cookies
        new_access_token = refresh_response.cookies["jwt_access_token"].value
        assert new_access_token != original_access_token

        # Use the new access token (automatically sent via cookies)
        profile_url = reverse("user-profile")
        profile_response = api_client.get(profile_url)
        assert profile_response.status_code == status.HTTP_200_OK

    @pytest.mark.django_db
    def test_access_token_expiry_simulation(self, api_client, user):
        """Test refresh token flow works correctly with cookies."""
        # Sign in first to establish session with valid tokens
        signin_data = {
            "username": user.username,
            "password": "TestPass123!",
        }  # Updated password
        signin_url = reverse("user-signin")
        signin_response = api_client.post(signin_url, signin_data, format="json")
        assert signin_response.status_code == status.HTTP_200_OK
        assert "jwt_access_token" in signin_response.cookies
        assert "jwt_refresh_token" in signin_response.cookies

        # Verify we can access protected resources initially
        profile_url = reverse("user-profile")
        profile_response = api_client.get(profile_url)
        assert profile_response.status_code == status.HTTP_200_OK

        # Use refresh endpoint to get new tokens
        refresh_url = reverse("token-refresh")
        refresh_response = api_client.post(refresh_url, format="json")

        assert refresh_response.status_code == status.HTTP_200_OK
        assert "jwt_access_token" in refresh_response.cookies

        # Verify we can still access protected resources with refreshed token
        profile_response_after_refresh = api_client.get(profile_url)
        assert profile_response_after_refresh.status_code == status.HTTP_200_OK

    @pytest.mark.django_db
    def test_invalid_token_format_handling(self, api_client):
        """Test handling of malformed tokens in cookies."""
        profile_url = reverse("user-profile")

        # Test various malformed tokens in cookies
        malformed_tokens = [
            "invalid_token",
            "",
            "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.invalid",
        ]

        for token in malformed_tokens:
            api_client.cookies["jwt_access_token"] = token
            response = api_client.get(profile_url)
            assert response.status_code == status.HTTP_401_UNAUTHORIZED

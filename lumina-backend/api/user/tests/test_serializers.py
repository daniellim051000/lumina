"""Unit tests for user serializers."""

import pytest

from api.user.serializers import (
    PasswordChangeSerializer,
    TokenSerializer,
    UserLoginSerializer,
    UserProfileSerializer,
    UserRegistrationSerializer,
)


@pytest.mark.unit
class TestUserRegistrationSerializer:
    """Test cases for UserRegistrationSerializer."""

    @pytest.mark.django_db
    def test_valid_registration_data(self, user_data):
        """Test serializer with valid registration data."""
        serializer = UserRegistrationSerializer(data=user_data)
        assert serializer.is_valid()
        user = serializer.save()
        assert user.username == user_data["username"]
        assert user.email == user_data["email"]
        assert user.first_name == user_data["first_name"]
        assert user.last_name == user_data["last_name"]
        assert user.check_password(user_data["password"])

    @pytest.mark.django_db
    def test_password_mismatch(self, user_data):
        """Test validation error when passwords don't match."""
        user_data["password_confirm"] = "DifferentPass123!"
        serializer = UserRegistrationSerializer(data=user_data)
        assert not serializer.is_valid()
        assert "password_confirm" in serializer.errors
        assert "Passwords don't match" in str(serializer.errors["password_confirm"])

    @pytest.mark.django_db
    def test_missing_required_fields(self):
        """Test validation error when required fields are missing."""
        incomplete_data = {"username": "test"}
        serializer = UserRegistrationSerializer(data=incomplete_data)
        assert not serializer.is_valid()
        assert "password" in serializer.errors
        assert "password_confirm" in serializer.errors

    @pytest.mark.django_db
    def test_short_password(self, user_data):
        """Test validation error for password less than 8 characters."""
        user_data["password"] = "short"
        user_data["password_confirm"] = "short"
        serializer = UserRegistrationSerializer(data=user_data)
        assert not serializer.is_valid()
        assert "password" in serializer.errors

    @pytest.mark.django_db
    def test_duplicate_username(self, user_data, user):
        """Test validation error for duplicate username."""
        user_data["username"] = user.username
        serializer = UserRegistrationSerializer(data=user_data)
        assert not serializer.is_valid()
        assert "username" in serializer.errors

    @pytest.mark.django_db
    def test_password_not_set_twice(self, user_data):
        """Test that password is not set twice (bug fix)."""
        serializer = UserRegistrationSerializer(data=user_data)
        assert serializer.is_valid()
        user = serializer.save()
        # Verify password works (if it was set twice, it would fail)
        assert user.check_password(user_data["password"])

    @pytest.mark.django_db
    def test_password_complexity_missing_uppercase(self, user_data):
        """Test validation error for password without uppercase letter."""
        weak_password = "password123!"
        user_data["password"] = weak_password
        user_data["password_confirm"] = weak_password
        serializer = UserRegistrationSerializer(data=user_data)
        assert not serializer.is_valid()
        assert "uppercase letter" in str(serializer.errors)

    @pytest.mark.django_db
    def test_password_complexity_missing_lowercase(self, user_data):
        """Test validation error for password without lowercase letter."""
        weak_password = "PASSWORD123!"
        user_data["password"] = weak_password
        user_data["password_confirm"] = weak_password
        serializer = UserRegistrationSerializer(data=user_data)
        assert not serializer.is_valid()
        assert "lowercase letter" in str(serializer.errors)

    @pytest.mark.django_db
    def test_password_complexity_missing_number(self, user_data):
        """Test validation error for password without number."""
        weak_password = "UncommonPasswordWithoutNumber!"
        user_data["password"] = weak_password
        user_data["password_confirm"] = weak_password
        serializer = UserRegistrationSerializer(data=user_data)
        assert not serializer.is_valid()
        assert "number" in str(serializer.errors)

    @pytest.mark.django_db
    def test_password_complexity_missing_special_char(self, user_data):
        """Test validation error for password without special character."""
        weak_password = "UncommonPassword123WithoutSpecialChar"
        user_data["password"] = weak_password
        user_data["password_confirm"] = weak_password
        serializer = UserRegistrationSerializer(data=user_data)
        assert not serializer.is_valid()
        assert "special character" in str(serializer.errors)

    @pytest.mark.django_db
    def test_password_complexity_valid_strong_password(self, user_data):
        """Test that a strong password passes all validation."""
        strong_password = "StrongPassword123!"
        user_data["password"] = strong_password
        user_data["password_confirm"] = strong_password
        serializer = UserRegistrationSerializer(data=user_data)
        assert serializer.is_valid()
        user = serializer.save()
        assert user.check_password(strong_password)


@pytest.mark.unit
class TestUserLoginSerializer:
    """Test cases for UserLoginSerializer."""

    @pytest.mark.django_db
    def test_valid_login(self, user, login_data):
        """Test serializer with valid login credentials."""
        serializer = UserLoginSerializer(data=login_data)
        assert serializer.is_valid()
        assert serializer.validated_data["user"] == user

    @pytest.mark.django_db
    def test_invalid_credentials(self, user, invalid_login_data):
        """Test generic error message for invalid credentials."""
        serializer = UserLoginSerializer(data=invalid_login_data)
        assert not serializer.is_valid()
        assert "Invalid credentials" in str(serializer.errors)

    @pytest.mark.django_db
    def test_inactive_user(self, user, login_data):
        """Test validation error for inactive user."""
        user.is_active = False
        user.save()
        serializer = UserLoginSerializer(data=login_data)
        assert not serializer.is_valid()
        assert "Invalid credentials" in str(serializer.errors)

    @pytest.mark.django_db
    def test_missing_username(self):
        """Test validation error when username is missing."""
        data = {"password": "testpass123"}
        serializer = UserLoginSerializer(data=data)
        assert not serializer.is_valid()
        assert "Username is required" in str(serializer.errors)

    @pytest.mark.django_db
    def test_missing_password(self):
        """Test validation error when password is missing."""
        data = {"username": "testuser"}
        serializer = UserLoginSerializer(data=data)
        assert not serializer.is_valid()
        assert "Password is required" in str(serializer.errors)

    @pytest.mark.django_db
    def test_wrong_password(self, user):
        """Test generic error for wrong password."""
        data = {"username": user.username, "password": "wrongpass"}
        serializer = UserLoginSerializer(data=data)
        assert not serializer.is_valid()
        assert "Invalid credentials" in str(serializer.errors)


@pytest.mark.unit
class TestUserProfileSerializer:
    """Test cases for UserProfileSerializer."""

    @pytest.mark.django_db
    def test_serialize_user_profile(self, user):
        """Test serializing user profile data."""
        serializer = UserProfileSerializer(user)
        data = serializer.data
        assert data["id"] == user.id
        assert data["username"] == user.username
        assert data["email"] == user.email
        assert data["first_name"] == user.first_name
        assert data["last_name"] == user.last_name
        assert "date_joined" in data

    @pytest.mark.django_db
    def test_update_profile(self, user):
        """Test updating user profile."""
        update_data = {
            "first_name": "Updated",
            "last_name": "Name",
            "email": "updated@example.com",
        }
        serializer = UserProfileSerializer(user, data=update_data, partial=True)
        assert serializer.is_valid()
        updated_user = serializer.save()
        assert updated_user.first_name == "Updated"
        assert updated_user.last_name == "Name"
        assert updated_user.email == "updated@example.com"

    @pytest.mark.django_db
    def test_readonly_fields_not_updated(self, user):
        """Test that readonly fields cannot be updated."""
        original_username = user.username
        update_data = {"username": "newusername"}
        serializer = UserProfileSerializer(user, data=update_data, partial=True)
        assert serializer.is_valid()
        serializer.save()
        user.refresh_from_db()
        assert user.username == original_username


@pytest.mark.unit
class TestPasswordChangeSerializer:
    """Test cases for PasswordChangeSerializer."""

    @pytest.mark.django_db
    def test_valid_password_change(self, user, password_change_data, request_factory):
        """Test valid password change."""
        request = request_factory.post("/")
        request.user = user
        serializer = PasswordChangeSerializer(
            data=password_change_data, context={"request": request}
        )
        assert serializer.is_valid()
        serializer.save()
        user.refresh_from_db()
        assert user.check_password(password_change_data["new_password"])

    @pytest.mark.django_db
    def test_wrong_current_password(self, user, password_change_data, request_factory):
        """Test validation error for wrong current password."""
        request = request_factory.post("/")
        request.user = user
        password_change_data["current_password"] = "wrongpass"
        serializer = PasswordChangeSerializer(
            data=password_change_data, context={"request": request}
        )
        assert not serializer.is_valid()
        assert "Current password is incorrect" in str(serializer.errors)

    @pytest.mark.django_db
    def test_new_password_mismatch(self, user, password_change_data, request_factory):
        """Test validation error when new passwords don't match."""
        request = request_factory.post("/")
        request.user = user
        password_change_data["new_password_confirm"] = "DifferentPass123!"
        serializer = PasswordChangeSerializer(
            data=password_change_data, context={"request": request}
        )
        assert not serializer.is_valid()
        assert "new_password_confirm" in serializer.errors
        assert "New passwords don't match" in str(
            serializer.errors["new_password_confirm"]
        )

    @pytest.mark.django_db
    def test_new_password_complexity_validation(self, user, request_factory):
        """Test new password complexity validation in password change."""
        request = request_factory.post("/")
        request.user = user

        # Test with weak password
        weak_data = {
            "current_password": "TestPass123!",
            "new_password": "weak",
            "new_password_confirm": "weak",
        }
        serializer = PasswordChangeSerializer(
            data=weak_data, context={"request": request}
        )
        assert not serializer.is_valid()
        assert "new_password" in serializer.errors

    @pytest.mark.django_db
    def test_new_password_strength_requirements(self, user, request_factory):
        """Test all password strength requirements for new password."""
        request = request_factory.post("/")
        request.user = user

        # Test missing uppercase
        data = {
            "current_password": "TestPass123!",
            "new_password": "password123!",
            "new_password_confirm": "password123!",
        }
        serializer = PasswordChangeSerializer(data=data, context={"request": request})
        assert not serializer.is_valid()
        assert "uppercase letter" in str(serializer.errors)

    @pytest.mark.django_db
    def test_short_new_password(self, user, password_change_data, request_factory):
        """Test validation error for short new password."""
        request = request_factory.post("/")
        request.user = user
        password_change_data["new_password"] = "short"
        password_change_data["new_password_confirm"] = "short"
        serializer = PasswordChangeSerializer(
            data=password_change_data, context={"request": request}
        )
        assert not serializer.is_valid()
        assert "new_password" in serializer.errors


@pytest.mark.unit
class TestTokenSerializer:
    """Test cases for TokenSerializer."""

    @pytest.mark.django_db
    def test_get_tokens_for_user(self, user):
        """Test token generation for user."""
        tokens = TokenSerializer.get_tokens_for_user(user)
        assert "access_token" in tokens
        assert "refresh_token" in tokens
        assert isinstance(tokens["access_token"], str)
        assert isinstance(tokens["refresh_token"], str)

    @pytest.mark.django_db
    def test_token_serializer_fields(self, user):
        """Test TokenSerializer field structure."""
        tokens = TokenSerializer.get_tokens_for_user(user)
        user_profile = UserProfileSerializer(user).data

        serializer_data = {
            "access_token": tokens["access_token"],
            "refresh_token": tokens["refresh_token"],
            "user": user_profile,
        }
        serializer = TokenSerializer(data=serializer_data)
        assert serializer.is_valid()

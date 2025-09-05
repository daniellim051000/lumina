"""User module URL configuration."""

from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    JWTCookieTokenRefreshView,
    LogoutView,
    PasswordChangeView,
    SignInView,
    SignUpView,
    UserProfileView,
)

urlpatterns = [
    path("signup/", SignUpView.as_view(), name="user-signup"),
    path("signin/", SignInView.as_view(), name="user-signin"),
    path("logout/", LogoutView.as_view(), name="user-logout"),
    path("refresh/", JWTCookieTokenRefreshView.as_view(), name="token-refresh"),
    path("profile/", UserProfileView.as_view(), name="user-profile"),
    path("change-password/", PasswordChangeView.as_view(), name="user-change-password"),
]

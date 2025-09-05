from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    path('health/', views.health_check, name='health_check'),
    path('info/', views.api_info, name='api_info'),
    
    # Authentication endpoints
    path('auth/signup/', views.SignUpView.as_view(), name='signup'),
    path('auth/signin/', views.SignInView.as_view(), name='signin'),
    path('auth/logout/', views.LogoutView.as_view(), name='logout'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/profile/', views.UserProfileView.as_view(), name='user_profile'),
    path('auth/change-password/', views.PasswordChangeView.as_view(), name='change_password'),
]
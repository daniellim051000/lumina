from django.urls import include, path

urlpatterns = [
    # Common endpoints
    path("", include("api.common.urls")),
    # Authentication endpoints
    path("auth/", include("api.user.urls")),
    # Task management endpoints
    path("", include("api.task.urls")),
    # Todo endpoints (placeholder for future implementation)
    # path('todos/', include('api.todo.urls')),
]

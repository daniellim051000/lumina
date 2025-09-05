# Lumina API Documentation

## Overview

The Lumina API is a Django REST Framework-based backend for task management, providing comprehensive task, project, and label management capabilities with robust authentication, validation, and performance optimization.

## Architecture

### Core Components

- **Models**: Django models with validation, sanitization, and business logic
- **Serializers**: DRF serializers with input validation and data transformation
- **Views**: API views with filtering, pagination, and permission handling
- **Authentication**: JWT-based authentication with cookie and header support
- **Pagination**: Custom pagination classes for different use cases

### Key Features

- 🔐 **Secure Authentication**: JWT tokens with httpOnly cookies and fallback to Authorization headers
- 🛡️ **Input Validation**: Comprehensive validation and sanitization to prevent XSS and injection attacks
- 🚀 **Performance Optimization**: Optimized database queries with select_related and prefetch_related
- 📄 **Pagination**: Flexible pagination with metadata for frontend integration
- 🔍 **Advanced Filtering**: Multiple filter options for tasks including search, priority, projects, and time-based views
- 📊 **Statistics**: Aggregated task statistics for dashboard displays
- 🔄 **Bulk Operations**: Efficient bulk task operations for better UX

## API Endpoints

### Authentication
- `POST /api/auth/register/` - User registration
- `POST /api/auth/login/` - User login (returns JWT tokens)
- `POST /api/auth/logout/` - User logout
- `POST /api/auth/refresh/` - Refresh JWT token
- `GET /api/auth/user/` - Get current user profile
- `PATCH /api/auth/user/` - Update user profile
- `POST /api/auth/change-password/` - Change password

### Tasks
- `GET /api/tasks/` - List tasks with filtering and pagination
- `POST /api/tasks/` - Create new task
- `GET /api/tasks/{id}/` - Get specific task with details
- `PATCH /api/tasks/{id}/` - Update task
- `DELETE /api/tasks/{id}/` - Delete task
- `POST /api/tasks/quick/` - Quick task creation with minimal fields
- `PATCH /api/tasks/bulk/` - Bulk task operations (complete, reorder, etc.)

### Projects
- `GET /api/projects/` - List projects with task counts
- `POST /api/projects/` - Create new project
- `GET /api/projects/{id}/` - Get specific project
- `PATCH /api/projects/{id}/` - Update project
- `DELETE /api/projects/{id}/` - Soft delete project (marks as inactive)

### Labels
- `GET /api/labels/` - List labels
- `POST /api/labels/` - Create new label
- `GET /api/labels/{id}/` - Get specific label
- `PATCH /api/labels/{id}/` - Update label
- `DELETE /api/labels/{id}/` - Delete label

### Comments
- `GET /api/tasks/{task_id}/comments/` - List comments for a task
- `POST /api/tasks/{task_id}/comments/` - Add comment to task
- `GET /api/comments/{id}/` - Get specific comment
- `PATCH /api/comments/{id}/` - Update comment
- `DELETE /api/comments/{id}/` - Delete comment

### Statistics
- `GET /api/tasks/stats/` - Get comprehensive task statistics

## Task Filtering

The task list endpoint supports extensive filtering options:

### Query Parameters

- `view` - Special views: `today`, `week`, `overdue`
- `priority` - Filter by priority: `P1`, `P2`, `P3`, `P4`, or empty for no priority
- `project` - Filter by project ID
- `completed` - Filter by completion status: `true`/`false`
- `search` - Search in title, description, and notes
- `subtasks` - Include subtasks: `include` (excluded by default)
- `parent_task` - Filter by parent task ID for subtasks

### Examples

```bash
# Get today's tasks
GET /api/tasks/?view=today

# Get high priority tasks
GET /api/tasks/?priority=P1

# Search for tasks
GET /api/tasks/?search=meeting

# Get project tasks
GET /api/tasks/?project=5

# Get overdue tasks
GET /api/tasks/?view=overdue

# Combined filters
GET /api/tasks/?priority=P1&project=5&completed=false
```

## Pagination

All list endpoints return paginated results with consistent metadata:

```json
{
  "pagination": {
    "count": 150,
    "next": "http://api.example.com/api/tasks/?page=2",
    "previous": null,
    "current_page": 1,
    "total_pages": 8,
    "page_size": 20
  },
  "results": [...]
}
```

### Pagination Classes

- **StandardResultsSetPagination**: 20 items per page (default for most endpoints)
- **LargeResultsSetPagination**: 50 items per page (tasks list)
- **SmallResultsSetPagination**: 10 items per page (comments)

### Custom Page Size

Use the `page_size` query parameter to customize results per page:

```bash
GET /api/tasks/?page_size=100  # Max 200 for tasks
GET /api/projects/?page_size=50  # Max 100 for projects
```

## Authentication

### JWT Tokens

The API uses JSON Web Tokens (JWT) for authentication with dual support:

1. **httpOnly Cookies** (Recommended for web apps)
   - More secure against XSS attacks
   - Automatic handling by browsers
   - CSRF protection via SameSite settings

2. **Authorization Header** (For API clients)
   - `Authorization: Bearer <token>`
   - Compatible with mobile apps and API clients

### Authentication Flow

1. **Register/Login**: Receive access and refresh tokens
2. **API Requests**: Include token via cookies or header
3. **Token Refresh**: Use refresh token to get new access token
4. **Logout**: Invalidate tokens on server

## Data Models

### Task Model
- **Core Fields**: title, description, notes, priority, dates
- **Relationships**: user, project, parent_task, labels
- **Computed Properties**: is_overdue, subtask_count
- **Validation**: Title length, date logic, priority values
- **Sanitization**: HTML stripping, XSS prevention

### Project Model
- **Core Fields**: name, description, color, position
- **Features**: Hierarchical (parent/sub-projects), soft deletion
- **Validation**: Color format, name uniqueness per user
- **Statistics**: Task counts, completion rates

### Label Model
- **Core Fields**: name, color
- **Features**: Flexible categorization, many-to-many with tasks
- **Validation**: Color format, name uniqueness per user

## Security Features

### Input Validation
- HTML tag stripping to prevent XSS
- Script tag removal for additional security
- Length validation to prevent DoS attacks
- Type validation for all fields

### Authentication Security
- JWT token expiration and refresh
- httpOnly cookies prevent XSS token theft
- CSRF protection via cookie settings
- Secure token storage practices

### Authorization
- User-scoped data access (users only see their own data)
- Permission checks on all endpoints
- Proper error handling without data leakage

## Performance Optimization

### Database Queries
- `select_related()` for foreign key relationships
- `prefetch_related()` for many-to-many relationships
- Aggregated statistics queries for dashboard
- Efficient filtering and indexing

### Response Optimization
- Lightweight serializers for list views
- Full serializers only for detail views
- Pagination to limit response sizes
- Optimized queryset filtering

## Error Handling

### HTTP Status Codes
- `200 OK` - Successful GET/PATCH requests
- `201 Created` - Successful POST requests
- `204 No Content` - Successful DELETE requests
- `400 Bad Request` - Validation errors
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Permission denied
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server errors

### Error Response Format
```json
{
  "error": "Validation failed",
  "details": {
    "title": ["This field is required."],
    "priority": ["Invalid priority value."]
  }
}
```

## Development

### Running Tests
```bash
# Run all tests
python manage.py test

# Run specific test module
python manage.py test api.task.tests.test_models

# Run with coverage
python -m pytest --cov=api --cov-report=term
```

### Code Quality
```bash
# Format code
ruff format .

# Check linting
ruff check .

# Run type checking
mypy api/
```

### API Documentation
The API includes interactive documentation via Django Spectacular:
- Swagger UI: `/api/docs/`
- ReDoc: `/api/redoc/`
- OpenAPI Schema: `/api/schema/`

## Deployment Considerations

### Environment Variables
- `SECRET_KEY` - Django secret key
- `DEBUG` - Debug mode (False in production)
- `DATABASE_URL` - Database connection string
- `CORS_ALLOWED_ORIGINS` - Allowed frontend origins
- `JWT_COOKIE_NAME` - Cookie name for JWT tokens

### Production Settings
- Secure cookie settings (Secure, SameSite)
- CORS configuration for frontend domain
- Database connection pooling
- Static file serving
- Logging configuration

## Contributing

When contributing to the API:

1. **Add Tests**: All new features require comprehensive tests
2. **Document Changes**: Update docstrings and README
3. **Follow Style**: Use ruff for formatting and linting
4. **Validate Input**: Always sanitize and validate user input
5. **Optimize Queries**: Use select_related and prefetch_related
6. **Handle Errors**: Provide meaningful error messages
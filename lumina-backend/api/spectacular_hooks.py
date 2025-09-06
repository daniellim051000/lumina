"""Schema customization hooks for drf-spectacular."""


def preprocessing_filter_spec(endpoints):
    """Preprocess endpoints to filter out unwanted ones."""
    filtered = []
    for path, path_regex, method, callback in endpoints:
        # Keep only API endpoints we want to document
        if path.startswith("/api/"):
            # Exclude internal endpoints if any
            if not any(
                exclude in path
                for exclude in [
                    "/admin/",
                    "/debug/",
                    "/internal/",
                ]
            ):
                filtered.append((path, path_regex, method, callback))
    return filtered


def postprocessing_hook(result, generator, request, public):
    """Post-process the generated schema."""
    # Add custom tags and organize endpoints
    if "paths" in result:
        for path, methods in result["paths"].items():
            for method, operation in methods.items():
                # Clear existing auto-generated tags to avoid duplicates
                operation["tags"] = []

                # Add clean tags based on path patterns
                if "/tasks/" in path:
                    operation["tags"].append("Tasks")
                elif "/projects/" in path:
                    operation["tags"].append("Projects")
                elif "/labels/" in path:
                    operation["tags"].append("Labels")
                elif "/comments/" in path:
                    operation["tags"].append("Comments")
                elif "/auth/" in path:
                    operation["tags"].append("Authentication")
                else:
                    operation["tags"].append("General")

    # Add authentication examples and custom responses
    if "components" in result:
        result["components"].setdefault("examples", {})

        # Add example responses
        result["components"]["examples"]["TaskExample"] = {
            "summary": "Task Example",
            "description": "Example task with all fields",
            "value": {
                "id": 1,
                "title": "Complete project documentation",
                "description": "Write comprehensive API documentation",
                "notes": "Include examples and usage patterns",
                "priority": "P2",
                "date": "2024-01-15",
                "due_date": "2024-01-20",
                "is_completed": False,
                "project": {
                    "id": 1,
                    "name": "Documentation Project",
                    "color": "#3B82F6",
                },
                "labels": [{"id": 1, "name": "documentation", "color": "#10B981"}],
                "subtask_count": 3,
                "completed_subtask_count": 1,
                "is_overdue": False,
            },
        }

        result["components"]["examples"]["ProjectExample"] = {
            "summary": "Project Example",
            "description": "Example project with task counts",
            "value": {
                "id": 1,
                "name": "Website Redesign",
                "description": "Complete redesign of the company website",
                "color": "#8B5CF6",
                "task_count": 15,
                "completed_task_count": 7,
                "is_active": True,
            },
        }

    return result

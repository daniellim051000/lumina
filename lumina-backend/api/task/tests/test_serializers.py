"""Tests for task management serializers."""

from django.test import TestCase
from rest_framework.test import APIRequestFactory

from api.task.serializers import (
    LabelSerializer,
    ProjectSerializer,
    TaskListSerializer,
    TaskQuickCreateSerializer,
    TaskSerializer,
)

from .factories import LabelFactory, ProjectFactory, TaskFactory, UserFactory


class ProjectSerializerTest(TestCase):
    """Test cases for ProjectSerializer."""

    def setUp(self):
        self.user = UserFactory()
        self.factory = APIRequestFactory()

    def test_project_serialization(self):
        """Test project serialization."""
        project = ProjectFactory(user=self.user, name="Test Project")
        serializer = ProjectSerializer(project)

        data = serializer.data
        self.assertEqual(data["name"], "Test Project")
        self.assertEqual(data["user"]["id"], self.user.id)
        self.assertIn("task_count", data)
        self.assertIn("completed_task_count", data)

    def test_project_creation_via_serializer(self):
        """Test project creation via serializer."""
        request = self.factory.post("/")
        request.user = self.user

        data = {
            "name": "New Project",
            "description": "Test description",
            "color": "#FF5733",
        }

        serializer = ProjectSerializer(data=data, context={"request": request})
        self.assertTrue(serializer.is_valid())

        project = serializer.save()
        self.assertEqual(project.user, self.user)
        self.assertEqual(project.name, "New Project")
        self.assertEqual(project.color, "#FF5733")

    def test_project_parent_queryset_filtering(self):
        """Test that parent project queryset is filtered by user."""
        other_user = UserFactory()
        other_project = ProjectFactory(user=other_user)
        user_project = ProjectFactory(user=self.user)

        request = self.factory.post("/")
        request.user = self.user

        serializer = ProjectSerializer(context={"request": request})
        parent_field = serializer.fields["parent"]

        # Should only include projects for the authenticated user
        self.assertIn(user_project, parent_field.queryset)
        self.assertNotIn(other_project, parent_field.queryset)

    def test_task_counts(self):
        """Test task count calculations."""
        project = ProjectFactory(user=self.user)

        # Create tasks with different completion states
        TaskFactory(user=self.user, project=project, is_completed=True)
        TaskFactory(user=self.user, project=project, is_completed=False)
        TaskFactory(user=self.user, project=project, is_completed=True)

        serializer = ProjectSerializer(project)
        data = serializer.data

        self.assertEqual(data["task_count"], 3)
        self.assertEqual(data["completed_task_count"], 2)


class LabelSerializerTest(TestCase):
    """Test cases for LabelSerializer."""

    def setUp(self):
        self.user = UserFactory()
        self.factory = APIRequestFactory()

    def test_label_serialization(self):
        """Test label serialization."""
        label = LabelFactory(user=self.user, name="Test Label")
        serializer = LabelSerializer(label)

        data = serializer.data
        self.assertEqual(data["name"], "Test Label")
        self.assertIn("color", data)
        self.assertIn("created_at", data)

    def test_label_creation_via_serializer(self):
        """Test label creation via serializer."""
        request = self.factory.post("/")
        request.user = self.user

        data = {
            "name": "New Label",
            "color": "#FF5733",
        }

        serializer = LabelSerializer(data=data, context={"request": request})
        self.assertTrue(serializer.is_valid())

        label = serializer.save()
        self.assertEqual(label.user, self.user)
        self.assertEqual(label.name, "New Label")


class TaskSerializerTest(TestCase):
    """Test cases for TaskSerializer."""

    def setUp(self):
        self.user = UserFactory()
        self.project = ProjectFactory(user=self.user)
        self.label = LabelFactory(user=self.user)
        self.factory = APIRequestFactory()

    def test_task_serialization(self):
        """Test task serialization."""
        task = TaskFactory(user=self.user, project=self.project)
        task.labels.add(self.label)

        serializer = TaskSerializer(task)
        data = serializer.data

        self.assertEqual(data["title"], task.title)
        self.assertEqual(data["user"]["id"], self.user.id)
        self.assertEqual(data["project"]["id"], self.project.id)
        self.assertEqual(len(data["labels"]), 1)
        self.assertIn("is_overdue", data)
        self.assertIn("subtask_count", data)
        self.assertIn("completed_subtask_count", data)

    def test_task_creation_via_serializer(self):
        """Test task creation via serializer."""
        request = self.factory.post("/")
        request.user = self.user

        data = {
            "title": "New Task",
            "description": "Test description",
            "priority": "P1",
            "project_id": self.project.id,
        }

        serializer = TaskSerializer(data=data, context={"request": request})
        self.assertTrue(serializer.is_valid(), serializer.errors)

        task = serializer.save()
        self.assertEqual(task.user, self.user)
        self.assertEqual(task.title, "New Task")
        self.assertEqual(task.project, self.project)

    def test_task_update_via_serializer(self):
        """Test task update via serializer."""
        task = TaskFactory(user=self.user)

        request = self.factory.patch("/")
        request.user = self.user

        data = {
            "title": "Updated Task",
            "priority": "P2",
        }

        serializer = TaskSerializer(
            task, data=data, partial=True, context={"request": request}
        )
        self.assertTrue(serializer.is_valid())

        updated_task = serializer.save()
        self.assertEqual(updated_task.title, "Updated Task")
        self.assertEqual(updated_task.priority, "P2")

    def test_task_queryset_filtering(self):
        """Test that related object querysets are filtered by user."""
        other_user = UserFactory()
        other_project = ProjectFactory(user=other_user)
        other_label = LabelFactory(user=other_user)
        other_task = TaskFactory(user=other_user)

        request = self.factory.post("/")
        request.user = self.user

        serializer = TaskSerializer(context={"request": request})

        # Check that querysets only include objects for authenticated user
        self.assertNotIn(other_project, serializer.fields["project_id"].queryset)
        self.assertNotIn(other_label, serializer.fields["label_ids"].queryset)
        self.assertNotIn(other_task, serializer.fields["parent_task"].queryset)

    def test_subtask_creation(self):
        """Test subtask creation via serializer."""
        parent_task = TaskFactory(user=self.user)

        request = self.factory.post("/")
        request.user = self.user

        data = {
            "title": "Subtask",
            "parent_task": parent_task.id,
        }

        serializer = TaskSerializer(data=data, context={"request": request})
        self.assertTrue(serializer.is_valid())

        subtask = serializer.save()
        self.assertEqual(subtask.parent_task, parent_task)


class TaskListSerializerTest(TestCase):
    """Test cases for TaskListSerializer."""

    def setUp(self):
        self.user = UserFactory()
        self.project = ProjectFactory(
            user=self.user, name="Test Project", color="#FF0000"
        )

    def test_task_list_serialization(self):
        """Test task list serialization with minimal fields."""
        task = TaskFactory(user=self.user, project=self.project)

        serializer = TaskListSerializer(task)
        data = serializer.data

        # Should include essential fields
        self.assertIn("title", data)
        self.assertIn("priority", data)
        self.assertIn("is_completed", data)
        self.assertIn("project", data)

        # Should not include heavy fields like description, notes
        self.assertNotIn("description", data)
        self.assertNotIn("notes", data)
        self.assertNotIn("comments", data)

    def test_project_serialization_in_list(self):
        """Test project serialization in task list."""
        task = TaskFactory(user=self.user, project=self.project)

        serializer = TaskListSerializer(task)
        data = serializer.data

        project_data = data["project"]
        self.assertEqual(project_data["id"], self.project.id)
        self.assertEqual(project_data["name"], "Test Project")
        self.assertEqual(project_data["color"], "#FF0000")

    def test_task_without_project(self):
        """Test task list serialization without project."""
        task = TaskFactory(user=self.user, project=None)

        serializer = TaskListSerializer(task)
        data = serializer.data

        self.assertIsNone(data["project"])


class TaskQuickCreateSerializerTest(TestCase):
    """Test cases for TaskQuickCreateSerializer."""

    def setUp(self):
        self.user = UserFactory()
        self.project = ProjectFactory(user=self.user)
        self.factory = APIRequestFactory()

    def test_quick_task_creation(self):
        """Test quick task creation with minimal fields."""
        request = self.factory.post("/")
        request.user = self.user

        data = {
            "title": "Quick Task",
            "priority": "P3",
            "project_id": self.project.id,
        }

        serializer = TaskQuickCreateSerializer(data=data, context={"request": request})
        self.assertTrue(serializer.is_valid())

        task = serializer.save()
        self.assertEqual(task.user, self.user)
        self.assertEqual(task.title, "Quick Task")
        self.assertEqual(task.priority, "P3")
        self.assertEqual(task.project, self.project)

    def test_quick_task_minimal_data(self):
        """Test quick task creation with only title."""
        request = self.factory.post("/")
        request.user = self.user

        data = {
            "title": "Minimal Task",
        }

        serializer = TaskQuickCreateSerializer(data=data, context={"request": request})
        self.assertTrue(serializer.is_valid())

        task = serializer.save()
        self.assertEqual(task.title, "Minimal Task")
        self.assertEqual(task.priority, "")  # Default empty priority

    def test_project_queryset_filtering(self):
        """Test that project queryset is filtered by user."""
        other_user = UserFactory()
        other_project = ProjectFactory(user=other_user)

        request = self.factory.post("/")
        request.user = self.user

        serializer = TaskQuickCreateSerializer(context={"request": request})
        project_field = serializer.fields["project_id"]

        self.assertIn(self.project, project_field.queryset)
        self.assertNotIn(other_project, project_field.queryset)

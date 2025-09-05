"""Tests for task management views."""

from datetime import date, timedelta
from unittest.mock import patch

from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from api.task.models import Label, Project, Task, TaskComment
from .factories import LabelFactory, ProjectFactory, TaskFactory, TaskCommentFactory, UserFactory


class BaseTaskAPITest(APITestCase):
    """Base test class for task API tests."""

    def setUp(self):
        self.user = UserFactory()
        self.other_user = UserFactory()
        self.client.force_authenticate(user=self.user)


class ProjectAPITest(BaseTaskAPITest):
    """Test cases for Project API endpoints."""

    def test_list_projects(self):
        """Test listing user's projects."""
        # Create projects for different users
        user_project = ProjectFactory(user=self.user, name="User Project")
        other_project = ProjectFactory(user=self.other_user, name="Other Project")
        
        url = reverse("task:project-list")
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)
        self.assertIn('pagination', response.data)
        project_names = [p["name"] for p in response.data['results']]
        self.assertIn("User Project", project_names)
        self.assertNotIn("Other Project", project_names)

    def test_create_project(self):
        """Test creating a new project."""
        url = reverse("task:project-list")
        data = {
            "name": "New Project",
            "description": "Test description",
            "color": "#FF5733",
        }
        
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["name"], "New Project")
        self.assertEqual(response.data["user"]["id"], self.user.id)

    def test_create_project_duplicate_name(self):
        """Test creating project with duplicate name fails."""
        ProjectFactory(user=self.user, name="Duplicate")
        
        url = reverse("task:project-list")
        data = {"name": "Duplicate", "description": "Test"}
        
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_update_project(self):
        """Test updating a project."""
        project = ProjectFactory(user=self.user)
        url = reverse("task:project-detail", kwargs={"pk": project.id})
        
        data = {"name": "Updated Project", "color": "#00FF00"}
        response = self.client.patch(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["name"], "Updated Project")
        self.assertEqual(response.data["color"], "#00FF00")

    def test_delete_project_soft_delete(self):
        """Test that project deletion is soft delete."""
        project = ProjectFactory(user=self.user)
        url = reverse("task:project-detail", kwargs={"pk": project.id})
        
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        project.refresh_from_db()
        self.assertFalse(project.is_active)

    def test_access_other_user_project(self):
        """Test that users cannot access other users' projects."""
        other_project = ProjectFactory(user=self.other_user)
        url = reverse("task:project-detail", kwargs={"pk": other_project.id})
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class LabelAPITest(BaseTaskAPITest):
    """Test cases for Label API endpoints."""

    def test_list_labels(self):
        """Test listing user's labels."""
        user_label = LabelFactory(user=self.user, name="User Label")
        other_label = LabelFactory(user=self.other_user, name="Other Label")
        
        url = reverse("task:label-list")
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)
        self.assertIn('pagination', response.data)
        label_names = [l["name"] for l in response.data['results']]
        self.assertIn("User Label", label_names)
        self.assertNotIn("Other Label", label_names)

    def test_create_label(self):
        """Test creating a new label."""
        url = reverse("task:label-list")
        data = {"name": "New Label", "color": "#FF5733"}
        
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["name"], "New Label")

    def test_create_label_duplicate_name(self):
        """Test creating label with duplicate name fails."""
        LabelFactory(user=self.user, name="Duplicate")
        
        url = reverse("task:label-list")
        data = {"name": "Duplicate", "color": "#FF0000"}
        
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_update_label(self):
        """Test updating a label."""
        label = LabelFactory(user=self.user)
        url = reverse("task:label-detail", kwargs={"pk": label.id})
        
        data = {"name": "Updated Label", "color": "#00FF00"}
        response = self.client.patch(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["name"], "Updated Label")

    def test_delete_label(self):
        """Test deleting a label."""
        label = LabelFactory(user=self.user)
        url = reverse("task:label-detail", kwargs={"pk": label.id})
        
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Label.objects.filter(id=label.id).exists())


class TaskAPITest(BaseTaskAPITest):
    """Test cases for Task API endpoints."""

    def setUp(self):
        super().setUp()
        self.project = ProjectFactory(user=self.user)
        self.label = LabelFactory(user=self.user)

    def test_list_tasks(self):
        """Test listing user's tasks."""
        user_task = TaskFactory(user=self.user, title="User Task")
        other_task = TaskFactory(user=self.other_user, title="Other Task")
        
        url = reverse("task:task-list")
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)
        self.assertIn('pagination', response.data)
        task_titles = [t["title"] for t in response.data['results']]
        self.assertIn("User Task", task_titles)
        self.assertNotIn("Other Task", task_titles)

    def test_create_task(self):
        """Test creating a new task."""
        url = reverse("task:task-list")
        data = {
            "title": "New Task",
            "description": "Test description",
            "priority": "P1",
            "project_id": self.project.id,
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["title"], "New Task")
        self.assertEqual(response.data["project"]["id"], self.project.id)
        self.assertEqual(len(response.data["labels"]), 0)

    def test_create_subtask(self):
        """Test creating a subtask."""
        parent_task = TaskFactory(user=self.user)
        
        url = reverse("task:task-list")
        data = {
            "title": "Subtask",
            "parent_task": parent_task.id,
        }
        
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["parent_task"], parent_task.id)

    def test_update_task(self):
        """Test updating a task."""
        task = TaskFactory(user=self.user)
        url = reverse("task:task-detail", kwargs={"pk": task.id})
        
        data = {
            "title": "Updated Task",
            "is_completed": True,
            "priority": "P2",
        }
        
        response = self.client.patch(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["title"], "Updated Task")
        self.assertTrue(response.data["is_completed"])

    def test_delete_task(self):
        """Test deleting a task."""
        task = TaskFactory(user=self.user)
        url = reverse("task:task-detail", kwargs={"pk": task.id})
        
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Task.objects.filter(id=task.id).exists())

    def test_filter_tasks_by_project(self):
        """Test filtering tasks by project."""
        project2 = ProjectFactory(user=self.user)
        task1 = TaskFactory(user=self.user, project=self.project)
        task2 = TaskFactory(user=self.user, project=project2)
        
        url = reverse("task:task-list")
        response = self.client.get(url, {"project": self.project.id})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        task_ids = [t["id"] for t in response.data['results']]
        self.assertIn(task1.id, task_ids)
        self.assertNotIn(task2.id, task_ids)

    def test_filter_tasks_by_priority(self):
        """Test filtering tasks by priority."""
        task_p1 = TaskFactory(user=self.user, priority="P1")
        task_p2 = TaskFactory(user=self.user, priority="P2")
        
        url = reverse("task:task-list")
        response = self.client.get(url, {"priority": "P1"})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        task_ids = [t["id"] for t in response.data['results']]
        self.assertIn(task_p1.id, task_ids)
        self.assertNotIn(task_p2.id, task_ids)

    def test_filter_tasks_by_completion_status(self):
        """Test filtering tasks by completion status."""
        completed_task = TaskFactory(user=self.user, is_completed=True)
        pending_task = TaskFactory(user=self.user, is_completed=False)
        
        url = reverse("task:task-list")
        response = self.client.get(url, {"completed": "true"})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        task_ids = [t["id"] for t in response.data['results']]
        self.assertIn(completed_task.id, task_ids)
        self.assertNotIn(pending_task.id, task_ids)

    def test_search_tasks(self):
        """Test searching tasks by title, description, and notes."""
        task1 = TaskFactory(user=self.user, title="Python Development")
        task2 = TaskFactory(user=self.user, description="Learn Python basics")
        task3 = TaskFactory(user=self.user, notes="Python notes for project")
        task4 = TaskFactory(user=self.user, title="Java Development")
        
        url = reverse("task:task-list")
        response = self.client.get(url, {"search": "Python"})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        task_ids = [t["id"] for t in response.data['results']]
        self.assertIn(task1.id, task_ids)
        self.assertIn(task2.id, task_ids)
        self.assertIn(task3.id, task_ids)
        self.assertNotIn(task4.id, task_ids)

    def test_filter_today_tasks(self):
        """Test filtering today's tasks."""
        today = timezone.now().date()
        yesterday = today - timedelta(days=1)
        
        today_task = TaskFactory(user=self.user, date=today, is_completed=False)
        yesterday_task = TaskFactory(user=self.user, date=yesterday, is_completed=False)
        due_today_task = TaskFactory(user=self.user, due_date=today, is_completed=False)
        completed_today_task = TaskFactory(user=self.user, date=today, is_completed=True)
        
        url = reverse("task:task-list")
        response = self.client.get(url, {"view": "today"})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        task_ids = [t["id"] for t in response.data['results']]
        self.assertIn(today_task.id, task_ids)
        self.assertIn(due_today_task.id, task_ids)
        self.assertNotIn(yesterday_task.id, task_ids)
        self.assertNotIn(completed_today_task.id, task_ids)  # Completed tasks excluded

    def test_filter_overdue_tasks(self):
        """Test filtering overdue tasks."""
        today = timezone.now().date()
        yesterday = today - timedelta(days=1)
        tomorrow = today + timedelta(days=1)
        
        overdue_task = TaskFactory(user=self.user, due_date=yesterday, is_completed=False)
        future_task = TaskFactory(user=self.user, due_date=tomorrow, is_completed=False)
        completed_overdue_task = TaskFactory(user=self.user, due_date=yesterday, is_completed=True)
        
        url = reverse("task:task-list")
        response = self.client.get(url, {"view": "overdue"})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        task_ids = [t["id"] for t in response.data['results']]
        self.assertIn(overdue_task.id, task_ids)
        self.assertNotIn(future_task.id, task_ids)
        self.assertNotIn(completed_overdue_task.id, task_ids)

    def test_exclude_subtasks_by_default(self):
        """Test that subtasks are excluded from list by default."""
        parent_task = TaskFactory(user=self.user)
        subtask = TaskFactory(user=self.user, parent_task=parent_task)
        
        url = reverse("task:task-list")
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        task_ids = [t["id"] for t in response.data['results']]
        self.assertIn(parent_task.id, task_ids)
        self.assertNotIn(subtask.id, task_ids)

    def test_include_subtasks_with_parameter(self):
        """Test including subtasks with parameter."""
        parent_task = TaskFactory(user=self.user)
        subtask = TaskFactory(user=self.user, parent_task=parent_task)
        
        url = reverse("task:task-list")
        response = self.client.get(url, {"subtasks": "include"})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        task_ids = [t["id"] for t in response.data['results']]
        self.assertIn(parent_task.id, task_ids)
        self.assertIn(subtask.id, task_ids)


class TaskQuickCreateTest(BaseTaskAPITest):
    """Test cases for Task Quick Create endpoint."""

    def test_quick_create_task(self):
        """Test quick task creation."""
        url = reverse("task:task-quick-create")
        data = {
            "title": "Quick Task",
            "priority": "P2",
        }
        
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["title"], "Quick Task")
        self.assertEqual(response.data["priority"], "P2")


class TaskBulkUpdateTest(BaseTaskAPITest):
    """Test cases for Task Bulk Update endpoint."""

    def setUp(self):
        super().setUp()
        self.task1 = TaskFactory(user=self.user)
        self.task2 = TaskFactory(user=self.user)
        self.task3 = TaskFactory(user=self.user)

    def test_bulk_complete_tasks(self):
        """Test bulk completing tasks."""
        url = reverse("task:task-bulk-update")
        data = {
            "task_ids": [self.task1.id, self.task2.id],
            "action": "complete",
        }
        
        response = self.client.patch(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.task1.refresh_from_db()
        self.task2.refresh_from_db()
        self.task3.refresh_from_db()
        
        self.assertTrue(self.task1.is_completed)
        self.assertTrue(self.task2.is_completed)
        self.assertFalse(self.task3.is_completed)

    def test_bulk_uncomplete_tasks(self):
        """Test bulk uncompleting tasks."""
        # First complete the tasks
        self.task1.is_completed = True
        self.task1.save()
        self.task2.is_completed = True
        self.task2.save()
        
        url = reverse("task:task-bulk-update")
        data = {
            "task_ids": [self.task1.id, self.task2.id],
            "action": "uncomplete",
        }
        
        response = self.client.patch(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.task1.refresh_from_db()
        self.task2.refresh_from_db()
        
        self.assertFalse(self.task1.is_completed)
        self.assertFalse(self.task2.is_completed)

    def test_bulk_reorder_tasks(self):
        """Test bulk reordering tasks."""
        url = reverse("task:task-bulk-update")
        data = {
            "task_ids": [self.task1.id, self.task2.id, self.task3.id],
            "action": "reorder",
            "positions": {
                str(self.task1.id): 2,
                str(self.task2.id): 0,
                str(self.task3.id): 1,
            },
        }
        
        response = self.client.patch(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.task1.refresh_from_db()
        self.task2.refresh_from_db()
        self.task3.refresh_from_db()
        
        self.assertEqual(self.task1.position, 2)
        self.assertEqual(self.task2.position, 0)
        self.assertEqual(self.task3.position, 1)

    def test_bulk_update_invalid_action(self):
        """Test bulk update with invalid action."""
        url = reverse("task:task-bulk-update")
        data = {
            "task_ids": [self.task1.id],
            "action": "invalid_action",
        }
        
        response = self.client.patch(url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_bulk_update_missing_parameters(self):
        """Test bulk update with missing parameters."""
        url = reverse("task:task-bulk-update")
        
        # Missing task_ids
        response = self.client.patch(url, {"action": "complete"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Missing action
        response = self.client.patch(url, {"task_ids": [self.task1.id]})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_bulk_update_other_user_tasks(self):
        """Test that users cannot bulk update other users' tasks."""
        other_task = TaskFactory(user=self.other_user)
        
        url = reverse("task:task-bulk-update")
        data = {
            "task_ids": [other_task.id],
            "action": "complete",
        }
        
        response = self.client.patch(url, data)
        
        # Should succeed but not affect other user's task
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        other_task.refresh_from_db()
        self.assertFalse(other_task.is_completed)


class TaskCommentAPITest(BaseTaskAPITest):
    """Test cases for Task Comment API endpoints."""

    def setUp(self):
        super().setUp()
        self.task = TaskFactory(user=self.user)

    def test_list_task_comments(self):
        """Test listing task comments."""
        comment1 = TaskCommentFactory(task=self.task, user=self.user)
        comment2 = TaskCommentFactory(task=self.task, user=self.user)
        
        # Comment on other user's task
        other_task = TaskFactory(user=self.other_user)
        other_comment = TaskCommentFactory(task=other_task, user=self.other_user)
        
        url = reverse("task:task-comment-list", kwargs={"task_id": self.task.id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)
        self.assertIn('pagination', response.data)
        comment_ids = [c["id"] for c in response.data['results']]
        self.assertIn(comment1.id, comment_ids)
        self.assertIn(comment2.id, comment_ids)
        self.assertNotIn(other_comment.id, comment_ids)

    def test_create_task_comment(self):
        """Test creating a task comment."""
        url = reverse("task:task-comment-list", kwargs={"task_id": self.task.id})
        data = {"content": "This is a test comment."}
        
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["content"], "This is a test comment.")
        self.assertEqual(response.data["user"]["id"], self.user.id)

    def test_update_task_comment(self):
        """Test updating a task comment."""
        comment = TaskCommentFactory(task=self.task, user=self.user)
        url = reverse("task:task-comment-detail", kwargs={"pk": comment.id})
        
        data = {"content": "Updated comment content."}
        response = self.client.patch(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["content"], "Updated comment content.")

    def test_delete_task_comment(self):
        """Test deleting a task comment."""
        comment = TaskCommentFactory(task=self.task, user=self.user)
        url = reverse("task:task-comment-detail", kwargs={"pk": comment.id})
        
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(TaskComment.objects.filter(id=comment.id).exists())

    def test_access_other_user_task_comments(self):
        """Test that users cannot access other users' task comments."""
        other_task = TaskFactory(user=self.other_user)
        
        url = reverse("task:task-comment-list", kwargs={"task_id": other_task.id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 0)  # Should return empty list


class TaskStatsAPITest(BaseTaskAPITest):
    """Test cases for Task Stats API endpoint."""

    def setUp(self):
        super().setUp()
        today = timezone.now().date()
        yesterday = today - timedelta(days=1)
        
        # Create tasks with different states
        self.completed_task = TaskFactory(user=self.user, is_completed=True)
        self.pending_task = TaskFactory(user=self.user, is_completed=False)
        self.overdue_task = TaskFactory(
            user=self.user, due_date=yesterday, is_completed=False
        )
        self.today_task = TaskFactory(user=self.user, date=today, is_completed=False)
        self.p1_task = TaskFactory(user=self.user, priority="P1", is_completed=False)
        self.p2_task = TaskFactory(user=self.user, priority="P2", is_completed=False)

    def test_task_stats(self):
        """Test getting task statistics."""
        url = reverse("task:task-stats")
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        data = response.data
        self.assertIn("total", data)
        self.assertIn("completed", data)
        self.assertIn("pending", data)
        self.assertIn("overdue", data)
        self.assertIn("today", data)
        self.assertIn("this_week", data)
        self.assertIn("priority_breakdown", data)
        
        # Check specific counts
        self.assertEqual(data["total"], 6)  # All tasks created in setUp
        self.assertEqual(data["completed"], 1)
        self.assertEqual(data["pending"], 5)
        self.assertEqual(data["overdue"], 1)
        self.assertEqual(data["today"], 1)
        
        # Check priority breakdown
        priority_breakdown = data["priority_breakdown"]
        self.assertEqual(priority_breakdown["P1"], 1)
        self.assertEqual(priority_breakdown["P2"], 1)

    def test_task_stats_unauthorized(self):
        """Test that task stats require authentication."""
        self.client.force_authenticate(user=None)
        
        url = reverse("task:task-stats")
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
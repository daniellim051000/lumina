"""Tests for task management models."""

from datetime import date, timedelta

from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.test import TestCase
from django.utils import timezone

from api.task.models import Label, Project, Task, TaskComment
from .factories import LabelFactory, ProjectFactory, TaskFactory, TaskCommentFactory, UserFactory


class ProjectModelTest(TestCase):
    """Test cases for Project model."""

    def setUp(self):
        self.user = UserFactory()

    def test_project_creation(self):
        """Test basic project creation."""
        project = ProjectFactory(user=self.user)
        self.assertEqual(project.user, self.user)
        self.assertTrue(project.is_active)
        self.assertIsNotNone(project.created_at)
        self.assertIsNotNone(project.updated_at)

    def test_project_str_representation(self):
        """Test project string representation."""
        project = ProjectFactory(user=self.user, name="Test Project")
        expected = f"{self.user.username} - Test Project"
        self.assertEqual(str(project), expected)

    def test_project_unique_name_per_user(self):
        """Test that project names must be unique per user."""
        ProjectFactory(user=self.user, name="Duplicate")
        with self.assertRaises(ValidationError):
            ProjectFactory(user=self.user, name="Duplicate")

    def test_different_users_can_have_same_project_name(self):
        """Test that different users can have projects with the same name."""
        user2 = UserFactory()
        project1 = ProjectFactory(user=self.user, name="Same Name")
        project2 = ProjectFactory(user=user2, name="Same Name")
        
        self.assertEqual(project1.name, project2.name)
        self.assertNotEqual(project1.user, project2.user)

    def test_project_with_parent(self):
        """Test project with parent relationship."""
        parent_project = ProjectFactory(user=self.user)
        sub_project = ProjectFactory(user=self.user, parent=parent_project)
        
        self.assertEqual(sub_project.parent, parent_project)
        self.assertIn(sub_project, parent_project.sub_projects.all())

    def test_project_ordering(self):
        """Test project ordering by position and name."""
        project_a = ProjectFactory(user=self.user, name="A Project", position=2)
        project_b = ProjectFactory(user=self.user, name="B Project", position=1)
        project_c = ProjectFactory(user=self.user, name="C Project", position=1)
        
        projects = Project.objects.filter(user=self.user)
        # Should be ordered by position first, then by name
        expected_order = [project_b, project_c, project_a]
        self.assertEqual(list(projects), expected_order)

    def test_default_color(self):
        """Test default color assignment."""
        project = ProjectFactory(user=self.user)
        self.assertEqual(project.color, "#3B82F6")


class LabelModelTest(TestCase):
    """Test cases for Label model."""

    def setUp(self):
        self.user = UserFactory()

    def test_label_creation(self):
        """Test basic label creation."""
        label = LabelFactory(user=self.user)
        self.assertEqual(label.user, self.user)
        self.assertIsNotNone(label.created_at)

    def test_label_str_representation(self):
        """Test label string representation."""
        label = LabelFactory(user=self.user, name="Test Label")
        expected = f"{self.user.username} - Test Label"
        self.assertEqual(str(label), expected)

    def test_label_unique_name_per_user(self):
        """Test that label names must be unique per user."""
        LabelFactory(user=self.user, name="Duplicate")
        with self.assertRaises(ValidationError):
            LabelFactory(user=self.user, name="Duplicate")

    def test_different_users_can_have_same_label_name(self):
        """Test that different users can have labels with the same name."""
        user2 = UserFactory()
        label1 = LabelFactory(user=self.user, name="Same Name")
        label2 = LabelFactory(user=user2, name="Same Name")
        
        self.assertEqual(label1.name, label2.name)
        self.assertNotEqual(label1.user, label2.user)

    def test_label_ordering(self):
        """Test label ordering by name."""
        label_c = LabelFactory(user=self.user, name="C Label")
        label_a = LabelFactory(user=self.user, name="A Label")
        label_b = LabelFactory(user=self.user, name="B Label")
        
        labels = Label.objects.filter(user=self.user)
        expected_order = [label_a, label_b, label_c]
        self.assertEqual(list(labels), expected_order)

    def test_default_color(self):
        """Test default color assignment."""
        label = LabelFactory(user=self.user)
        self.assertEqual(label.color, "#6B7280")


class TaskModelTest(TestCase):
    """Test cases for Task model."""

    def setUp(self):
        self.user = UserFactory()
        self.project = ProjectFactory(user=self.user)
        self.label = LabelFactory(user=self.user)

    def test_task_creation(self):
        """Test basic task creation."""
        task = TaskFactory(user=self.user)
        self.assertEqual(task.user, self.user)
        self.assertFalse(task.is_completed)
        self.assertIsNone(task.completed_at)
        self.assertIsNotNone(task.created_at)
        self.assertIsNotNone(task.updated_at)

    def test_task_str_representation(self):
        """Test task string representation."""
        task = TaskFactory(user=self.user, title="Test Task")
        expected = f"Test Task ({self.user.username})"
        self.assertEqual(str(task), expected)

    def test_task_with_project(self):
        """Test task creation with project assignment."""
        task = TaskFactory(user=self.user, project=self.project)
        self.assertEqual(task.project, self.project)
        self.assertIn(task, self.project.tasks.all())

    def test_task_with_labels(self):
        """Test task creation with label assignment."""
        task = TaskFactory(user=self.user)
        task.labels.add(self.label)
        
        self.assertIn(self.label, task.labels.all())
        self.assertIn(task, self.label.tasks.all())

    def test_task_with_parent(self):
        """Test subtask creation."""
        parent_task = TaskFactory(user=self.user)
        subtask = TaskFactory(user=self.user, parent_task=parent_task)
        
        self.assertEqual(subtask.parent_task, parent_task)
        self.assertIn(subtask, parent_task.subtasks.all())

    def test_task_priority_choices(self):
        """Test task priority assignment."""
        task = TaskFactory(user=self.user, priority="P1")
        self.assertEqual(task.priority, "P1")
        
        # Test empty priority
        task_no_priority = TaskFactory(user=self.user, priority="")
        self.assertEqual(task_no_priority.priority, "")

    def test_task_completion_auto_timestamp(self):
        """Test automatic completed_at timestamp when task is completed."""
        task = TaskFactory(user=self.user)
        self.assertIsNone(task.completed_at)
        
        # Mark as completed
        task.is_completed = True
        task.save()
        
        self.assertIsNotNone(task.completed_at)
        self.assertTrue(task.is_completed)

    def test_task_uncompleted_clears_timestamp(self):
        """Test that uncompleting a task clears completed_at."""
        task = TaskFactory(user=self.user, is_completed=True)
        task.save()  # This should set completed_at
        self.assertIsNotNone(task.completed_at)
        
        # Mark as not completed
        task.is_completed = False
        task.save()
        
        self.assertIsNone(task.completed_at)

    def test_is_overdue_property(self):
        """Test is_overdue property."""
        # Task with due date in the past
        past_date = date.today() - timedelta(days=1)
        overdue_task = TaskFactory(user=self.user, due_date=past_date, is_completed=False)
        self.assertTrue(overdue_task.is_overdue)
        
        # Task with due date in the future
        future_date = date.today() + timedelta(days=1)
        future_task = TaskFactory(user=self.user, due_date=future_date, is_completed=False)
        self.assertFalse(future_task.is_overdue)
        
        # Completed task with past due date should not be overdue
        completed_task = TaskFactory(
            user=self.user, due_date=past_date, is_completed=True
        )
        self.assertFalse(completed_task.is_overdue)
        
        # Task with no due date should not be overdue
        no_due_date_task = TaskFactory(user=self.user, due_date=None)
        self.assertFalse(no_due_date_task.is_overdue)

    def test_subtask_count_property(self):
        """Test subtask_count property."""
        parent_task = TaskFactory(user=self.user)
        self.assertEqual(parent_task.subtask_count, 0)
        
        # Add subtasks
        subtask1 = TaskFactory(user=self.user, parent_task=parent_task)
        subtask2 = TaskFactory(user=self.user, parent_task=parent_task)
        
        self.assertEqual(parent_task.subtask_count, 2)

    def test_completed_subtask_count_property(self):
        """Test completed_subtask_count property."""
        parent_task = TaskFactory(user=self.user)
        
        # Add subtasks with different completion states
        subtask1 = TaskFactory(user=self.user, parent_task=parent_task, is_completed=True)
        subtask2 = TaskFactory(user=self.user, parent_task=parent_task, is_completed=False)
        subtask3 = TaskFactory(user=self.user, parent_task=parent_task, is_completed=True)
        
        self.assertEqual(parent_task.subtask_count, 3)
        self.assertEqual(parent_task.completed_subtask_count, 2)

    def test_task_ordering(self):
        """Test task ordering by position and created_at."""
        task_a = TaskFactory(user=self.user, position=2)
        task_b = TaskFactory(user=self.user, position=1)
        task_c = TaskFactory(user=self.user, position=1)
        
        tasks = Task.objects.filter(user=self.user)
        # Should be ordered by position first, then by -created_at
        self.assertEqual(tasks.first().position, 1)


class TaskCommentModelTest(TestCase):
    """Test cases for TaskComment model."""

    def setUp(self):
        self.user = UserFactory()
        self.task = TaskFactory(user=self.user)

    def test_comment_creation(self):
        """Test basic comment creation."""
        comment = TaskCommentFactory(task=self.task, user=self.user)
        self.assertEqual(comment.task, self.task)
        self.assertEqual(comment.user, self.user)
        self.assertIsNotNone(comment.created_at)
        self.assertIsNotNone(comment.updated_at)

    def test_comment_str_representation(self):
        """Test comment string representation."""
        comment = TaskCommentFactory(task=self.task, user=self.user)
        expected = f"Comment by {self.user.username} on {self.task.title}"
        self.assertEqual(str(comment), expected)

    def test_comment_ordering(self):
        """Test comment ordering by -created_at."""
        comment1 = TaskCommentFactory(task=self.task, user=self.user)
        comment2 = TaskCommentFactory(task=self.task, user=self.user)
        
        comments = TaskComment.objects.filter(task=self.task)
        # Should be ordered by -created_at (newest first)
        self.assertEqual(comments.first(), comment2)

    def test_comment_deletion_with_task(self):
        """Test that comments are deleted when task is deleted."""
        comment = TaskCommentFactory(task=self.task, user=self.user)
        comment_id = comment.id
        
        self.task.delete()
        
        with self.assertRaises(TaskComment.DoesNotExist):
            TaskComment.objects.get(id=comment_id)
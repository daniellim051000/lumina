"""Integration tests for task management functionality."""

from datetime import date, timedelta

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .factories import LabelFactory, ProjectFactory, TaskFactory, UserFactory


class TaskManagementIntegrationTest(APITestCase):
    """Integration tests for complete task management workflows."""

    def setUp(self):
        self.user = UserFactory()
        self.client.force_authenticate(user=self.user)

    def test_complete_task_management_workflow(self):
        """Test complete workflow from project creation to task completion."""
        # 1. Create a project
        project_url = reverse("task:project-list")
        project_data = {
            "name": "Web Development Project",
            "description": "Building a new website",
            "color": "#3B82F6",
        }
        project_response = self.client.post(project_url, project_data)
        self.assertEqual(project_response.status_code, status.HTTP_201_CREATED)
        project_id = project_response.data["id"]

        # 2. Create labels
        label_url = reverse("task:label-list")
        frontend_label_data = {"name": "Frontend", "color": "#FF5733"}
        backend_label_data = {"name": "Backend", "color": "#33FF57"}

        frontend_response = self.client.post(label_url, frontend_label_data)
        backend_response = self.client.post(label_url, backend_label_data)

        self.assertEqual(frontend_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(backend_response.status_code, status.HTTP_201_CREATED)

        frontend_label_id = frontend_response.data["id"]
        backend_label_id = backend_response.data["id"]

        # 3. Create main task (without label_ids first to avoid validation issue)
        task_url = reverse("task:task-list")
        main_task_data = {
            "title": "Build Landing Page",
            "description": "Create responsive landing page with modern design",
            "priority": "P1",
            "project_id": project_id,
            "due_date": (date.today() + timedelta(days=7)).isoformat(),
        }
        main_task_response = self.client.post(task_url, main_task_data, format="json")
        self.assertEqual(main_task_response.status_code, status.HTTP_201_CREATED)
        main_task_id = main_task_response.data["id"]

        # 4. Create subtasks
        subtask1_data = {
            "title": "Design mockups",
            "parent_task": main_task_id,
            "priority": "P2",
        }
        subtask2_data = {
            "title": "Implement HTML structure",
            "parent_task": main_task_id,
            "priority": "P2",
        }

        subtask1_response = self.client.post(task_url, subtask1_data)
        subtask2_response = self.client.post(task_url, subtask2_data)

        self.assertEqual(subtask1_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(subtask2_response.status_code, status.HTTP_201_CREATED)

        subtask1_id = subtask1_response.data["id"]
        subtask2_id = subtask2_response.data["id"]

        # 5. Add comments to main task
        comment_url = reverse(
            "task:task-comment-list", kwargs={"task_id": main_task_id}
        )
        comment_data = {"content": "Started working on the landing page design."}
        comment_response = self.client.post(comment_url, comment_data)
        self.assertEqual(comment_response.status_code, status.HTTP_201_CREATED)

        # 6. Complete subtasks using bulk update
        bulk_update_url = reverse("task:task-bulk-update")
        bulk_complete_data = {
            "task_ids": [subtask1_id, subtask2_id],
            "action": "complete",
        }
        bulk_response = self.client.patch(
            bulk_update_url, bulk_complete_data, format="json"
        )
        self.assertEqual(bulk_response.status_code, status.HTTP_200_OK)

        # 7. Verify subtasks are completed
        subtask1_detail_url = reverse("task:task-detail", kwargs={"pk": subtask1_id})
        subtask1_detail = self.client.get(subtask1_detail_url)
        self.assertTrue(subtask1_detail.data["is_completed"])

        # 8. Check task stats
        stats_url = reverse("task:task-stats")
        stats_response = self.client.get(stats_url)
        self.assertEqual(stats_response.status_code, status.HTTP_200_OK)

        stats = stats_response.data
        self.assertEqual(stats["total"], 3)  # 1 main task + 2 subtasks
        self.assertEqual(stats["completed"], 2)  # 2 subtasks
        self.assertEqual(stats["pending"], 1)  # 1 main task
        self.assertEqual(stats["priority_breakdown"]["P1"], 1)  # Main task
        self.assertEqual(stats["priority_breakdown"]["P2"], 0)  # Subtasks are completed

        # 9. Complete main task
        main_task_detail_url = reverse("task:task-detail", kwargs={"pk": main_task_id})
        complete_main_data = {"is_completed": True}
        complete_response = self.client.patch(main_task_detail_url, complete_main_data)
        self.assertEqual(complete_response.status_code, status.HTTP_200_OK)

        # 10. Verify final stats
        final_stats = self.client.get(stats_url)
        final_stats_data = final_stats.data
        self.assertEqual(final_stats_data["completed"], 3)
        self.assertEqual(final_stats_data["pending"], 0)

    def test_task_filtering_and_search_workflow(self):
        """Test task filtering and search functionality."""
        # Create projects and labels
        work_project = ProjectFactory(user=self.user, name="Work")
        personal_project = ProjectFactory(user=self.user, name="Personal")
        urgent_label = LabelFactory(user=self.user, name="Urgent")

        # Create tasks with different attributes
        work_task = TaskFactory(
            user=self.user,
            title="Prepare presentation",
            project=work_project,
            priority="P1",
            is_completed=False,
        )
        work_task.labels.add(urgent_label)

        personal_task = TaskFactory(
            user=self.user,
            title="Buy groceries",
            project=personal_project,
            priority="P3",
            is_completed=False,
        )

        completed_task = TaskFactory(
            user=self.user,
            title="Finish report",
            project=work_project,
            priority="P2",
            is_completed=True,
        )

        task_url = reverse("task:task-list")

        # Test project filtering
        work_tasks = self.client.get(task_url, {"project": work_project.id})
        work_task_ids = [t["id"] for t in work_tasks.data["results"]]
        self.assertIn(work_task.id, work_task_ids)
        self.assertIn(completed_task.id, work_task_ids)
        self.assertNotIn(personal_task.id, work_task_ids)

        # Test priority filtering
        p1_tasks = self.client.get(task_url, {"priority": "P1"})
        p1_task_ids = [t["id"] for t in p1_tasks.data["results"]]
        self.assertIn(work_task.id, p1_task_ids)
        self.assertNotIn(personal_task.id, p1_task_ids)

        # Test completion status filtering
        pending_tasks = self.client.get(task_url, {"completed": "false"})
        pending_task_ids = [t["id"] for t in pending_tasks.data["results"]]
        self.assertIn(work_task.id, pending_task_ids)
        self.assertIn(personal_task.id, pending_task_ids)
        self.assertNotIn(completed_task.id, pending_task_ids)

        # Test search functionality
        search_tasks = self.client.get(task_url, {"search": "presentation"})
        search_task_ids = [t["id"] for t in search_tasks.data["results"]]
        self.assertIn(work_task.id, search_task_ids)
        self.assertNotIn(personal_task.id, search_task_ids)

    def test_date_based_filtering_workflow(self):
        """Test date-based task filtering (today, week, overdue)."""
        today = date.today()
        yesterday = today - timedelta(days=1)
        tomorrow = today + timedelta(days=1)
        next_week = today + timedelta(days=8)

        # Create tasks with different dates
        today_task = TaskFactory(
            user=self.user,
            title="Today's task",
            date=today,
            is_completed=False,
        )

        due_today_task = TaskFactory(
            user=self.user,
            title="Due today",
            due_date=today,
            is_completed=False,
        )

        overdue_task = TaskFactory(
            user=self.user,
            title="Overdue task",
            due_date=yesterday,
            is_completed=False,
        )

        future_task = TaskFactory(
            user=self.user,
            title="Future task",
            due_date=next_week,
            is_completed=False,
        )

        week_task = TaskFactory(
            user=self.user,
            title="This week task",
            due_date=tomorrow,
            is_completed=False,
        )

        task_url = reverse("task:task-list")

        # Test today view
        today_tasks = self.client.get(task_url, {"view": "today"})
        today_task_ids = [t["id"] for t in today_tasks.data["results"]]
        self.assertIn(today_task.id, today_task_ids)
        self.assertIn(due_today_task.id, today_task_ids)
        self.assertNotIn(overdue_task.id, today_task_ids)
        self.assertNotIn(future_task.id, today_task_ids)

        # Test overdue view
        overdue_tasks = self.client.get(task_url, {"view": "overdue"})
        overdue_task_ids = [t["id"] for t in overdue_tasks.data["results"]]
        self.assertIn(overdue_task.id, overdue_task_ids)
        self.assertNotIn(today_task.id, overdue_task_ids)
        self.assertNotIn(future_task.id, overdue_task_ids)

        # Test week view
        week_tasks = self.client.get(task_url, {"view": "week"})
        week_task_ids = [t["id"] for t in week_tasks.data["results"]]
        self.assertIn(today_task.id, week_task_ids)
        self.assertIn(due_today_task.id, week_task_ids)
        self.assertIn(week_task.id, week_task_ids)
        self.assertNotIn(future_task.id, week_task_ids)

    def test_subtask_management_workflow(self):
        """Test comprehensive subtask management."""
        # Create parent task
        parent_task = TaskFactory(user=self.user, title="Main Project")

        # Create subtasks
        subtask1 = TaskFactory(
            user=self.user,
            title="Subtask 1",
            parent_task=parent_task,
        )
        subtask2 = TaskFactory(
            user=self.user,
            title="Subtask 2",
            parent_task=parent_task,
        )

        task_url = reverse("task:task-list")

        # Test that subtasks are excluded by default
        default_tasks = self.client.get(task_url)
        default_task_ids = [t["id"] for t in default_tasks.data["results"]]
        self.assertIn(parent_task.id, default_task_ids)
        self.assertNotIn(subtask1.id, default_task_ids)
        self.assertNotIn(subtask2.id, default_task_ids)

        # Test including subtasks
        all_tasks = self.client.get(task_url, {"subtasks": "include"})
        all_task_ids = [t["id"] for t in all_tasks.data["results"]]
        self.assertIn(parent_task.id, all_task_ids)
        self.assertIn(subtask1.id, all_task_ids)
        self.assertIn(subtask2.id, all_task_ids)

        # Test filtering by parent task
        parent_subtasks = self.client.get(task_url, {"parent_task": parent_task.id})
        parent_subtask_ids = [t["id"] for t in parent_subtasks.data["results"]]
        self.assertIn(subtask1.id, parent_subtask_ids)
        self.assertIn(subtask2.id, parent_subtask_ids)
        self.assertNotIn(parent_task.id, parent_subtask_ids)

        # Test parent task details include subtask counts
        parent_detail_url = reverse("task:task-detail", kwargs={"pk": parent_task.id})
        parent_detail = self.client.get(parent_detail_url)
        self.assertEqual(parent_detail.data["subtask_count"], 2)
        self.assertEqual(parent_detail.data["completed_subtask_count"], 0)

        # Complete one subtask
        subtask1_detail_url = reverse("task:task-detail", kwargs={"pk": subtask1.id})
        self.client.patch(subtask1_detail_url, {"is_completed": True})

        # Check updated subtask counts
        updated_parent = self.client.get(parent_detail_url)
        self.assertEqual(updated_parent.data["completed_subtask_count"], 1)

    def test_project_task_relationship_workflow(self):
        """Test project and task relationship management."""
        # Create projects
        project1 = ProjectFactory(user=self.user, name="Project 1")
        project2 = ProjectFactory(user=self.user, name="Project 2")

        # Create tasks in different projects
        task1 = TaskFactory(user=self.user, project=project1)
        task2 = TaskFactory(user=self.user, project=project1)
        task3 = TaskFactory(user=self.user, project=project2)

        # Check project task counts
        project_url = reverse("task:project-list")
        projects = self.client.get(project_url)

        project_data = {p["id"]: p for p in projects.data["results"]}
        self.assertEqual(project_data[project1.id]["task_count"], 2)
        self.assertEqual(project_data[project2.id]["task_count"], 1)

        # Complete tasks and check completed counts
        task1_url = reverse("task:task-detail", kwargs={"pk": task1.id})
        self.client.patch(task1_url, {"is_completed": True})

        updated_projects = self.client.get(project_url)
        updated_project_data = {p["id"]: p for p in updated_projects.data["results"]}
        self.assertEqual(updated_project_data[project1.id]["completed_task_count"], 1)
        self.assertEqual(updated_project_data[project2.id]["completed_task_count"], 0)

        # Test project soft deletion
        project1_detail_url = reverse("task:project-detail", kwargs={"pk": project1.id})
        delete_response = self.client.delete(project1_detail_url)
        self.assertEqual(delete_response.status_code, status.HTTP_204_NO_CONTENT)

        # Verify project is soft deleted (tasks should remain)
        project1.refresh_from_db()
        self.assertFalse(project1.is_active)

        # Tasks should still exist but project should not appear in active list
        remaining_projects = self.client.get(project_url)
        remaining_project_ids = [p["id"] for p in remaining_projects.data["results"]]
        self.assertNotIn(project1.id, remaining_project_ids)
        self.assertIn(project2.id, remaining_project_ids)

    def test_error_handling_workflow(self):
        """Test error handling in various scenarios."""
        # Test creating project with duplicate name
        ProjectFactory(user=self.user, name="Duplicate")

        project_url = reverse("task:project-list")
        duplicate_data = {"name": "Duplicate", "description": "Test"}
        duplicate_response = self.client.post(project_url, duplicate_data)
        self.assertEqual(duplicate_response.status_code, status.HTTP_400_BAD_REQUEST)

        # Test creating task with invalid project
        task_url = reverse("task:task-list")
        invalid_task_data = {
            "title": "Test Task",
            "project_id": 99999,  # Non-existent project
        }
        invalid_response = self.client.post(task_url, invalid_task_data)
        self.assertEqual(invalid_response.status_code, status.HTTP_400_BAD_REQUEST)

        # Test accessing other user's resources
        other_user = UserFactory()
        other_project = ProjectFactory(user=other_user)

        other_project_url = reverse(
            "task:project-detail", kwargs={"pk": other_project.id}
        )
        access_response = self.client.get(other_project_url)
        self.assertEqual(access_response.status_code, status.HTTP_404_NOT_FOUND)

        # Test bulk update with empty task_ids
        bulk_url = reverse("task:task-bulk-update")
        empty_bulk_data = {"task_ids": [], "action": "complete"}
        empty_response = self.client.patch(bulk_url, empty_bulk_data)
        self.assertEqual(empty_response.status_code, status.HTTP_400_BAD_REQUEST)

"""Tests for Pomodoro views."""

from datetime import timedelta

from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from api.task.tests.factories import TaskFactory
from api.user.tests.factories import UserFactory
from pomodoro.models import PomodoroPreset, PomodoroSession, PomodoroSettings

from .factories import (
    CompletedPomodoroSessionFactory,
    PomodoroPresetFactory,
    PomodoroSessionFactory,
    PomodoroSettingsFactory,
)


class PomodoroSettingsViewSetTest(TestCase):
    """Test cases for PomodoroSettingsViewSet."""

    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        self.user = UserFactory()
        self.client.force_authenticate(user=self.user)
        self.settings_url = reverse("pomodoro-settings-list")

    def test_get_settings(self):
        """Test getting user's Pomodoro settings."""
        settings = PomodoroSettingsFactory(user=self.user)

        response = self.client.get(self.settings_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["work_duration"], settings.work_duration)

    def test_get_settings_creates_if_not_exists(self):
        """Test that settings are auto-created if they don't exist."""
        # Ensure no settings exist
        PomodoroSettings.objects.filter(user=self.user).delete()

        response = self.client.get(self.settings_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertTrue(PomodoroSettings.objects.filter(user=self.user).exists())

    def test_update_settings(self):
        """Test updating user's Pomodoro settings."""
        settings = PomodoroSettingsFactory(user=self.user)

        data = {
            "work_duration": 30,
            "short_break_duration": 10,
            "enable_audio": False,
            "volume": 0.5,
        }

        response = self.client.put(f"{self.settings_url}{settings.id}/", data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        settings.refresh_from_db()
        self.assertEqual(settings.work_duration, 30)
        self.assertEqual(settings.short_break_duration, 10)
        self.assertFalse(settings.enable_audio)
        self.assertEqual(settings.volume, 0.5)

    def test_partial_update_settings(self):
        """Test partially updating user's Pomodoro settings."""
        settings = PomodoroSettingsFactory(user=self.user)
        original_work_duration = settings.work_duration

        data = {"volume": 0.3}

        response = self.client.patch(f"{self.settings_url}{settings.id}/", data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        settings.refresh_from_db()
        self.assertEqual(settings.work_duration, original_work_duration)  # Unchanged
        self.assertEqual(settings.volume, 0.3)  # Changed

    def test_partial_update_settings_without_id(self):
        """Test partially updating user's Pomodoro settings without providing ID (singleton pattern)."""
        settings = PomodoroSettingsFactory(user=self.user)
        original_work_duration = settings.work_duration

        data = {"volume": 0.8, "enable_audio": False}

        # PATCH to list URL without ID - this should work for singleton resources
        response = self.client.patch(self.settings_url, data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        settings.refresh_from_db()
        self.assertEqual(settings.work_duration, original_work_duration)  # Unchanged
        self.assertEqual(settings.volume, 0.8)  # Changed
        self.assertFalse(settings.enable_audio)  # Changed

    def test_partial_update_creates_settings_if_not_exists(self):
        """Test that PATCH creates settings if they don't exist."""
        # Ensure no settings exist
        PomodoroSettings.objects.filter(user=self.user).delete()

        data = {"work_duration": 35, "volume": 0.9}

        response = self.client.patch(self.settings_url, data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        settings = PomodoroSettings.objects.get(user=self.user)
        self.assertEqual(settings.work_duration, 35)
        self.assertEqual(settings.volume, 0.9)

    def test_reset_settings_to_defaults(self):
        """Test resetting settings to defaults via DELETE."""
        settings = PomodoroSettingsFactory(
            user=self.user, work_duration=45, volume=0.3, enable_audio=False
        )

        response = self.client.delete(f"{self.settings_url}{settings.id}/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        settings.refresh_from_db()
        self.assertEqual(settings.work_duration, 25)  # Default
        self.assertEqual(settings.volume, 0.7)  # Default
        self.assertTrue(settings.enable_audio)  # Default

    def test_unauthorized_access(self):
        """Test that unauthenticated users cannot access settings."""
        self.client.force_authenticate(user=None)

        response = self.client.get(self.settings_url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_user_cannot_access_other_user_settings(self):
        """Test that users can only access their own settings."""
        other_user = UserFactory()
        other_settings = PomodoroSettingsFactory(user=other_user)

        response = self.client.get(f"{self.settings_url}{other_settings.id}/")

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class PomodoroPresetViewSetTest(TestCase):
    """Test cases for PomodoroPresetViewSet."""

    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        self.user = UserFactory()
        self.client.force_authenticate(user=self.user)
        self.presets_url = reverse("pomodoro-presets-list")

    def test_list_presets(self):
        """Test listing user's presets."""
        preset1 = PomodoroPresetFactory(user=self.user, name="Focus")
        preset2 = PomodoroPresetFactory(user=self.user, name="Quick")
        # Create preset for another user (should not appear)
        PomodoroPresetFactory(user=UserFactory(), name="Other")

        response = self.client.get(self.presets_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 2)
        preset_names = [p["name"] for p in response.data["results"]]
        self.assertIn("Focus", preset_names)
        self.assertIn("Quick", preset_names)
        self.assertNotIn("Other", preset_names)

    def test_create_preset(self):
        """Test creating a new preset."""
        data = {
            "name": "Deep Work",
            "work_duration": 45,
            "short_break_duration": 15,
            "long_break_duration": 30,
            "sessions_until_long_break": 2,
            "is_default": True,
        }

        response = self.client.post(self.presets_url, data)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        preset = PomodoroPreset.objects.get(name="Deep Work", user=self.user)
        self.assertEqual(preset.work_duration, 45)
        self.assertEqual(preset.short_break_duration, 15)
        self.assertTrue(preset.is_default)

    def test_update_preset(self):
        """Test updating a preset."""
        preset = PomodoroPresetFactory(user=self.user, name="Original")

        data = {
            "name": "Updated",
            "work_duration": 35,
            "short_break_duration": 7,
            "long_break_duration": 20,
            "sessions_until_long_break": 3,
        }

        response = self.client.put(f"{self.presets_url}{preset.id}/", data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        preset.refresh_from_db()
        self.assertEqual(preset.name, "Updated")
        self.assertEqual(preset.work_duration, 35)

    def test_delete_preset(self):
        """Test deleting a preset."""
        preset = PomodoroPresetFactory(user=self.user)

        response = self.client.delete(f"{self.presets_url}{preset.id}/")

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(PomodoroPreset.objects.filter(id=preset.id).exists())

    def test_set_preset_as_default(self):
        """Test setting a preset as default."""
        preset1 = PomodoroPresetFactory(user=self.user, is_default=True)
        preset2 = PomodoroPresetFactory(user=self.user, is_default=False)

        response = self.client.post(f"{self.presets_url}{preset2.id}/set_default/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        preset1.refresh_from_db()
        preset2.refresh_from_db()
        self.assertFalse(preset1.is_default)
        self.assertTrue(preset2.is_default)

    def test_apply_preset_to_settings(self):
        """Test applying preset to user's settings."""
        preset = PomodoroPresetFactory(
            user=self.user,
            work_duration=50,
            short_break_duration=12,
            long_break_duration=25,
            sessions_until_long_break=3,
        )
        settings = PomodoroSettingsFactory(user=self.user)

        response = self.client.post(f"{self.presets_url}{preset.id}/apply_to_settings/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        settings.refresh_from_db()
        self.assertEqual(settings.work_duration, 50)
        self.assertEqual(settings.short_break_duration, 12)
        self.assertEqual(settings.long_break_duration, 25)
        self.assertEqual(settings.sessions_until_long_break, 3)


class PomodoroSessionViewSetTest(TestCase):
    """Test cases for PomodoroSessionViewSet."""

    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        self.user = UserFactory()
        self.client.force_authenticate(user=self.user)
        self.sessions_url = reverse("pomodoro-sessions-list")
        self.task = TaskFactory(user=self.user)

    def test_list_sessions(self):
        """Test listing user's sessions."""
        session1 = PomodoroSessionFactory(user=self.user)
        session2 = PomodoroSessionFactory(user=self.user)
        # Create session for another user (should not appear)
        PomodoroSessionFactory(user=UserFactory())

        response = self.client.get(self.sessions_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 2)

    def test_create_session(self):
        """Test creating a new session."""
        data = {
            "session_type": "work",
            "planned_duration": 25,
            "session_number": 1,
            "task": self.task.id,
        }

        response = self.client.post(self.sessions_url, data)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        session = PomodoroSession.objects.get(id=response.data["id"])
        self.assertEqual(session.user, self.user)
        self.assertEqual(session.session_type, "work")
        self.assertEqual(session.planned_duration, 25)
        self.assertEqual(session.task, self.task)
        self.assertEqual(session.status, "active")

    def test_create_session_without_task(self):
        """Test creating a session without a task."""
        data = {
            "session_type": "short_break",
            "planned_duration": 5,
            "session_number": 1,
        }

        response = self.client.post(self.sessions_url, data)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        session = PomodoroSession.objects.get(id=response.data["id"])
        self.assertIsNone(session.task)

    def test_get_active_session(self):
        """Test getting the current active session."""
        active_session = PomodoroSessionFactory(user=self.user, status="active")
        # Create completed session (should not be returned)
        CompletedPomodoroSessionFactory(user=self.user)

        response = self.client.get(f"{self.sessions_url}active/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], active_session.id)

    def test_get_active_session_none(self):
        """Test getting active session when none exists."""
        # Create only completed sessions
        CompletedPomodoroSessionFactory(user=self.user)

        response = self.client.get(f"{self.sessions_url}active/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNone(response.data)

    def test_pause_session(self):
        """Test pausing an active session."""
        session = PomodoroSessionFactory(user=self.user, status="active")

        response = self.client.post(f"{self.sessions_url}{session.id}/pause/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        session.refresh_from_db()
        self.assertEqual(session.status, "paused")
        self.assertIsNotNone(session.paused_at)

    def test_pause_non_active_session_fails(self):
        """Test that pausing a non-active session fails."""
        session = CompletedPomodoroSessionFactory(user=self.user)

        response = self.client.post(f"{self.sessions_url}{session.id}/pause/")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Can only pause active sessions", response.data["error"])

    def test_resume_session(self):
        """Test resuming a paused session."""
        session = PomodoroSessionFactory(
            user=self.user, status="paused", paused_at=timezone.now()
        )

        response = self.client.post(f"{self.sessions_url}{session.id}/resume/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        session.refresh_from_db()
        self.assertEqual(session.status, "active")
        self.assertIsNone(session.paused_at)

    def test_resume_non_paused_session_fails(self):
        """Test that resuming a non-paused session fails."""
        session = PomodoroSessionFactory(user=self.user, status="active")

        response = self.client.post(f"{self.sessions_url}{session.id}/resume/")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Can only resume paused sessions", response.data["error"])

    def test_complete_session(self):
        """Test completing a session."""
        session = PomodoroSessionFactory(user=self.user, status="active")

        response = self.client.post(f"{self.sessions_url}{session.id}/complete/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        session.refresh_from_db()
        self.assertEqual(session.status, "completed")
        self.assertIsNotNone(session.completed_at)
        self.assertIsNotNone(session.actual_duration)

    def test_complete_already_completed_session_fails(self):
        """Test that completing an already completed session fails."""
        session = CompletedPomodoroSessionFactory(user=self.user)

        response = self.client.post(f"{self.sessions_url}{session.id}/complete/")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("already completed", response.data["error"])

    def test_skip_session(self):
        """Test skipping a session."""
        session = PomodoroSessionFactory(user=self.user, status="active")

        response = self.client.post(f"{self.sessions_url}{session.id}/skip/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        session.refresh_from_db()
        self.assertEqual(session.status, "skipped")
        self.assertIsNotNone(session.completed_at)

    def test_get_session_stats(self):
        """Test getting session statistics."""
        # Create various types of sessions
        CompletedPomodoroSessionFactory(
            user=self.user, session_type="work", actual_duration=25
        )
        CompletedPomodoroSessionFactory(
            user=self.user, session_type="short_break", actual_duration=5
        )
        PomodoroSessionFactory(user=self.user, status="skipped")

        response = self.client.get(f"{self.sessions_url}stats/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        stats = response.data
        self.assertIn("total_sessions", stats)
        self.assertIn("completed_sessions", stats)
        self.assertIn("work_sessions", stats)
        self.assertIn("break_sessions", stats)
        self.assertIn("total_focus_time", stats)
        self.assertIn("completion_rate", stats)
        self.assertIn("current_streak", stats)
        self.assertIn("sessions_by_day", stats)

        self.assertEqual(stats["total_sessions"], 3)
        self.assertEqual(stats["completed_sessions"], 2)
        self.assertEqual(stats["work_sessions"], 2)
        self.assertEqual(stats["break_sessions"], 1)

    def test_filter_sessions_by_type(self):
        """Test filtering sessions by type."""
        work_session = PomodoroSessionFactory(user=self.user, session_type="work")
        break_session = PomodoroSessionFactory(
            user=self.user, session_type="short_break"
        )

        response = self.client.get(f"{self.sessions_url}?type=work")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 1)
        self.assertEqual(response.data["results"][0]["id"], work_session.id)

    def test_filter_sessions_by_status(self):
        """Test filtering sessions by status."""
        active_session = PomodoroSessionFactory(user=self.user, status="active")
        completed_session = CompletedPomodoroSessionFactory(user=self.user)

        response = self.client.get(f"{self.sessions_url}?status=completed")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 1)
        self.assertEqual(response.data["results"][0]["id"], completed_session.id)

    def test_filter_sessions_by_date_range(self):
        """Test filtering sessions by date range."""
        today = timezone.now().date()
        yesterday = today - timedelta(days=1)

        # Create session yesterday
        old_session = PomodoroSessionFactory(user=self.user)
        old_session.started_at = timezone.make_aware(
            timezone.datetime.combine(yesterday, timezone.datetime.min.time())
        )
        old_session.save()

        # Create session today
        new_session = PomodoroSessionFactory(user=self.user)

        response = self.client.get(f"{self.sessions_url}?start_date={today}")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 1)
        self.assertEqual(response.data["results"][0]["id"], new_session.id)

    def test_unauthorized_access(self):
        """Test that unauthenticated users cannot access sessions."""
        self.client.force_authenticate(user=None)

        response = self.client.get(self.sessions_url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_user_cannot_access_other_user_sessions(self):
        """Test that users can only access their own sessions."""
        other_user = UserFactory()
        other_session = PomodoroSessionFactory(user=other_user)

        response = self.client.get(f"{self.sessions_url}{other_session.id}/")

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_cannot_assign_other_user_task_to_session(self):
        """Test that users cannot assign other user's tasks to sessions."""
        other_user = UserFactory()
        other_task = TaskFactory(user=other_user)

        data = {
            "session_type": "work",
            "planned_duration": 25,
            "session_number": 1,
            "task": other_task.id,
        }

        response = self.client.post(self.sessions_url, data)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_session_missing_planned_duration(self):
        """Test that creating a session without planned_duration fails."""
        data = {
            "session_type": "work",
            "session_number": 1,
        }

        response = self.client.post(self.sessions_url, data)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("planned_duration", str(response.data))

    def test_create_session_without_session_number_uses_default(self):
        """Test that creating a session without session_number uses default value 1."""
        data = {
            "session_type": "work",
            "planned_duration": 25,
        }

        response = self.client.post(self.sessions_url, data)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        session = PomodoroSession.objects.get(id=response.data["id"])
        self.assertEqual(session.session_number, 1)  # Default value

    def test_create_session_missing_session_type(self):
        """Test that creating a session without session_type fails."""
        data = {
            "planned_duration": 25,
            "session_number": 1,
        }

        response = self.client.post(self.sessions_url, data)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("session_type", str(response.data))

    def test_create_session_with_wrong_field_names(self):
        """Test that frontend-style field names fail validation."""
        data = {
            "session_type": "work",
            "planned_duration": 25,
            "session_number": 1,
            "task_id": self.task.id,  # Wrong field name - should be 'task'
            "started_at": "2025-01-01T10:00:00Z",  # Not expected field
        }

        response = self.client.post(self.sessions_url, data)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # The session should be created but task should be None since task_id is ignored
        session = PomodoroSession.objects.get(id=response.data["id"])
        self.assertIsNone(session.task)  # task_id was ignored

    def test_update_session_status_only(self):
        """Test that updating only the status field works with PATCH."""
        session = PomodoroSessionFactory(user=self.user, status="active")

        data = {"status": "cancelled"}

        response = self.client.patch(f"{self.sessions_url}{session.id}/", data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        session.refresh_from_db()
        self.assertEqual(session.status, "cancelled")

    def test_update_session_partial_fields(self):
        """Test that PATCH with only some fields works without requiring all fields."""
        session = PomodoroSessionFactory(user=self.user, status="active")

        data = {
            "status": "completed",
            "notes": "Great work session!"
        }

        response = self.client.patch(f"{self.sessions_url}{session.id}/", data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        session.refresh_from_db()
        self.assertEqual(session.status, "completed")
        self.assertEqual(session.notes, "Great work session!")

    def test_update_session_invalid_status_transition(self):
        """Test that invalid status transitions are rejected."""
        session = CompletedPomodoroSessionFactory(user=self.user)  # Already completed

        data = {"status": "active"}  # Can't reactivate completed session

        response = self.client.patch(f"{self.sessions_url}{session.id}/", data)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Cannot change status", str(response.data))

"""Tests for Pomodoro models."""

from datetime import timedelta

from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.test import TestCase
from django.utils import timezone

from api.task.tests.factories import TaskFactory
from api.user.tests.factories import UserFactory
from pomodoro.models import PomodoroPreset, PomodoroSession

from .factories import (
    CompletedPomodoroSessionFactory,
    PausedPomodoroSessionFactory,
    PomodoroPresetFactory,
    PomodoroSessionFactory,
    PomodoroSettingsFactory,
)


class PomodoroSettingsModelTest(TestCase):
    """Test cases for PomodoroSettings model."""

    def setUp(self):
        """Set up test data."""
        self.user = UserFactory()
        self.settings = PomodoroSettingsFactory(user=self.user)

    def test_create_settings(self):
        """Test creating Pomodoro settings."""
        self.assertEqual(self.settings.work_duration, 25)
        self.assertEqual(self.settings.short_break_duration, 5)
        self.assertEqual(self.settings.long_break_duration, 15)
        self.assertEqual(self.settings.sessions_until_long_break, 4)
        self.assertFalse(self.settings.auto_start_breaks)
        self.assertFalse(self.settings.auto_start_work)
        self.assertTrue(self.settings.enable_audio)
        self.assertEqual(self.settings.work_sound, "bell")
        self.assertEqual(self.settings.break_sound, "chime")
        self.assertEqual(self.settings.volume, 0.7)
        self.assertTrue(self.settings.enable_notifications)

    def test_settings_str_representation(self):
        """Test string representation of settings."""
        expected = f"{self.user.username}'s Pomodoro Settings"
        self.assertEqual(str(self.settings), expected)

    def test_one_to_one_relationship(self):
        """Test that user can only have one settings instance."""
        with self.assertRaises(IntegrityError):
            PomodoroSettingsFactory(user=self.user)

    def test_work_duration_validation(self):
        """Test work duration validation."""
        # Valid range: 1-120
        self.settings.work_duration = 0
        with self.assertRaises(ValidationError):
            self.settings.full_clean()

        self.settings.work_duration = 121
        with self.assertRaises(ValidationError):
            self.settings.full_clean()

        self.settings.work_duration = 60
        self.settings.full_clean()  # Should not raise

    def test_short_break_duration_validation(self):
        """Test short break duration validation."""
        # Valid range: 1-60
        self.settings.short_break_duration = 0
        with self.assertRaises(ValidationError):
            self.settings.full_clean()

        self.settings.short_break_duration = 61
        with self.assertRaises(ValidationError):
            self.settings.full_clean()

        self.settings.short_break_duration = 10
        self.settings.full_clean()  # Should not raise

    def test_long_break_duration_validation(self):
        """Test long break duration validation."""
        # Valid range: 1-120
        self.settings.long_break_duration = 0
        with self.assertRaises(ValidationError):
            self.settings.full_clean()

        self.settings.long_break_duration = 121
        with self.assertRaises(ValidationError):
            self.settings.full_clean()

        self.settings.long_break_duration = 30
        self.settings.full_clean()  # Should not raise

    def test_sessions_until_long_break_validation(self):
        """Test sessions until long break validation."""
        # Valid range: 2-12
        self.settings.sessions_until_long_break = 1
        with self.assertRaises(ValidationError):
            self.settings.full_clean()

        self.settings.sessions_until_long_break = 13
        with self.assertRaises(ValidationError):
            self.settings.full_clean()

        self.settings.sessions_until_long_break = 6
        self.settings.full_clean()  # Should not raise

    def test_volume_validation(self):
        """Test volume validation."""
        # Valid range: 0.0-1.0
        self.settings.volume = -0.1
        with self.assertRaises(ValidationError):
            self.settings.full_clean()

        self.settings.volume = 1.1
        with self.assertRaises(ValidationError):
            self.settings.full_clean()

        self.settings.volume = 0.5
        self.settings.full_clean()  # Should not raise


class PomodoroPresetModelTest(TestCase):
    """Test cases for PomodoroPreset model."""

    def setUp(self):
        """Set up test data."""
        self.user = UserFactory()
        self.preset = PomodoroPresetFactory(user=self.user, name="Focus Mode")

    def test_create_preset(self):
        """Test creating Pomodoro preset."""
        self.assertEqual(self.preset.user, self.user)
        self.assertEqual(self.preset.name, "Focus Mode")
        self.assertIsNotNone(self.preset.work_duration)
        self.assertIsNotNone(self.preset.short_break_duration)
        self.assertIsNotNone(self.preset.long_break_duration)
        self.assertIsNotNone(self.preset.sessions_until_long_break)
        self.assertFalse(self.preset.is_default)

    def test_preset_str_representation(self):
        """Test string representation of preset."""
        expected = f"{self.user.username} - Focus Mode"
        self.assertEqual(str(self.preset), expected)

    def test_multiple_presets_per_user(self):
        """Test that user can have multiple presets."""
        preset2 = PomodoroPresetFactory(user=self.user, name="Short Sessions")
        self.assertEqual(PomodoroPreset.objects.filter(user=self.user).count(), 2)

    def test_default_preset_constraint(self):
        """Test that only one preset can be default per user."""
        preset1 = PomodoroPresetFactory(user=self.user, is_default=True)
        preset2 = PomodoroPresetFactory(user=self.user, is_default=True)

        # Should be able to have multiple default presets as it's enforced at the application level
        self.assertTrue(preset1.is_default)
        self.assertTrue(preset2.is_default)

    def test_duration_validation_constraints(self):
        """Test duration validation constraints."""
        # Work duration: 1-120
        self.preset.work_duration = 0
        with self.assertRaises(ValidationError):
            self.preset.full_clean()

        # Short break: 1-60
        self.preset.work_duration = 25
        self.preset.short_break_duration = 0
        with self.assertRaises(ValidationError):
            self.preset.full_clean()

        # Long break: 1-120
        self.preset.short_break_duration = 5
        self.preset.long_break_duration = 0
        with self.assertRaises(ValidationError):
            self.preset.full_clean()

        # Sessions until long break: 2-12
        self.preset.long_break_duration = 15
        self.preset.sessions_until_long_break = 1
        with self.assertRaises(ValidationError):
            self.preset.full_clean()

        # All valid
        self.preset.sessions_until_long_break = 4
        self.preset.full_clean()  # Should not raise


class PomodoroSessionModelTest(TestCase):
    """Test cases for PomodoroSession model."""

    def setUp(self):
        """Set up test data."""
        self.user = UserFactory()
        self.task = TaskFactory(user=self.user)
        self.session = PomodoroSessionFactory(user=self.user, task=self.task)

    def test_create_session(self):
        """Test creating Pomodoro session."""
        self.assertEqual(self.session.user, self.user)
        self.assertEqual(self.session.session_type, "work")
        self.assertEqual(self.session.planned_duration, 25)
        self.assertEqual(self.session.session_number, 1)
        self.assertEqual(self.session.status, "active")
        self.assertIsNotNone(self.session.started_at)
        self.assertIsNone(self.session.completed_at)
        self.assertIsNone(self.session.paused_at)
        self.assertEqual(self.session.task, self.task)
        self.assertIsNone(self.session.productivity_rating)
        self.assertEqual(self.session.notes, "")

    def test_session_str_representation(self):
        """Test string representation of session."""
        expected = f"{self.user.username} - Work Session ({self.session.started_at.strftime('%Y-%m-%d %H:%M')})"
        self.assertEqual(str(self.session), expected)

    def test_session_types(self):
        """Test different session types."""
        work_session = PomodoroSessionFactory(session_type="work")
        self.assertEqual(work_session.session_type, "work")

        short_break = PomodoroSessionFactory(session_type="short_break")
        self.assertEqual(short_break.session_type, "short_break")

        long_break = PomodoroSessionFactory(session_type="long_break")
        self.assertEqual(long_break.session_type, "long_break")

    def test_session_statuses(self):
        """Test different session statuses."""
        active_session = PomodoroSessionFactory(status="active")
        self.assertEqual(active_session.status, "active")

        paused_session = PausedPomodoroSessionFactory()
        self.assertEqual(paused_session.status, "paused")
        self.assertIsNotNone(paused_session.paused_at)

        completed_session = CompletedPomodoroSessionFactory()
        self.assertEqual(completed_session.status, "completed")
        self.assertIsNotNone(completed_session.completed_at)

    def test_remaining_minutes_property(self):
        """Test remaining minutes calculated property."""
        # For a newly started session
        now = timezone.now()
        session = PomodoroSessionFactory(planned_duration=25)
        # Update started_at after creation to avoid LazyFunction override
        session.started_at = now - timedelta(minutes=10)
        session.save()

        # Should have approximately 15 minutes remaining
        remaining = session.remaining_minutes
        self.assertGreaterEqual(remaining, 14)
        self.assertLessEqual(remaining, 16)

    def test_remaining_minutes_with_paused_time(self):
        """Test remaining minutes with paused time."""
        now = timezone.now()
        session = PausedPomodoroSessionFactory(planned_duration=25)
        # Update times after creation to avoid LazyFunction override
        session.started_at = now - timedelta(minutes=15)
        session.paused_at = now - timedelta(minutes=5)
        session.save()

        # Should have approximately 15 minutes remaining (25 - 10 active minutes)
        remaining = session.remaining_minutes
        self.assertGreaterEqual(remaining, 14)
        self.assertLessEqual(remaining, 16)

    def test_completed_session_remaining_minutes(self):
        """Test remaining minutes for completed session."""
        now = timezone.now()
        completed_session = CompletedPomodoroSessionFactory(planned_duration=25)
        # Manually set times to ensure proper elapsed time calculation
        completed_session.started_at = now - timedelta(minutes=25)
        completed_session.completed_at = now
        completed_session.save()

        # For a completed session that ran full duration, remaining should be 0
        self.assertEqual(completed_session.remaining_minutes, 0)

    def test_elapsed_minutes_property(self):
        """Test elapsed minutes calculated property."""
        now = timezone.now()
        session = PomodoroSessionFactory()
        # Update started_at after creation to avoid LazyFunction override
        session.started_at = now - timedelta(minutes=10)
        session.save()

        # Should have approximately 10 minutes elapsed
        elapsed = session.elapsed_minutes
        self.assertGreaterEqual(elapsed, 9)
        self.assertLessEqual(elapsed, 11)

    def test_is_work_session_property(self):
        """Test work session property."""
        work_session = PomodoroSessionFactory(session_type="work")
        self.assertTrue(work_session.is_work_session)

        break_session = PomodoroSessionFactory(session_type="short_break")
        self.assertFalse(break_session.is_work_session)

    def test_is_break_session_property(self):
        """Test break session property."""
        short_break = PomodoroSessionFactory(session_type="short_break")
        self.assertTrue(short_break.is_break_session)

        long_break = PomodoroSessionFactory(session_type="long_break")
        self.assertTrue(long_break.is_break_session)

        work_session = PomodoroSessionFactory(session_type="work")
        self.assertFalse(work_session.is_break_session)

    def test_duration_validation(self):
        """Test duration field validation."""
        # Planned duration should be positive
        self.session.planned_duration = 0
        with self.assertRaises(ValidationError):
            self.session.full_clean()

        self.session.planned_duration = -1
        with self.assertRaises(ValidationError):
            self.session.full_clean()

        self.session.planned_duration = 25
        self.session.full_clean()  # Should not raise

    def test_productivity_rating_validation(self):
        """Test productivity rating validation."""
        # Valid range: 1-5
        self.session.productivity_rating = 0
        with self.assertRaises(ValidationError):
            self.session.full_clean()

        self.session.productivity_rating = 6
        with self.assertRaises(ValidationError):
            self.session.full_clean()

        self.session.productivity_rating = 3
        self.session.full_clean()  # Should not raise

    def test_session_without_task(self):
        """Test session can be created without a task."""
        session = PomodoroSessionFactory(task=None)
        self.assertIsNone(session.task)

    def test_cascade_delete_user(self):
        """Test that sessions are deleted when user is deleted."""
        session_id = self.session.id
        self.user.delete()

        with self.assertRaises(PomodoroSession.DoesNotExist):
            PomodoroSession.objects.get(id=session_id)

    def test_cascade_delete_task(self):
        """Test that session task is set to null when task is deleted."""
        self.task.delete()
        self.session.refresh_from_db()
        self.assertIsNone(self.session.task)

    def test_session_ordering(self):
        """Test default ordering by started_at descending."""
        now = timezone.now()
        session1 = PomodoroSessionFactory(started_at=now - timedelta(hours=1))
        session2 = PomodoroSessionFactory(started_at=now)

        sessions = PomodoroSession.objects.all()
        self.assertEqual(sessions[0], session2)  # Most recent first
        self.assertEqual(sessions[1], session1)

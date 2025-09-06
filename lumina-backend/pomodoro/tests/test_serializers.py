"""Tests for Pomodoro serializers."""

from django.test import TestCase

from api.task.tests.factories import TaskFactory
from api.user.tests.factories import UserFactory
from pomodoro.serializers import (
    PomodoroPresetSerializer,
    PomodoroSessionCreateSerializer,
    PomodoroSessionSerializer,
    PomodoroSessionStatsSerializer,
    PomodoroSettingsSerializer,
)

from .factories import (
    PomodoroPresetFactory,
    PomodoroSessionFactory,
    PomodoroSettingsFactory,
)


class PomodoroSettingsSerializerTest(TestCase):
    """Test cases for PomodoroSettingsSerializer."""

    def setUp(self):
        """Set up test data."""
        self.user = UserFactory()
        self.settings = PomodoroSettingsFactory(user=self.user)

    def test_serialization(self):
        """Test serializing settings."""
        serializer = PomodoroSettingsSerializer(self.settings)
        data = serializer.data

        self.assertEqual(data["id"], self.settings.id)
        self.assertEqual(data["work_duration"], self.settings.work_duration)
        self.assertEqual(
            data["short_break_duration"], self.settings.short_break_duration
        )
        self.assertEqual(data["long_break_duration"], self.settings.long_break_duration)
        self.assertEqual(
            data["sessions_until_long_break"], self.settings.sessions_until_long_break
        )
        self.assertEqual(data["auto_start_breaks"], self.settings.auto_start_breaks)
        self.assertEqual(data["auto_start_work"], self.settings.auto_start_work)
        self.assertEqual(data["enable_audio"], self.settings.enable_audio)
        self.assertEqual(data["work_sound"], self.settings.work_sound)
        self.assertEqual(data["break_sound"], self.settings.break_sound)
        self.assertEqual(data["volume"], self.settings.volume)
        self.assertEqual(
            data["enable_notifications"], self.settings.enable_notifications
        )

    def test_deserialization(self):
        """Test deserializing settings data."""
        data = {
            "work_duration": 30,
            "short_break_duration": 10,
            "long_break_duration": 20,
            "sessions_until_long_break": 3,
            "auto_start_breaks": True,
            "auto_start_work": True,
            "enable_audio": False,
            "work_sound": "ding",
            "break_sound": "beep",
            "volume": 0.8,
            "enable_notifications": False,
        }

        serializer = PomodoroSettingsSerializer(self.settings, data=data, partial=True)
        self.assertTrue(serializer.is_valid())

        updated_settings = serializer.save()
        self.assertEqual(updated_settings.work_duration, 30)
        self.assertEqual(updated_settings.short_break_duration, 10)
        self.assertEqual(updated_settings.long_break_duration, 20)
        self.assertEqual(updated_settings.sessions_until_long_break, 3)
        self.assertTrue(updated_settings.auto_start_breaks)
        self.assertTrue(updated_settings.auto_start_work)
        self.assertFalse(updated_settings.enable_audio)
        self.assertEqual(updated_settings.work_sound, "ding")
        self.assertEqual(updated_settings.break_sound, "beep")
        self.assertEqual(updated_settings.volume, 0.8)
        self.assertFalse(updated_settings.enable_notifications)

    def test_validation_work_duration(self):
        """Test work duration validation."""
        # Invalid: too low
        data = {"work_duration": 0}
        serializer = PomodoroSettingsSerializer(self.settings, data=data, partial=True)
        self.assertFalse(serializer.is_valid())
        self.assertIn("work_duration", serializer.errors)

        # Invalid: too high
        data = {"work_duration": 121}
        serializer = PomodoroSettingsSerializer(self.settings, data=data, partial=True)
        self.assertFalse(serializer.is_valid())
        self.assertIn("work_duration", serializer.errors)

        # Valid
        data = {"work_duration": 45}
        serializer = PomodoroSettingsSerializer(self.settings, data=data, partial=True)
        self.assertTrue(serializer.is_valid())

    def test_validation_volume(self):
        """Test volume validation."""
        # Invalid: too low
        data = {"volume": -0.1}
        serializer = PomodoroSettingsSerializer(self.settings, data=data, partial=True)
        self.assertFalse(serializer.is_valid())
        self.assertIn("volume", serializer.errors)

        # Invalid: too high
        data = {"volume": 1.1}
        serializer = PomodoroSettingsSerializer(self.settings, data=data, partial=True)
        self.assertFalse(serializer.is_valid())
        self.assertIn("volume", serializer.errors)

        # Valid
        data = {"volume": 0.5}
        serializer = PomodoroSettingsSerializer(self.settings, data=data, partial=True)
        self.assertTrue(serializer.is_valid())

    def test_validation_sessions_until_long_break(self):
        """Test sessions until long break validation."""
        # Invalid: too low
        data = {"sessions_until_long_break": 1}
        serializer = PomodoroSettingsSerializer(self.settings, data=data, partial=True)
        self.assertFalse(serializer.is_valid())
        self.assertIn("sessions_until_long_break", serializer.errors)

        # Invalid: too high
        data = {"sessions_until_long_break": 13}
        serializer = PomodoroSettingsSerializer(self.settings, data=data, partial=True)
        self.assertFalse(serializer.is_valid())
        self.assertIn("sessions_until_long_break", serializer.errors)

        # Valid
        data = {"sessions_until_long_break": 6}
        serializer = PomodoroSettingsSerializer(self.settings, data=data, partial=True)
        self.assertTrue(serializer.is_valid())


class PomodoroPresetSerializerTest(TestCase):
    """Test cases for PomodoroPresetSerializer."""

    def setUp(self):
        """Set up test data."""
        self.user = UserFactory()
        self.preset = PomodoroPresetFactory(user=self.user)

    def get_context(self, user=None):
        """Create mock request context for serializer."""

        class MockRequest:
            def __init__(self, user):
                self.user = user

        return {"request": MockRequest(user or self.user)}

    def test_serialization(self):
        """Test serializing preset."""
        serializer = PomodoroPresetSerializer(self.preset)
        data = serializer.data

        self.assertEqual(data["id"], self.preset.id)
        self.assertEqual(data["name"], self.preset.name)
        self.assertEqual(data["work_duration"], self.preset.work_duration)
        self.assertEqual(data["short_break_duration"], self.preset.short_break_duration)
        self.assertEqual(data["long_break_duration"], self.preset.long_break_duration)
        self.assertEqual(
            data["sessions_until_long_break"], self.preset.sessions_until_long_break
        )
        self.assertEqual(data["is_default"], self.preset.is_default)

    def test_create_preset(self):
        """Test creating new preset."""
        data = {
            "name": "Deep Work",
            "work_duration": 45,
            "short_break_duration": 15,
            "long_break_duration": 30,
            "sessions_until_long_break": 2,
            "is_default": True,
        }

        serializer = PomodoroPresetSerializer(data=data, context=self.get_context())
        self.assertTrue(serializer.is_valid())

        preset = serializer.save(user=self.user)
        self.assertEqual(preset.name, "Deep Work")
        self.assertEqual(preset.work_duration, 45)
        self.assertEqual(preset.short_break_duration, 15)
        self.assertEqual(preset.long_break_duration, 30)
        self.assertEqual(preset.sessions_until_long_break, 2)
        self.assertTrue(preset.is_default)
        self.assertEqual(preset.user, self.user)

    def test_validation_name_required(self):
        """Test that name is required."""
        data = {
            "work_duration": 25,
            "short_break_duration": 5,
            "long_break_duration": 15,
            "sessions_until_long_break": 4,
        }

        serializer = PomodoroPresetSerializer(data=data, context=self.get_context())
        self.assertFalse(serializer.is_valid())
        self.assertIn("name", serializer.errors)

    def test_validation_duration_constraints(self):
        """Test duration validation constraints."""
        # Work duration: 1-120
        data = {
            "name": "Test",
            "work_duration": 0,
            "short_break_duration": 5,
            "long_break_duration": 15,
            "sessions_until_long_break": 4,
        }
        serializer = PomodoroPresetSerializer(data=data, context=self.get_context())
        self.assertFalse(serializer.is_valid())
        self.assertIn("work_duration", serializer.errors)

        # Short break: 1-60
        data["work_duration"] = 25
        data["short_break_duration"] = 61
        serializer = PomodoroPresetSerializer(data=data, context=self.get_context())
        self.assertFalse(serializer.is_valid())
        self.assertIn("short_break_duration", serializer.errors)

        # Long break: 1-120
        data["short_break_duration"] = 5
        data["long_break_duration"] = 121
        serializer = PomodoroPresetSerializer(data=data, context=self.get_context())
        self.assertFalse(serializer.is_valid())
        self.assertIn("long_break_duration", serializer.errors)

        # Sessions until long break: 2-12
        data["long_break_duration"] = 15
        data["sessions_until_long_break"] = 1
        serializer = PomodoroPresetSerializer(data=data, context=self.get_context())
        self.assertFalse(serializer.is_valid())
        self.assertIn("sessions_until_long_break", serializer.errors)

        # All valid
        data["sessions_until_long_break"] = 4
        serializer = PomodoroPresetSerializer(data=data, context=self.get_context())
        self.assertTrue(serializer.is_valid())


class PomodoroSessionSerializerTest(TestCase):
    """Test cases for PomodoroSessionSerializer."""

    def setUp(self):
        """Set up test data."""
        self.user = UserFactory()
        self.task = TaskFactory(user=self.user)
        self.session = PomodoroSessionFactory(user=self.user, task=self.task)

    def get_context(self, user=None):
        """Create mock request context for serializer."""

        class MockRequest:
            def __init__(self, user):
                self.user = user

        return {"request": MockRequest(user or self.user)}

    def test_serialization(self):
        """Test serializing session."""
        serializer = PomodoroSessionSerializer(self.session)
        data = serializer.data

        self.assertEqual(data["id"], self.session.id)
        self.assertEqual(data["session_type"], self.session.session_type)
        self.assertEqual(data["status"], self.session.status)
        self.assertEqual(data["planned_duration"], self.session.planned_duration)
        self.assertEqual(data["actual_duration"], self.session.actual_duration)
        self.assertEqual(data["session_number"], self.session.session_number)
        self.assertEqual(data["remaining_minutes"], self.session.remaining_minutes)
        self.assertEqual(data["elapsed_minutes"], self.session.elapsed_minutes)
        self.assertEqual(data["notes"], self.session.notes)
        self.assertEqual(data["productivity_rating"], self.session.productivity_rating)
        self.assertIsNotNone(data["started_at"])
        self.assertIn("task", data)

    def test_serialization_with_task_details(self):
        """Test serializing session with task details."""
        serializer = PomodoroSessionSerializer(self.session)
        data = serializer.data

        # Task is serialized as ID, task details are in separate fields
        self.assertIsNotNone(data["task"])
        self.assertEqual(data["task"], self.task.id)
        self.assertEqual(data["task_title"], self.task.title)

    def test_serialization_without_task(self):
        """Test serializing session without task."""
        session = PomodoroSessionFactory(user=self.user, task=None)
        serializer = PomodoroSessionSerializer(session)
        data = serializer.data

        self.assertIsNone(data["task"])

    def test_read_only_fields(self):
        """Test that computed fields are read-only."""
        serializer = PomodoroSessionSerializer(self.session)

        # These should be in serialized data but not updatable
        readonly_fields = [
            "remaining_minutes",
            "elapsed_minutes",
            "started_at",
            "completed_at",
            "paused_at",
        ]

        for field in readonly_fields:
            self.assertIn(field, serializer.data)


class PomodoroSessionCreateSerializerTest(TestCase):
    """Test cases for PomodoroSessionCreateSerializer."""

    def setUp(self):
        """Set up test data."""
        self.user = UserFactory()
        self.task = TaskFactory(user=self.user)

    def get_context(self, user=None):
        """Create mock request context for serializer."""

        class MockRequest:
            def __init__(self, user):
                self.user = user

        return {"request": MockRequest(user or self.user)}

    def test_create_session_with_task(self):
        """Test creating session with task."""
        data = {
            "session_type": "work",
            "planned_duration": 25,
            "session_number": 1,
            "task": self.task.id,
        }

        serializer = PomodoroSessionCreateSerializer(
            data=data, context=self.get_context()
        )
        self.assertTrue(serializer.is_valid())

        session = serializer.save(user=self.user)
        self.assertEqual(session.session_type, "work")
        self.assertEqual(session.planned_duration, 25)
        self.assertEqual(session.session_number, 1)
        self.assertEqual(session.task, self.task)
        self.assertEqual(session.user, self.user)
        self.assertEqual(session.status, "active")

    def test_create_session_without_task(self):
        """Test creating session without task."""
        data = {
            "session_type": "short_break",
            "planned_duration": 5,
            "session_number": 1,
        }

        serializer = PomodoroSessionCreateSerializer(
            data=data, context=self.get_context()
        )
        self.assertTrue(serializer.is_valid())

        session = serializer.save(user=self.user)
        self.assertEqual(session.session_type, "short_break")
        self.assertEqual(session.planned_duration, 5)
        self.assertIsNone(session.task)

    def test_validation_session_type(self):
        """Test session type validation."""
        # Valid types
        for session_type in ["work", "short_break", "long_break"]:
            data = {
                "session_type": session_type,
                "planned_duration": 25,
                "session_number": 1,
            }
            serializer = PomodoroSessionCreateSerializer(
                data=data, context=self.get_context()
            )
            self.assertTrue(serializer.is_valid())

        # Invalid type
        data = {
            "session_type": "invalid",
            "planned_duration": 25,
            "session_number": 1,
        }
        serializer = PomodoroSessionCreateSerializer(
            data=data, context=self.get_context()
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn("session_type", serializer.errors)

    def test_validation_planned_duration(self):
        """Test planned duration validation."""
        # Invalid: zero
        data = {
            "session_type": "work",
            "planned_duration": 0,
            "session_number": 1,
        }
        serializer = PomodoroSessionCreateSerializer(
            data=data, context=self.get_context()
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn("planned_duration", serializer.errors)

        # Invalid: too high
        data["planned_duration"] = 121
        serializer = PomodoroSessionCreateSerializer(
            data=data, context=self.get_context()
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn("planned_duration", serializer.errors)

        # Valid
        data["planned_duration"] = 25
        serializer = PomodoroSessionCreateSerializer(
            data=data, context=self.get_context()
        )
        self.assertTrue(serializer.is_valid())

    def test_validation_task_ownership(self):
        """Test that user can only assign their own tasks."""
        other_user = UserFactory()
        other_task = TaskFactory(user=other_user)

        data = {
            "session_type": "work",
            "planned_duration": 25,
            "session_number": 1,
            "task": other_task.id,
        }

        # Create serializer with context containing the request user
        request_mock = type("Request", (), {"user": self.user})()
        serializer = PomodoroSessionCreateSerializer(
            data=data, context={"request": request_mock}
        )

        # Should be invalid because task belongs to different user
        self.assertFalse(serializer.is_valid())
        self.assertIn("task", serializer.errors)


class PomodoroSessionStatsSerializerTest(TestCase):
    """Test cases for PomodoroSessionStatsSerializer."""

    def test_serialization(self):
        """Test serializing stats data."""
        stats_data = {
            "total_sessions": 100,
            "completed_sessions": 85,
            "work_sessions": 70,
            "break_sessions": 30,
            "total_focus_time": 1750,  # minutes
            "average_session_duration": 24.5,
            "completion_rate": 85.0,
            "daily_average": 3.3,
            "current_streak": 5,
            "longest_streak": 12,
            "sessions_by_day": {"2023-12-01": 4, "2023-12-02": 3},
            "focus_time_by_day": {"2023-12-01": 100, "2023-12-02": 75},
            "average_productivity": 4.2,
            "productivity_distribution": {"1": 2, "2": 5, "3": 15, "4": 25, "5": 23},
        }

        serializer = PomodoroSessionStatsSerializer(stats_data)
        data = serializer.data

        self.assertEqual(data["total_sessions"], 100)
        self.assertEqual(data["completed_sessions"], 85)
        self.assertEqual(data["work_sessions"], 70)
        self.assertEqual(data["break_sessions"], 30)
        self.assertEqual(data["total_focus_time"], 1750)
        self.assertEqual(data["average_session_duration"], 24.5)
        self.assertEqual(data["completion_rate"], 85.0)
        self.assertEqual(data["daily_average"], 3.3)
        self.assertEqual(data["current_streak"], 5)
        self.assertEqual(data["longest_streak"], 12)
        self.assertEqual(data["sessions_by_day"], {"2023-12-01": 4, "2023-12-02": 3})
        self.assertEqual(
            data["focus_time_by_day"], {"2023-12-01": 100, "2023-12-02": 75}
        )
        self.assertEqual(data["average_productivity"], 4.2)
        self.assertEqual(
            data["productivity_distribution"],
            {"1": 2, "2": 5, "3": 15, "4": 25, "5": 23},
        )

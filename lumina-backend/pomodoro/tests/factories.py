"""Factories for Pomodoro model testing."""

from datetime import timedelta

import factory
from django.utils import timezone
from faker import Faker

from api.task.tests.factories import TaskFactory
from api.user.tests.factories import UserFactory
from pomodoro.models import PomodoroPreset, PomodoroSession, PomodoroSettings

fake = Faker()


class PomodoroSettingsFactory(factory.django.DjangoModelFactory):
    """Factory for creating PomodoroSettings instances."""

    class Meta:
        model = PomodoroSettings

    user = factory.SubFactory(UserFactory)
    work_duration = 25
    short_break_duration = 5
    long_break_duration = 15
    sessions_until_long_break = 4
    auto_start_breaks = False
    auto_start_work = False
    enable_audio = True
    work_sound = "bell"
    break_sound = "chime"
    volume = 0.7
    enable_notifications = True


class PomodoroPresetFactory(factory.django.DjangoModelFactory):
    """Factory for creating PomodoroPreset instances."""

    class Meta:
        model = PomodoroPreset

    user = factory.SubFactory(UserFactory)
    name = factory.Faker("word")
    work_duration = factory.Faker("random_int", min=15, max=60)
    short_break_duration = factory.Faker("random_int", min=3, max=15)
    long_break_duration = factory.Faker("random_int", min=10, max=30)
    sessions_until_long_break = factory.Faker("random_int", min=2, max=8)
    is_default = False


class PomodoroSessionFactory(factory.django.DjangoModelFactory):
    """Factory for creating PomodoroSession instances."""

    class Meta:
        model = PomodoroSession

    user = factory.SubFactory(UserFactory)
    session_type = "work"
    planned_duration = 25
    actual_duration = None
    session_number = 1
    status = "active"
    started_at = factory.LazyFunction(timezone.now)
    completed_at = None
    paused_at = None
    total_paused_seconds = 0
    task = factory.SubFactory(TaskFactory)
    productivity_rating = None
    notes = ""


class CompletedPomodoroSessionFactory(PomodoroSessionFactory):
    """Factory for completed Pomodoro sessions."""

    status = "completed"
    actual_duration = factory.LazyAttribute(lambda obj: obj.planned_duration)
    started_at = factory.LazyFunction(lambda: timezone.now() - timedelta(minutes=25))
    completed_at = factory.LazyFunction(timezone.now)


class PausedPomodoroSessionFactory(PomodoroSessionFactory):
    """Factory for paused Pomodoro sessions."""

    status = "paused"
    paused_at = factory.LazyFunction(timezone.now)

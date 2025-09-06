"""Factory classes for task management tests."""

import factory
from django.contrib.auth.models import User
from factory.django import DjangoModelFactory

from api.task.models import Label, Project, Task, TaskComment


class UserFactory(DjangoModelFactory):
    """Factory for creating test users."""

    class Meta:
        model = User

    username = factory.Sequence(lambda n: f"user{n}")
    email = factory.Faker("email")
    first_name = factory.Faker("first_name")
    last_name = factory.Faker("last_name")
    password = factory.PostGenerationMethodCall("set_password", "password123")


class ProjectFactory(DjangoModelFactory):
    """Factory for creating test projects."""

    class Meta:
        model = Project

    name = factory.Faker("word")
    description = factory.Faker("text", max_nb_chars=200)
    color = "#3B82F6"
    user = factory.SubFactory(UserFactory)
    position = factory.Sequence(lambda n: n)


class LabelFactory(DjangoModelFactory):
    """Factory for creating test labels."""

    class Meta:
        model = Label

    name = factory.Faker("word")
    color = "#6B7280"
    user = factory.SubFactory(UserFactory)


class TaskFactory(DjangoModelFactory):
    """Factory for creating test tasks."""

    class Meta:
        model = Task

    title = factory.Faker("sentence", nb_words=4)
    description = factory.Faker("text", max_nb_chars=500)
    notes = factory.Faker("text", max_nb_chars=1000)
    priority = ""
    user = factory.SubFactory(UserFactory)
    position = factory.Sequence(lambda n: n)

    @factory.post_generation
    def labels(self, create, extracted, **kwargs):
        """Add labels to task after creation."""
        if not create:
            return

        if extracted:
            for label in extracted:
                self.labels.add(label)


class TaskCommentFactory(DjangoModelFactory):
    """Factory for creating test task comments."""

    class Meta:
        model = TaskComment

    task = factory.SubFactory(TaskFactory)
    user = factory.SubFactory(UserFactory)
    content = factory.Faker("text", max_nb_chars=1000)

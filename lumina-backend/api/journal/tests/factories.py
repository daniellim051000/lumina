"""Factory classes for journal tests."""

from datetime import date

import factory
from django.contrib.auth.models import User
from factory.django import DjangoModelFactory

from api.journal.models import JournalEntry


class UserFactory(DjangoModelFactory):
    """Factory for creating test users."""

    class Meta:
        model = User

    username = factory.Sequence(lambda n: f"journal_user{n}")
    email = factory.Faker("email")
    first_name = factory.Faker("first_name")
    last_name = factory.Faker("last_name")
    password = factory.PostGenerationMethodCall("set_password", "password123")


class JournalEntryFactory(DjangoModelFactory):
    """Factory for creating test journal entries."""

    class Meta:
        model = JournalEntry

    title = factory.Faker("sentence", nb_words=4)
    content = factory.Faker("text", max_nb_chars=500)
    mood = ""
    date = factory.LazyFunction(date.today)
    user = factory.SubFactory(UserFactory)

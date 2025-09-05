"""Factories for user model testing."""

import factory
from django.contrib.auth.models import User
from faker import Faker

fake = Faker()


class UserFactory(factory.django.DjangoModelFactory):
    """Factory for creating User instances."""

    class Meta:
        model = User

    username = factory.Sequence(lambda n: f"testuser{n}")
    email = factory.LazyAttribute(lambda obj: f"{obj.username}@example.com")
    first_name = factory.Faker("first_name")
    last_name = factory.Faker("last_name")
    is_active = True
    is_staff = False
    is_superuser = False

    @factory.post_generation
    def set_password(self, create, extracted, **kwargs):
        """Set password after user creation."""
        if not create:
            return

        password = extracted if extracted else "TestPass123!"
        self.set_password(password)
        self.save()


class SuperUserFactory(UserFactory):
    """Factory for creating superuser instances."""

    is_staff = True
    is_superuser = True
    username = factory.Sequence(lambda n: f"admin{n}")
    email = factory.LazyAttribute(lambda obj: f"{obj.username}@example.com")

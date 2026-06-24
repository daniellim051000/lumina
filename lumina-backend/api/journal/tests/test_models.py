"""Tests for journal models."""

from datetime import date

from django.core.exceptions import ValidationError
from django.test import TestCase

from api.journal.models import JournalEntry

from .factories import JournalEntryFactory, UserFactory


class JournalEntryModelTest(TestCase):
    """Test cases for the JournalEntry model."""

    def setUp(self):
        self.user = UserFactory()

    def test_entry_creation(self):
        """Test basic journal entry creation."""
        entry = JournalEntryFactory(user=self.user)
        self.assertEqual(entry.user, self.user)
        self.assertIsNotNone(entry.created_at)
        self.assertIsNotNone(entry.updated_at)
        self.assertIsNotNone(entry.date)

    def test_str_representation(self):
        """Test journal entry string representation."""
        entry = JournalEntryFactory(user=self.user, title="My Day")
        self.assertEqual(str(entry), f"My Day ({self.user.username})")

    def test_default_date_is_today(self):
        """Test the date defaults to today when not provided."""
        entry = JournalEntry.objects.create(user=self.user, title="No date given")
        self.assertEqual(entry.date, date.today())

    def test_ordering_is_most_recent_first(self):
        """Test entries are ordered by date descending."""
        older = JournalEntryFactory(user=self.user, date=date(2024, 1, 1))
        newer = JournalEntryFactory(user=self.user, date=date(2024, 6, 1))
        entries = list(JournalEntry.objects.all())
        self.assertEqual(entries[0], newer)
        self.assertEqual(entries[1], older)

    def test_content_is_sanitized(self):
        """Test HTML tags are stripped from content on save."""
        entry = JournalEntryFactory(
            user=self.user, content="<script>alert('x')</script>Hello"
        )
        self.assertNotIn("<script>", entry.content)
        self.assertIn("Hello", entry.content)

    def test_title_is_sanitized(self):
        """Test HTML tags are stripped from the title on save."""
        entry = JournalEntryFactory(user=self.user, title="<b>Bold</b> title")
        self.assertNotIn("<b>", entry.title)
        self.assertIn("Bold", entry.title)

    def test_empty_title_raises_error(self):
        """Test an empty title raises a validation error."""
        with self.assertRaises(ValidationError):
            JournalEntryFactory(user=self.user, title="   ")

    def test_content_too_long_raises_error(self):
        """Test overly long content raises a validation error."""
        with self.assertRaises(ValidationError):
            JournalEntryFactory(user=self.user, content="x" * 50001)

    def test_invalid_mood_raises_error(self):
        """Test an invalid mood raises a validation error."""
        with self.assertRaises(ValidationError):
            JournalEntryFactory(user=self.user, mood="ecstatic")

    def test_valid_mood_is_accepted(self):
        """Test a valid mood is stored."""
        entry = JournalEntryFactory(user=self.user, mood="great")
        self.assertEqual(entry.mood, "great")

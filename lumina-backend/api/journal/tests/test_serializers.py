"""Tests for journal serializers."""

from datetime import date

from django.test import TestCase
from rest_framework.test import APIRequestFactory

from api.journal.serializers import (
    JournalEntryListSerializer,
    JournalEntrySerializer,
)

from .factories import JournalEntryFactory, UserFactory


class JournalEntrySerializerTest(TestCase):
    """Test cases for JournalEntrySerializer."""

    def setUp(self):
        self.user = UserFactory()
        self.factory = APIRequestFactory()

    def _context(self):
        request = self.factory.post("/api/journal/")
        request.user = self.user
        return {"request": request}

    def test_serialization_includes_expected_fields(self):
        """Test a serialized entry exposes the expected fields."""
        entry = JournalEntryFactory(user=self.user, mood="good")
        data = JournalEntrySerializer(entry).data
        self.assertEqual(data["mood"], "good")
        self.assertEqual(data["user"]["id"], self.user.id)
        self.assertIn("title", data)
        self.assertIn("content", data)
        self.assertIn("date", data)

    def test_create_sets_user_and_sanitizes(self):
        """Test creating via the serializer sets the user and sanitizes input."""
        serializer = JournalEntrySerializer(
            data={
                "title": "<b>Today</b>",
                "content": "<script>bad</script>Good stuff",
                "mood": "okay",
                "date": str(date.today()),
            },
            context=self._context(),
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        entry = serializer.save()
        self.assertEqual(entry.user, self.user)
        self.assertNotIn("<b>", entry.title)
        self.assertNotIn("<script>", entry.content)

    def test_empty_title_is_rejected(self):
        """Test an empty title fails validation."""
        serializer = JournalEntrySerializer(
            data={"title": "   "}, context=self._context()
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn("title", serializer.errors)

    def test_invalid_mood_is_rejected(self):
        """Test an invalid mood fails validation."""
        serializer = JournalEntrySerializer(
            data={"title": "Valid", "mood": "amazing"},
            context=self._context(),
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn("mood", serializer.errors)

    def test_long_content_is_rejected(self):
        """Test overly long content fails validation."""
        serializer = JournalEntrySerializer(
            data={"title": "Valid", "content": "x" * 50001},
            context=self._context(),
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn("content", serializer.errors)


class JournalEntryListSerializerTest(TestCase):
    """Test cases for JournalEntryListSerializer."""

    def setUp(self):
        self.user = UserFactory()

    def test_list_serializer_excludes_full_content(self):
        """Test the list serializer omits the full content field."""
        entry = JournalEntryFactory(user=self.user)
        data = JournalEntryListSerializer(entry).data
        self.assertNotIn("content", data)
        self.assertIn("content_preview", data)

    def test_content_preview_truncates_long_content(self):
        """Test long content is truncated in the preview."""
        entry = JournalEntryFactory(user=self.user, content="y" * 300)
        data = JournalEntryListSerializer(entry).data
        self.assertTrue(data["content_preview"].endswith("..."))
        self.assertLessEqual(len(data["content_preview"]), 153)

    def test_content_preview_empty_when_no_content(self):
        """Test the preview is empty when there is no content."""
        entry = JournalEntryFactory(user=self.user, content="")
        data = JournalEntryListSerializer(entry).data
        self.assertEqual(data["content_preview"], "")

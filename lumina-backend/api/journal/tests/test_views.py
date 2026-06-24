"""Tests for journal views."""

from datetime import date

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from api.journal.models import JournalEntry

from .factories import JournalEntryFactory, UserFactory


class BaseJournalAPITest(APITestCase):
    """Base test class for journal API tests."""

    def setUp(self):
        self.user = UserFactory()
        self.other_user = UserFactory()
        self.client.force_authenticate(user=self.user)


class JournalEntryListCreateTest(BaseJournalAPITest):
    """Test cases for the journal list/create endpoint."""

    def test_list_entries_only_returns_own(self):
        """Test listing returns only the authenticated user's entries."""
        JournalEntryFactory(user=self.user, title="Mine")
        JournalEntryFactory(user=self.other_user, title="Theirs")

        url = reverse("journal:entry-list")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("results", response.data)
        self.assertIn("pagination", response.data)
        titles = [e["title"] for e in response.data["results"]]
        self.assertIn("Mine", titles)
        self.assertNotIn("Theirs", titles)

    def test_create_entry(self):
        """Test creating a journal entry."""
        url = reverse("journal:entry-list")
        data = {
            "title": "A good day",
            "content": "Things went well.",
            "mood": "good",
            "date": str(date.today()),
        }
        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["title"], "A good day")
        self.assertEqual(response.data["user"]["id"], self.user.id)

    def test_create_entry_requires_title(self):
        """Test creating without a title fails."""
        url = reverse("journal:entry-list")
        response = self.client.post(url, {"content": "no title"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_filter_by_exact_date(self):
        """Test filtering entries by an exact date."""
        JournalEntryFactory(user=self.user, title="Jan", date=date(2024, 1, 15))
        JournalEntryFactory(user=self.user, title="Jun", date=date(2024, 6, 15))

        url = reverse("journal:entry-list")
        response = self.client.get(url, {"date": "2024-01-15"})

        titles = [e["title"] for e in response.data["results"]]
        self.assertEqual(titles, ["Jan"])

    def test_filter_by_date_range(self):
        """Test filtering entries by a date range."""
        JournalEntryFactory(user=self.user, title="Early", date=date(2024, 1, 1))
        JournalEntryFactory(user=self.user, title="Mid", date=date(2024, 3, 1))
        JournalEntryFactory(user=self.user, title="Late", date=date(2024, 12, 1))

        url = reverse("journal:entry-list")
        response = self.client.get(
            url, {"date_from": "2024-02-01", "date_to": "2024-06-01"}
        )

        titles = [e["title"] for e in response.data["results"]]
        self.assertEqual(titles, ["Mid"])

    def test_filter_by_mood(self):
        """Test filtering entries by mood."""
        JournalEntryFactory(user=self.user, title="Happy", mood="great")
        JournalEntryFactory(user=self.user, title="Sad", mood="bad")

        url = reverse("journal:entry-list")
        response = self.client.get(url, {"mood": "great"})

        titles = [e["title"] for e in response.data["results"]]
        self.assertEqual(titles, ["Happy"])

    def test_search_matches_title_and_content(self):
        """Test search matches both title and content."""
        JournalEntryFactory(user=self.user, title="Project launch", content="x")
        JournalEntryFactory(user=self.user, title="Other", content="about the launch")
        JournalEntryFactory(user=self.user, title="Unrelated", content="nothing")

        url = reverse("journal:entry-list")
        response = self.client.get(url, {"search": "launch"})

        titles = sorted(e["title"] for e in response.data["results"])
        self.assertEqual(titles, ["Other", "Project launch"])

    def test_list_requires_authentication(self):
        """Test the list endpoint requires authentication."""
        self.client.force_authenticate(user=None)
        url = reverse("journal:entry-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class JournalEntryDetailTest(BaseJournalAPITest):
    """Test cases for the journal detail endpoint."""

    def test_retrieve_entry(self):
        """Test retrieving a single entry."""
        entry = JournalEntryFactory(user=self.user, title="Read me")
        url = reverse("journal:entry-detail", kwargs={"pk": entry.id})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["title"], "Read me")

    def test_update_entry(self):
        """Test updating an entry."""
        entry = JournalEntryFactory(user=self.user)
        url = reverse("journal:entry-detail", kwargs={"pk": entry.id})
        response = self.client.patch(
            url, {"title": "Updated", "mood": "okay"}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["title"], "Updated")
        self.assertEqual(response.data["mood"], "okay")

    def test_delete_entry(self):
        """Test deleting an entry."""
        entry = JournalEntryFactory(user=self.user)
        url = reverse("journal:entry-detail", kwargs={"pk": entry.id})
        response = self.client.delete(url)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(JournalEntry.objects.filter(id=entry.id).exists())

    def test_cannot_access_other_users_entry(self):
        """Test a user cannot access another user's entry."""
        entry = JournalEntryFactory(user=self.other_user)
        url = reverse("journal:entry-detail", kwargs={"pk": entry.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

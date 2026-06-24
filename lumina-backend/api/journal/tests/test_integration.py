"""Integration tests for the journal API."""

from datetime import date

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .factories import UserFactory


class JournalWorkflowTest(APITestCase):
    """End-to-end journal workflow tests."""

    def setUp(self):
        self.user = UserFactory()
        self.client.force_authenticate(user=self.user)

    def test_full_journal_lifecycle(self):
        """Test create -> list -> retrieve -> update -> filter -> delete."""
        list_url = reverse("journal:entry-list")

        # Create
        create_response = self.client.post(
            list_url,
            {
                "title": "First entry",
                "content": "Hello world",
                "mood": "good",
                "date": str(date(2024, 5, 1)),
            },
            format="json",
        )
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        entry_id = create_response.data["id"]

        # List
        list_response = self.client.get(list_url)
        self.assertEqual(list_response.data["pagination"]["count"], 1)

        # Retrieve
        detail_url = reverse("journal:entry-detail", kwargs={"pk": entry_id})
        retrieve_response = self.client.get(detail_url)
        self.assertEqual(retrieve_response.data["title"], "First entry")

        # Update
        update_response = self.client.patch(
            detail_url, {"mood": "great"}, format="json"
        )
        self.assertEqual(update_response.data["mood"], "great")

        # Filter by date
        filter_response = self.client.get(list_url, {"date": "2024-05-01"})
        self.assertEqual(len(filter_response.data["results"]), 1)

        # Delete
        delete_response = self.client.delete(detail_url)
        self.assertEqual(delete_response.status_code, status.HTTP_204_NO_CONTENT)

        # Confirm gone
        final_list = self.client.get(list_url)
        self.assertEqual(final_list.data["pagination"]["count"], 0)

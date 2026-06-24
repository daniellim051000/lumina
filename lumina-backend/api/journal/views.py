"""API views for the journal.

Provides CRUD endpoints for journal entries with user isolation, filtering,
pagination, and OpenAPI documentation, mirroring the task management views.
"""

from django.db.models import Q
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from api.pagination import StandardResultsSetPagination

from .models import JournalEntry
from .serializers import JournalEntryListSerializer, JournalEntrySerializer


@extend_schema(
    summary="List and create journal entries",
    description="Get the authenticated user's journal entries with optional "
    "filtering, or create a new entry.",
    parameters=[
        OpenApiParameter(
            name="date",
            description="Filter by an exact date (YYYY-MM-DD)",
            required=False,
        ),
        OpenApiParameter(
            name="date_from",
            description="Filter entries on or after this date (YYYY-MM-DD)",
            required=False,
        ),
        OpenApiParameter(
            name="date_to",
            description="Filter entries on or before this date (YYYY-MM-DD)",
            required=False,
        ),
        OpenApiParameter(
            name="mood",
            description="Filter by mood",
            enum=["great", "good", "okay", "bad", "awful", ""],
            required=False,
        ),
        OpenApiParameter(
            name="search",
            description="Search in title and content",
            required=False,
        ),
    ],
)
class JournalEntryListCreateView(generics.ListCreateAPIView):
    """List and create journal entries with filtering."""

    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def get_serializer_class(self):
        if self.request.method == "POST":
            return JournalEntrySerializer
        return JournalEntryListSerializer

    def get_queryset(self):
        queryset = JournalEntry.objects.select_related("user").filter(
            user=self.request.user
        )

        params = self.request.query_params
        date = params.get("date")
        date_from = params.get("date_from")
        date_to = params.get("date_to")
        mood = params.get("mood")
        search = params.get("search")

        if date:
            queryset = queryset.filter(date=date)
        if date_from:
            queryset = queryset.filter(date__gte=date_from)
        if date_to:
            queryset = queryset.filter(date__lte=date_to)
        if mood:
            queryset = queryset.filter(mood=mood)
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | Q(content__icontains=search)
            )

        return queryset


class JournalEntryDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a journal entry."""

    serializer_class = JournalEntrySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return JournalEntry.objects.select_related("user").filter(
            user=self.request.user
        )

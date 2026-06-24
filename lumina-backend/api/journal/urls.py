"""URL patterns for the journal API."""

from django.urls import path

from . import views

app_name = "journal"

urlpatterns = [
    path(
        "journal/",
        views.JournalEntryListCreateView.as_view(),
        name="entry-list",
    ),
    path(
        "journal/<int:pk>/",
        views.JournalEntryDetailView.as_view(),
        name="entry-detail",
    ),
]

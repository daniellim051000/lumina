"""API serializers for the journal."""

from django.utils.html import strip_tags
from rest_framework import serializers

from api.task.serializers import UserSimpleSerializer

from .models import JournalEntry


class JournalEntrySerializer(serializers.ModelSerializer):
    """Journal entry serializer with full details and validation."""

    user = UserSimpleSerializer(read_only=True)

    class Meta:
        model = JournalEntry
        fields = [
            "id",
            "title",
            "content",
            "mood",
            "date",
            "user",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]

    def validate_title(self, value):
        """Validate and sanitize the entry title."""
        if not value or len(value.strip()) < 1:
            raise serializers.ValidationError("Journal entry title cannot be empty.")

        cleaned = strip_tags(value).strip()
        if len(cleaned) > 255:
            raise serializers.ValidationError(
                "Journal entry title is too long (maximum 255 characters)."
            )

        return cleaned

    def validate_content(self, value):
        """Validate and sanitize the entry content."""
        if value:
            cleaned = strip_tags(value).strip()
            if len(cleaned) > 50000:
                raise serializers.ValidationError(
                    "Journal entry content is too long (maximum 50000 characters)."
                )
            return cleaned
        return value

    def validate_mood(self, value):
        """Validate mood against the allowed choices."""
        valid_moods = [choice[0] for choice in JournalEntry.MOOD_CHOICES]
        if value and value not in valid_moods:
            raise serializers.ValidationError(
                f"Invalid mood. Must be one of: {valid_moods}"
            )
        return value

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)


class JournalEntryListSerializer(serializers.ModelSerializer):
    """Lightweight journal entry serializer for list views."""

    content_preview = serializers.SerializerMethodField()

    CONTENT_PREVIEW_LENGTH = 150

    class Meta:
        model = JournalEntry
        fields = [
            "id",
            "title",
            "mood",
            "date",
            "content_preview",
            "created_at",
            "updated_at",
        ]

    def get_content_preview(self, obj):
        if not obj.content:
            return ""
        if len(obj.content) > self.CONTENT_PREVIEW_LENGTH:
            return obj.content[: self.CONTENT_PREVIEW_LENGTH] + "..."
        return obj.content

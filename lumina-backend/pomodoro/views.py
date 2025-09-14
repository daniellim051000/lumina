"""API views for Pomodoro timer functionality."""

import logging
from datetime import datetime, timedelta

from django.db.models import Avg, Sum
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import PomodoroPreset, PomodoroSession, PomodoroSettings
from .serializers import (
    PomodoroPresetSerializer,
    PomodoroSessionCreateSerializer,
    PomodoroSessionSerializer,
    PomodoroSessionStatsSerializer,
    PomodoroSettingsSerializer,
)

# Constants
TIME_SYNC_THRESHOLD_SECONDS = 30


class PomodoroSettingsViewSet(viewsets.ModelViewSet):
    """ViewSet for managing user's Pomodoro settings."""

    serializer_class = PomodoroSettingsSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Return settings for the current user only."""
        return PomodoroSettings.objects.filter(user=self.request.user)

    def get_object(self):
        """Get or create settings for the current user."""
        # Check if pk is provided and valid
        pk = self.kwargs.get("pk")
        if pk:
            # If pk provided, ensure it belongs to current user
            try:
                return PomodoroSettings.objects.get(pk=pk, user=self.request.user)
            except PomodoroSettings.DoesNotExist:
                # If settings don't exist or don't belong to user, raise 404
                from django.http import Http404

                raise Http404("Settings not found")

        # If no pk provided, get or create settings for current user
        settings, created = PomodoroSettings.objects.get_or_create(
            user=self.request.user
        )
        return settings

    def list(self, request):
        """Return the user's settings (single object as list for consistency)."""
        settings = self.get_object()
        serializer = self.get_serializer(settings)
        return Response([serializer.data])

    def create(self, request):
        """Update settings instead of creating (settings are auto-created)."""
        return self.update(request)

    def update(self, request, pk=None, partial=False):
        """Update user's Pomodoro settings."""
        # Always use the current user's settings, ignore pk parameter
        settings = self.get_object()
        serializer = self.get_serializer(settings, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def partial_update(self, request, pk=None):
        """Handle PATCH requests without requiring pk in URL for singleton settings."""
        # Always use the current user's settings, ignore pk parameter
        # This enables PATCH /pomodoro/settings/ to work
        settings = self.get_object()
        serializer = self.get_serializer(settings, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def destroy(self, request, pk=None):
        """Reset settings to defaults instead of deleting."""
        settings = self.get_object()

        # Reset to default values
        settings.work_duration = 25
        settings.short_break_duration = 5
        settings.long_break_duration = 15
        settings.sessions_until_long_break = 4
        settings.auto_start_breaks = False
        settings.auto_start_work = False
        settings.enable_audio = True
        settings.work_sound = "bell"
        settings.break_sound = "chime"
        settings.volume = 0.7
        settings.enable_notifications = True
        settings.save()

        serializer = self.get_serializer(settings)
        return Response(serializer.data)


class PomodoroPresetViewSet(viewsets.ModelViewSet):
    """ViewSet for managing Pomodoro presets."""

    serializer_class = PomodoroPresetSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Return presets for the current user only."""
        return PomodoroPreset.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        """Create preset for the current user."""
        serializer.save(user=self.request.user)

    @action(detail=True, methods=["post"])
    def set_default(self, request, pk=None):
        """Set this preset as the default for the user."""
        preset = self.get_object()

        # Unset other defaults
        PomodoroPreset.objects.filter(user=request.user, is_default=True).update(
            is_default=False
        )

        # Set this one as default
        preset.is_default = True
        preset.save()

        serializer = self.get_serializer(preset)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def apply_to_settings(self, request, pk=None):
        """Apply this preset to the user's current settings."""
        preset = self.get_object()
        settings, created = PomodoroSettings.objects.get_or_create(user=request.user)

        # Apply preset values to settings
        settings.work_duration = preset.work_duration
        settings.short_break_duration = preset.short_break_duration
        settings.long_break_duration = preset.long_break_duration
        settings.sessions_until_long_break = preset.sessions_until_long_break
        settings.save()

        settings_serializer = PomodoroSettingsSerializer(settings)
        return Response(settings_serializer.data)


class PomodoroSessionViewSet(viewsets.ModelViewSet):
    """ViewSet for managing Pomodoro sessions."""

    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Return sessions for the current user only."""
        queryset = PomodoroSession.objects.filter(user=self.request.user)

        # Filter by session type if specified
        session_type = self.request.query_params.get("type")
        if session_type:
            queryset = queryset.filter(session_type=session_type)

        # Filter by status if specified
        status_filter = self.request.query_params.get("status")
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        # Filter by date range
        start_date = self.request.query_params.get("start_date")
        end_date = self.request.query_params.get("end_date")

        if start_date:
            try:
                start_date = datetime.strptime(start_date, "%Y-%m-%d").date()
                queryset = queryset.filter(started_at__date__gte=start_date)
            except ValueError:
                pass

        if end_date:
            try:
                end_date = datetime.strptime(end_date, "%Y-%m-%d").date()
                queryset = queryset.filter(started_at__date__lte=end_date)
            except ValueError:
                pass

        return queryset.select_related("task")

    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        # Always return the regular serializer since create() handles its own serialization
        return PomodoroSessionSerializer

    def create(self, request, *_args, **_kwargs):
        """Create a new session and return full session data."""
        # Use the create serializer for validation
        create_serializer = PomodoroSessionCreateSerializer(
            data=request.data, context={"request": request}
        )
        create_serializer.is_valid(raise_exception=True)

        # Create the session
        session = create_serializer.save(user=request.user)

        # Return full session data using the regular serializer
        response_serializer = self.get_serializer(session)
        headers = self.get_success_headers(response_serializer.data)
        return Response(
            response_serializer.data, status=status.HTTP_201_CREATED, headers=headers
        )

    def perform_create(self, serializer):
        """Create session for the current user."""
        serializer.save(user=self.request.user)

    @action(detail=True, methods=["post"])
    def pause(self, request, pk=None):
        """Pause an active session."""
        session = self.get_object()

        if session.status != "active":
            return Response(
                {"error": "Can only pause active sessions"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        session.status = "paused"
        session.paused_at = timezone.now()
        session.save()

        serializer = self.get_serializer(session)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def resume(self, request, pk=None):
        """Resume a paused session."""
        session = self.get_object()

        if session.status != "paused":
            return Response(
                {"error": "Can only resume paused sessions"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Calculate and accumulate paused time
        if session.paused_at:
            paused_duration = (timezone.now() - session.paused_at).total_seconds()
            session.total_paused_seconds += int(paused_duration)

        session.status = "active"
        session.paused_at = None
        session.save()

        serializer = self.get_serializer(session)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def complete(self, request, pk=None):
        """Mark session as completed."""
        session = self.get_object()

        if session.status in ["completed", "skipped", "cancelled"]:
            return Response(
                {"error": f"Session is already {session.status}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # If currently paused, add final pause duration to total
        if session.status == "paused" and session.paused_at:
            final_pause_duration = (timezone.now() - session.paused_at).total_seconds()
            session.total_paused_seconds += int(final_pause_duration)

        session.status = "completed"
        session.completed_at = timezone.now()

        # Calculate actual duration
        if session.started_at:
            duration_seconds = (
                session.completed_at - session.started_at
            ).total_seconds()

            # Subtract total paused time
            duration_seconds -= session.total_paused_seconds

            session.actual_duration = max(1, int(duration_seconds / 60))

        session.save()

        serializer = self.get_serializer(session)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def skip(self, request, pk=None):
        """Skip/end session early."""
        session = self.get_object()

        if session.status in ["completed", "skipped", "cancelled"]:
            return Response(
                {"error": f"Session is already {session.status}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        session.status = "skipped"
        session.completed_at = timezone.now()
        session.save()

        serializer = self.get_serializer(session)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def active(self, request):
        """Get the current active session for the user with server-side time validation."""
        active_session = (
            self.get_queryset().filter(status__in=["active", "paused"]).first()
        )

        if not active_session:
            return Response(None, status=status.HTTP_200_OK)

        # Server-side validation: auto-complete sessions that have exceeded planned duration
        if active_session.status == "active" and active_session.remaining_minutes <= 0:
            # Auto-complete the session
            active_session.status = "completed"
            active_session.completed_at = timezone.now()

            # Calculate actual duration
            if active_session.started_at:
                duration_seconds = (
                    active_session.completed_at - active_session.started_at
                ).total_seconds()
                duration_seconds -= active_session.total_paused_seconds
                active_session.actual_duration = max(1, int(duration_seconds / 60))

            active_session.save()

            # Return None since session is now completed
            return Response(None, status=status.HTTP_200_OK)

        serializer = self.get_serializer(active_session)
        return Response(serializer.data)

    @action(detail=False, methods=["post"])
    def sync(self, request):
        """Sync timer state with server for validation."""
        client_remaining = request.data.get("remaining_seconds", 0)
        session_id = request.data.get("session_id")

        if not session_id:
            return Response(
                {"error": "session_id is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            session = self.get_queryset().get(
                id=session_id, status__in=["active", "paused"]
            )
        except PomodoroSession.DoesNotExist:
            return Response(
                {"error": "Active session not found"}, status=status.HTTP_404_NOT_FOUND
            )

        server_remaining = session.remaining_minutes * 60

        # Allow small discrepancies (up to 30 seconds)
        time_diff = abs(server_remaining - client_remaining)

        response_data = {
            "server_remaining_seconds": server_remaining,
            "client_remaining_seconds": client_remaining,
            "time_difference": time_diff,
            "sync_required": time_diff > TIME_SYNC_THRESHOLD_SECONDS,
            "session_status": session.status,
        }

        # If time difference is significant, log it for debugging
        if time_diff > TIME_SYNC_THRESHOLD_SECONDS:
            logger = logging.getLogger(__name__)
            logger.warning(
                f"Timer sync discrepancy detected: User {session.user.id}, "
                f"Session {session_id}, Diff: {time_diff}s"
            )

        return Response(response_data)

    @action(detail=False, methods=["get"])
    def stats(self, request):
        """Get comprehensive Pomodoro session statistics."""
        queryset = self.get_queryset()

        # Date range filtering for stats
        days = int(request.query_params.get("days", 30))
        start_date = timezone.now().date() - timedelta(days=days)
        queryset = queryset.filter(started_at__date__gte=start_date)

        # Basic counts
        total_sessions = queryset.count()
        completed_sessions = queryset.filter(status="completed").count()
        work_sessions = queryset.filter(session_type="work").count()
        break_sessions = queryset.filter(
            session_type__in=["short_break", "long_break"]
        ).count()

        # Focus time calculation (only completed work sessions)
        focus_time = (
            queryset.filter(
                session_type="work", status="completed", actual_duration__isnull=False
            ).aggregate(total=Sum("actual_duration"))["total"]
            or 0
        )

        # Average session duration
        avg_duration = (
            queryset.filter(
                status="completed", actual_duration__isnull=False
            ).aggregate(avg=Avg("actual_duration"))["avg"]
            or 0
        )

        # Completion rate
        completion_rate = (
            (completed_sessions / total_sessions * 100) if total_sessions > 0 else 0
        )

        # Daily average
        daily_avg = total_sessions / max(days, 1)

        # Streak calculation (consecutive days with completed sessions)
        current_streak = self._calculate_current_streak(request.user)
        longest_streak = self._calculate_longest_streak(request.user)

        # Sessions by day
        sessions_by_day = {}
        focus_time_by_day = {}

        for i in range(days):
            date = (timezone.now().date() - timedelta(days=i)).isoformat()
            day_sessions = queryset.filter(
                started_at__date=timezone.now().date() - timedelta(days=i)
            )
            sessions_by_day[date] = day_sessions.count()

            day_focus = (
                day_sessions.filter(
                    session_type="work",
                    status="completed",
                    actual_duration__isnull=False,
                ).aggregate(total=Sum("actual_duration"))["total"]
                or 0
            )
            focus_time_by_day[date] = day_focus

        # Productivity ratings
        productivity_stats = queryset.filter(
            session_type="work", status="completed", productivity_rating__isnull=False
        ).aggregate(avg=Avg("productivity_rating"))

        avg_productivity = productivity_stats["avg"]

        # Productivity distribution
        productivity_distribution = {}
        for rating in range(1, 6):
            count = queryset.filter(
                session_type="work", productivity_rating=rating
            ).count()
            productivity_distribution[str(rating)] = count

        stats_data = {
            "total_sessions": total_sessions,
            "completed_sessions": completed_sessions,
            "work_sessions": work_sessions,
            "break_sessions": break_sessions,
            "total_focus_time": focus_time,
            "average_session_duration": round(avg_duration, 1),
            "completion_rate": round(completion_rate, 1),
            "daily_average": round(daily_avg, 1),
            "current_streak": current_streak,
            "longest_streak": longest_streak,
            "sessions_by_day": sessions_by_day,
            "focus_time_by_day": focus_time_by_day,
            "average_productivity": round(avg_productivity, 1)
            if avg_productivity
            else None,
            "productivity_distribution": productivity_distribution,
        }

        serializer = PomodoroSessionStatsSerializer(stats_data)
        return Response(serializer.data)

    def _calculate_current_streak(self, user):
        """Calculate current consecutive days with completed sessions."""
        streak = 0
        current_date = timezone.now().date()

        while True:
            has_completed_session = PomodoroSession.objects.filter(
                user=user, started_at__date=current_date, status="completed"
            ).exists()

            if has_completed_session:
                streak += 1
                current_date -= timedelta(days=1)
            else:
                break

        return streak

    def _calculate_longest_streak(self, user):
        """Calculate the longest consecutive days streak ever."""
        # This is a simplified implementation
        # For better performance, you might want to cache this value
        sessions = (
            PomodoroSession.objects.filter(user=user, status="completed")
            .values("started_at__date")
            .distinct()
            .order_by("started_at__date")
        )

        if not sessions:
            return 0

        longest_streak = 0
        current_streak = 1

        dates = [session["started_at__date"] for session in sessions]

        for i in range(1, len(dates)):
            if (dates[i] - dates[i - 1]).days == 1:
                current_streak += 1
            else:
                longest_streak = max(longest_streak, current_streak)
                current_streak = 1

        return max(longest_streak, current_streak)

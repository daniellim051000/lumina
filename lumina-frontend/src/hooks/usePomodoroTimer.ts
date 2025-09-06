/**
 * Custom hook for managing Pomodoro timer functionality
 * Handles timer state, session management, and API interactions
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiService } from '../services/api';
import {
  PomodoroSettings,
  TimerState,
  PomodoroSessionType,
  PomodoroSessionCreate,
} from '../types/pomodoro';
import { useAudio } from './useAudio';
import { useNotifications } from './useNotifications';

interface UsePomodoroTimerReturn {
  // Timer state
  timerState: TimerState;
  settings: PomodoroSettings | null;

  // Timer controls
  startTimer: (
    sessionType?: PomodoroSessionType,
    taskId?: number
  ) => Promise<void>;
  pauseTimer: () => Promise<void>;
  resumeTimer: () => Promise<void>;
  skipTimer: () => Promise<void>;
  stopTimer: () => Promise<void>;
  completeTimer: () => Promise<void>;

  // Settings management
  loadSettings: () => Promise<void>;
  updateSettings: (newSettings: Partial<PomodoroSettings>) => Promise<void>;

  // Session management
  loadActiveSession: () => Promise<void>;

  // Loading states
  isLoading: boolean;
  error: string | null;

  // Utility functions
  formatTime: (seconds: number) => string;
  getNextSessionType: () => PomodoroSessionType;
  canStartTimer: boolean;
}

export const usePomodoroTimer = (): UsePomodoroTimerReturn => {
  // Initialize audio and notification hooks
  const { playSound } = useAudio();
  const { showTimerNotification, showBreakReminder, showWorkReminder } =
    useNotifications();

  // State
  const [timerState, setTimerState] = useState<TimerState>({
    isRunning: false,
    isPaused: false,
    currentSession: null,
    timeRemaining: 0,
    sessionType: 'work',
    sessionNumber: 1,
    totalSessions: 0,
  });

  const [settings, setSettings] = useState<PomodoroSettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs for timer management
  const timerIntervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const pausedTimeRef = useRef<number>(0);

  // Load user's Pomodoro settings
  const loadSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      const userSettings = await apiService.getPomodoroSettings();
      setSettings(userSettings);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
      console.error('Error loading Pomodoro settings:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update user's Pomodoro settings
  const updateSettings = useCallback(
    async (newSettings: Partial<PomodoroSettings>) => {
      try {
        setIsLoading(true);
        const updatedSettings =
          await apiService.updatePomodoroSettings(newSettings);
        setSettings(updatedSettings);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to update settings'
        );
        console.error('Error updating Pomodoro settings:', err);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Load active session from the server
  const loadActiveSession = useCallback(async () => {
    try {
      const activeSession = await apiService.getActivePomodoroSession();

      if (activeSession) {
        const remainingSeconds = activeSession.remaining_minutes * 60;
        const isRunning = activeSession.status === 'active';
        const isPaused = activeSession.status === 'paused';

        setTimerState(prev => ({
          ...prev,
          currentSession: activeSession,
          timeRemaining: remainingSeconds,
          sessionType: activeSession.session_type,
          sessionNumber: activeSession.session_number,
          isRunning,
          isPaused,
        }));

        // If the session is active, start the local timer
        if (isRunning) {
          startLocalTimer(remainingSeconds);
        }
      }
    } catch (err) {
      console.error('Error loading active session:', err);
    }
  }, [startLocalTimer]);

  // Use refs to access latest values without causing dependency cycles
  const timerStateRef = useRef(timerState);
  const completeTimerRef = useRef<() => Promise<void>>();

  // Update refs when values change
  useEffect(() => {
    timerStateRef.current = timerState;
  }, [timerState]);

  // Start local timer countdown
  const startLocalTimer = useCallback(
    (initialSeconds: number) => {
      if (timerIntervalRef.current) {
        window.clearInterval(timerIntervalRef.current);
      }

      startTimeRef.current = Date.now();
      pausedTimeRef.current = 0;

      timerIntervalRef.current = window.setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor(
          (now - (startTimeRef.current || 0) - pausedTimeRef.current) / 1000
        );
        const remaining = Math.max(0, initialSeconds - elapsed);

        setTimerState(prev => ({
          ...prev,
          timeRemaining: remaining,
        }));

        // Show break reminder during work sessions when 5 minutes left
        if (
          remaining === 5 * 60 &&
          timerStateRef.current.sessionType === 'work'
        ) {
          showBreakReminder(remaining);
        }

        // Auto-complete when timer reaches 0
        if (remaining === 0 && completeTimerRef.current) {
          completeTimerRef.current();
        }
      }, 1000);
    },
    [showBreakReminder]
  );

  // Stop local timer
  const stopLocalTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      window.clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    startTimeRef.current = null;
    pausedTimeRef.current = 0;
  }, []);

  // Pause local timer
  const pauseLocalTimer = useCallback(() => {
    if (timerIntervalRef.current && startTimeRef.current) {
      const now = Date.now();
      pausedTimeRef.current += now - startTimeRef.current;
      window.clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  // Resume local timer
  const resumeLocalTimer = useCallback(() => {
    if (!timerIntervalRef.current && startTimeRef.current) {
      const currentTimeRemaining = timerStateRef.current.timeRemaining;
      startTimeRef.current = Date.now();

      timerIntervalRef.current = window.setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor(
          (now - (startTimeRef.current || 0) - pausedTimeRef.current) / 1000
        );
        const remaining = Math.max(0, currentTimeRemaining - elapsed);

        setTimerState(prev => ({
          ...prev,
          timeRemaining: remaining,
        }));

        // Show break reminder during work sessions when 5 minutes left
        if (
          remaining === 5 * 60 &&
          timerStateRef.current.sessionType === 'work'
        ) {
          showBreakReminder(remaining);
        }

        if (remaining === 0 && completeTimerRef.current) {
          completeTimerRef.current();
        }
      }, 1000);
    }
  }, [showBreakReminder]);

  // Get session duration based on type
  const getSessionDuration = useCallback(
    (sessionType: PomodoroSessionType): number => {
      if (!settings) return 25; // Default fallback

      switch (sessionType) {
        case 'work':
          return settings.work_duration;
        case 'short_break':
          return settings.short_break_duration;
        case 'long_break':
          return settings.long_break_duration;
        default:
          return 25;
      }
    },
    [settings]
  );

  // Determine next session type based on current state
  const getNextSessionType = useCallback((): PomodoroSessionType => {
    const { sessionType, sessionNumber } = timerState;
    const sessionsUntilLongBreak = settings?.sessions_until_long_break || 4;

    if (sessionType === 'work') {
      // After work, check if it's time for a long break
      return sessionNumber >= sessionsUntilLongBreak
        ? 'long_break'
        : 'short_break';
    } else {
      // After any break, go back to work
      return 'work';
    }
  }, [timerState, settings]);

  // Start a new timer session
  const startTimer = useCallback(
    async (sessionType?: PomodoroSessionType, taskId?: number) => {
      try {
        setIsLoading(true);
        setError(null);

        const actualSessionType = sessionType || getNextSessionType();
        const duration = getSessionDuration(actualSessionType);

        // Determine session number
        let newSessionNumber = 1;
        if (actualSessionType === 'work') {
          if (timerState.sessionType === 'long_break') {
            newSessionNumber = 1; // Reset after long break
          } else {
            newSessionNumber = timerState.sessionNumber + 1;
          }
        } else {
          newSessionNumber = timerState.sessionNumber; // Keep same for breaks
        }

        const sessionData: PomodoroSessionCreate = {
          session_type: actualSessionType,
          planned_duration: duration,
          session_number: newSessionNumber,
          task: taskId,
        };

        const newSession = await apiService.createPomodoroSession(sessionData);

        const timeInSeconds = duration * 60;

        setTimerState(prev => ({
          ...prev,
          currentSession: newSession,
          isRunning: true,
          isPaused: false,
          timeRemaining: timeInSeconds,
          sessionType: actualSessionType,
          sessionNumber: newSessionNumber,
          totalSessions: prev.totalSessions + 1,
        }));

        startLocalTimer(timeInSeconds);

        // Play start sound and show notification
        playSound('timer-start');
        showTimerNotification(actualSessionType, false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to start timer');
        console.error('Error starting timer:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [
      getNextSessionType,
      getSessionDuration,
      timerState,
      startLocalTimer,
      playSound,
      showTimerNotification,
    ]
  );

  // Pause the current timer
  const pauseTimer = useCallback(async () => {
    if (
      !timerState.currentSession ||
      !timerState.currentSession.id ||
      !timerState.isRunning
    )
      return;

    try {
      setIsLoading(true);
      await apiService.pausePomodoroSession(timerState.currentSession.id);

      pauseLocalTimer();

      setTimerState(prev => ({
        ...prev,
        isRunning: false,
        isPaused: true,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to pause timer');
      console.error('Error pausing timer:', err);
    } finally {
      setIsLoading(false);
    }
  }, [timerState, pauseLocalTimer]);

  // Resume the current timer
  const resumeTimer = useCallback(async () => {
    if (
      !timerState.currentSession ||
      !timerState.currentSession.id ||
      timerState.isRunning
    )
      return;

    try {
      setIsLoading(true);
      await apiService.resumePomodoroSession(timerState.currentSession.id);

      resumeLocalTimer();

      setTimerState(prev => ({
        ...prev,
        isRunning: true,
        isPaused: false,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resume timer');
      console.error('Error resuming timer:', err);
    } finally {
      setIsLoading(false);
    }
  }, [timerState, resumeLocalTimer]);

  // Skip the current timer
  const skipTimer = useCallback(async () => {
    if (!timerState.currentSession || !timerState.currentSession.id) return;

    try {
      setIsLoading(true);
      await apiService.skipPomodoroSession(timerState.currentSession.id);

      stopLocalTimer();

      setTimerState(prev => ({
        ...prev,
        currentSession: null,
        isRunning: false,
        isPaused: false,
        timeRemaining: 0,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to skip timer');
      console.error('Error skipping timer:', err);
    } finally {
      setIsLoading(false);
    }
  }, [timerState, stopLocalTimer]);

  // Stop the current timer (cancel)
  const stopTimer = useCallback(async () => {
    if (!timerState.currentSession || !timerState.currentSession.id) return;

    try {
      setIsLoading(true);
      // For now, we'll skip the session. In the future, we might add a 'cancel' status
      await apiService.skipPomodoroSession(timerState.currentSession.id);

      stopLocalTimer();

      setTimerState(prev => ({
        ...prev,
        currentSession: null,
        isRunning: false,
        isPaused: false,
        timeRemaining: 0,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop timer');
      console.error('Error stopping timer:', err);
    } finally {
      setIsLoading(false);
    }
  }, [timerState, stopLocalTimer]);

  // Complete the current timer
  const completeTimer = useCallback(async () => {
    if (
      !timerStateRef.current.currentSession ||
      !timerStateRef.current.currentSession.id
    )
      return;

    try {
      setIsLoading(true);
      await apiService.completePomodoroSession(
        timerStateRef.current.currentSession.id
      );

      stopLocalTimer();

      setTimerState(prev => ({
        ...prev,
        currentSession: null,
        isRunning: false,
        isPaused: false,
        timeRemaining: 0,
      }));

      // Play completion sound and show notification
      const completedSessionType = timerStateRef.current.sessionType;
      const soundId =
        completedSessionType === 'work' ? 'work-complete' : 'break-complete';

      playSound(soundId);
      showTimerNotification(completedSessionType, true);

      // Show next session reminder
      const nextSessionType = getNextSessionType();
      const nextSessionNumber =
        nextSessionType === 'work'
          ? completedSessionType === 'long_break'
            ? 1
            : timerStateRef.current.sessionNumber + 1
          : timerStateRef.current.sessionNumber;

      if (nextSessionType === 'work') {
        setTimeout(() => {
          showWorkReminder(nextSessionNumber);
        }, 3000); // Show work reminder 3 seconds after completion
      } else {
        setTimeout(() => {
          showBreakReminder(getSessionDuration(nextSessionType) * 60);
        }, 3000); // Show break reminder 3 seconds after completion
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete timer');
      console.error('Error completing timer:', err);
    } finally {
      setIsLoading(false);
    }
  }, [
    stopLocalTimer,
    playSound,
    showTimerNotification,
    getNextSessionType,
    showWorkReminder,
    showBreakReminder,
    getSessionDuration,
  ]);

  // Update completeTimer ref when function changes
  useEffect(() => {
    completeTimerRef.current = completeTimer;
  }, [completeTimer]);

  // Format time in MM:SS format
  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Check if timer can be started
  const canStartTimer = !timerState.isRunning && !isLoading;

  // Initialize hook
  useEffect(() => {
    loadSettings();
    loadActiveSession();

    // Cleanup on unmount
    return () => {
      stopLocalTimer();
    };
  }, [loadSettings, loadActiveSession, stopLocalTimer]);

  // Handle page visibility changes to maintain accuracy
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && timerState.isRunning) {
        // Reload active session to sync with server
        loadActiveSession();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () =>
      document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [timerState.isRunning, loadActiveSession]);

  return {
    // State
    timerState,
    settings,

    // Controls
    startTimer,
    pauseTimer,
    resumeTimer,
    skipTimer,
    stopTimer,
    completeTimer,

    // Settings
    loadSettings,
    updateSettings,

    // Session management
    loadActiveSession,

    // Loading states
    isLoading,
    error,

    // Utilities
    formatTime,
    getNextSessionType,
    canStartTimer,
  };
};

/**
 * Refactored Pomodoro Timer Hook
 * Main coordinating hook that combines smaller focused hooks
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  PomodoroSettings,
  TimerState,
  PomodoroSessionType,
} from '../../types/pomodoro';
import { useTimerCore } from './useTimerCore';
import { useTimerSession } from './useTimerSession';
import { useTimerSettings } from './useTimerSettings';
import { useTimerEffects } from './useTimerEffects';

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
  updateTimerDisplay: (sessionType: PomodoroSessionType) => void;
  canStartTimer: boolean;
}

export const usePomodoroTimer = (): UsePomodoroTimerReturn => {
  // Sub-hook states
  const timerSettings = useTimerSettings();
  const timerSession = useTimerSession({
    sessionsUntilLongBreak: timerSettings.settings?.sessions_until_long_break,
  });
  const timerEffects = useTimerEffects({
    settings: timerSettings.settings,
  });

  // Local timer state
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [sessionType, setSessionType] = useState<PomodoroSessionType>('work');

  // Core timer with proper cleanup
  const timerCore = useTimerCore({
    onTick: remaining => {
      setTimeRemaining(remaining);

      // Show break reminder during work sessions when 5 minutes left
      if (
        remaining === 5 * 60 &&
        sessionType === 'work' &&
        timerSettings.settings?.enable_notifications
      ) {
        timerEffects.showBreakReminder(remaining);
      }
    },
    onComplete: () => {
      handleTimerComplete();
    },
  });

  // Initialize display on settings load
  useEffect(() => {
    if (timerSettings.settings && !timerCore.isRunning && !timerCore.isPaused) {
      const duration = timerSettings.getSessionDuration(sessionType) * 60;
      setTimeRemaining(duration);
    }
  }, [
    timerSettings.settings,
    sessionType,
    timerCore.isRunning,
    timerCore.isPaused,
    timerSettings,
  ]);

  // Timer state object
  const timerState: TimerState = useMemo(
    () => ({
      isRunning: timerCore.isRunning,
      isPaused: timerCore.isPaused,
      currentSession: timerSession.currentSession,
      timeRemaining,
      sessionType,
      sessionNumber: timerSession.sessionNumber,
      totalSessions: timerSession.totalSessions,
    }),
    [
      timerCore.isRunning,
      timerCore.isPaused,
      timerSession.currentSession,
      timeRemaining,
      sessionType,
      timerSession.sessionNumber,
      timerSession.totalSessions,
    ]
  );

  const handleTimerComplete = useCallback(async () => {
    if (!timerSession.currentSession) return;

    try {
      // Play completion sound and show notification
      timerEffects.playSessionSound(sessionType);
      timerEffects.showSessionNotification(sessionType);

      // Complete the session
      await timerSession.completeSession(timerSession.currentSession.id);

      // Auto-transition to next session if enabled
      const nextSessionType = timerSession.getNextSessionType();
      timerSession.updateSessionType(nextSessionType);
      setSessionType(nextSessionType);

      const shouldAutoStart =
        (nextSessionType === 'work' &&
          timerSettings.settings?.auto_start_work) ||
        (nextSessionType !== 'work' &&
          timerSettings.settings?.auto_start_breaks);

      if (shouldAutoStart) {
        await startNextSession(nextSessionType);
      } else {
        // Just update the display for manual start
        const duration = timerSettings.getSessionDuration(nextSessionType) * 60;
        setTimeRemaining(duration);
      }
    } catch (error) {
      console.error('Error completing timer:', error);
    }
  }, [timerSession, timerEffects, sessionType, timerSettings.settings]);

  const startNextSession = useCallback(
    async (type: PomodoroSessionType, taskId?: number) => {
      const duration = timerSettings.getSessionDuration(type) * 60;

      // Create new session
      await timerSession.createSession(type, taskId);

      // Start timer
      timerCore.startTimer(duration);
      setSessionType(type);

      // Show notification
      timerEffects.showSessionNotification(type);
    },
    [timerSettings, timerSession, timerCore, timerEffects]
  );

  // Main timer controls
  const startTimer = useCallback(
    async (type?: PomodoroSessionType, taskId?: number) => {
      const actualType = type || sessionType;
      await startNextSession(actualType, taskId);
    },
    [startNextSession, sessionType]
  );

  const pauseTimer = useCallback(async () => {
    if (!timerSession.currentSession) return;

    timerCore.pauseTimer();

    try {
      await timerSession.updateSession(timerSession.currentSession.id, {
        paused_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error updating session on pause:', error);
    }
  }, [timerCore, timerSession]);

  const resumeTimer = useCallback(async () => {
    if (!timerSession.currentSession) return;

    timerCore.resumeTimer();

    try {
      await timerSession.updateSession(timerSession.currentSession.id, {
        paused_at: null,
      });
    } catch (error) {
      console.error('Error updating session on resume:', error);
    }
  }, [timerCore, timerSession]);

  const skipTimer = useCallback(async () => {
    if (!timerSession.currentSession) return;

    timerCore.stopTimer();

    try {
      await timerSession.completeSession(timerSession.currentSession.id);
      await handleTimerComplete();
    } catch (error) {
      console.error('Error skipping timer:', error);
    }
  }, [timerCore, timerSession, handleTimerComplete]);

  const stopTimer = useCallback(async () => {
    timerCore.stopTimer();

    if (timerSession.currentSession) {
      try {
        await timerSession.updateSession(timerSession.currentSession.id, {
          ended_at: new Date().toISOString(),
          is_completed: false,
        });
      } catch (error) {
        console.error('Error stopping session:', error);
      }
    }

    // Reset to work session
    setSessionType('work');
    const duration = timerSettings.getSessionDuration('work') * 60;
    setTimeRemaining(duration);
  }, [timerCore, timerSession, timerSettings]);

  const completeTimer = useCallback(async () => {
    await handleTimerComplete();
  }, [handleTimerComplete]);

  const updateTimerDisplay = useCallback(
    (type: PomodoroSessionType) => {
      if (timerCore.isRunning || timerCore.isPaused) return;

      setSessionType(type);
      const duration = timerSettings.getSessionDuration(type) * 60;
      setTimeRemaining(duration);
    },
    [timerCore.isRunning, timerCore.isPaused, timerSettings]
  );

  const formatTime = useCallback((seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

  // Combined loading state
  const isLoading = timerSettings.isLoading || timerSession.isLoading;

  // Combined error state
  const error = timerSettings.error || timerSession.error;

  const canStartTimer = Boolean(
    timerSettings.settings && !timerCore.isRunning && !isLoading
  );

  return {
    timerState,
    settings: timerSettings.settings,
    startTimer,
    pauseTimer,
    resumeTimer,
    skipTimer,
    stopTimer,
    completeTimer,
    loadSettings: timerSettings.loadSettings,
    updateSettings: timerSettings.updateSettings,
    loadActiveSession: timerSession.loadActiveSession,
    isLoading,
    error,
    formatTime,
    getNextSessionType: timerSession.getNextSessionType,
    updateTimerDisplay,
    canStartTimer,
  };
};

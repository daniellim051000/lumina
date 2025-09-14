/**
 * Session management hook for Pomodoro timer
 * Handles session types, transitions, and API interactions
 */

import { useState, useCallback, useRef, useEffect } from 'react';

// Browser API declarations
/* global AbortController */
import { apiService } from '../../services/api';
import {
  PomodoroSessionType,
  PomodoroSessionCreate,
  PomodoroSession,
  PomodoroSessionUpdate,
} from '../../types/pomodoro';

interface UseTimerSessionProps {
  sessionsUntilLongBreak?: number;
}

interface UseTimerSessionReturn {
  currentSession: PomodoroSession | null;
  sessionType: PomodoroSessionType;
  sessionNumber: number;
  totalSessions: number;

  // Session operations
  createSession: (
    sessionType: PomodoroSessionType,
    duration: number,
    sessionNumber: number,
    taskId?: number
  ) => Promise<PomodoroSession>;
  updateSession: (
    sessionId: number,
    updates: PomodoroSessionUpdate
  ) => Promise<void>;
  completeSession: (sessionId: number) => Promise<void>;
  loadActiveSession: () => Promise<void>;

  // Session type logic
  getNextSessionType: () => PomodoroSessionType;
  updateSessionType: (sessionType: PomodoroSessionType) => void;

  // Loading state
  isLoading: boolean;
  error: string | null;
}

export const useTimerSession = ({
  sessionsUntilLongBreak = 4,
}: UseTimerSessionProps = {}): UseTimerSessionReturn => {
  const [currentSession, setCurrentSession] = useState<PomodoroSession | null>(
    null
  );
  const [sessionType, setSessionType] = useState<PomodoroSessionType>('work');
  const [sessionNumber, setSessionNumber] = useState(1);
  const [totalSessions, setTotalSessions] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const createSession = useCallback(
    async (
      type: PomodoroSessionType,
      duration: number, // duration in minutes
      sessionNumber: number,
      taskId?: number
    ): Promise<PomodoroSession> => {
      setIsLoading(true);
      setError(null);

      try {
        const sessionData: PomodoroSessionCreate = {
          session_type: type,
          planned_duration: duration,
          session_number: sessionNumber,
          task: taskId,
        };

        const session = await apiService.createPomodoroSession(sessionData);
        setCurrentSession(session);
        return session;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to create session';
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const updateSession = useCallback(
    async (
      sessionId: number,
      updates: PomodoroSessionUpdate
    ): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        await apiService.updatePomodoroSession(sessionId, updates);

        if (currentSession && currentSession.id === sessionId) {
          setCurrentSession(prev => (prev ? { ...prev, ...updates } : null));
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to update session';
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [currentSession]
  );

  const completeSession = useCallback(
    async (sessionId: number): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        await apiService.completePomodoroSession(sessionId);

        if (currentSession && currentSession.id === sessionId) {
          setCurrentSession(null);
          setTotalSessions(prev => prev + 1);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to complete session';
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [currentSession]
  );

  const loadActiveSession = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const session = await apiService.getActivePomodoroSession();
      setCurrentSession(session);

      if (session) {
        setSessionType(session.session_type);
      }
    } catch {
      // No active session is not an error
      setCurrentSession(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getNextSessionType = useCallback((): PomodoroSessionType => {
    if (sessionType === 'work') {
      // After work, determine break type based on session number
      return sessionNumber % sessionsUntilLongBreak === 0
        ? 'long_break'
        : 'short_break';
    } else {
      // After any break, go back to work
      return 'work';
    }
  }, [sessionType, sessionNumber, sessionsUntilLongBreak]);

  const updateSessionType = useCallback(
    (newType: PomodoroSessionType) => {
      setSessionType(newType);

      // Update session number when starting a new work session
      if (newType === 'work' && sessionType !== 'work') {
        setSessionNumber(prev => prev + 1);
      }
    },
    [sessionType]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    currentSession,
    sessionType,
    sessionNumber,
    totalSessions,
    createSession,
    updateSession,
    completeSession,
    loadActiveSession,
    getNextSessionType,
    updateSessionType,
    isLoading,
    error,
  };
};

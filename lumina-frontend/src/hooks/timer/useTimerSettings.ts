/**
 * Settings management hook for Pomodoro timer
 * Handles loading, updating, and caching of user settings
 */

import React, { useState, useCallback, useRef } from 'react';

// Browser API declarations
/* global AbortController */
import { apiService } from '../../services/api';
import { PomodoroSettings, PomodoroSessionType } from '../../types/pomodoro';

interface UseTimerSettingsReturn {
  settings: PomodoroSettings | null;
  loadSettings: (forceRefresh?: boolean) => Promise<void>;
  updateSettings: (newSettings: Partial<PomodoroSettings>) => Promise<void>;
  getSessionDuration: (sessionType: PomodoroSessionType) => number;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

// Cache settings to avoid excessive API calls
let settingsCache: PomodoroSettings | null = null;
let cacheTimestamp: number | null = null;
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

export const useTimerSettings = (): UseTimerSettingsReturn => {
  const [settings, setSettings] = useState<PomodoroSettings | null>(
    settingsCache
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const loadSettings = useCallback(async (forceRefresh = false): Promise<void> => {
    // Use cached settings if they're still fresh (unless force refresh is requested)
    if (
      !forceRefresh &&
      settingsCache &&
      cacheTimestamp &&
      Date.now() - cacheTimestamp < CACHE_DURATION_MS
    ) {
      setSettings(settingsCache);
      return;
    }

    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setIsLoading(true);
    setError(null);

    try {
      const userSettings = await apiService.getPomodoroSettings();

      // Update cache
      settingsCache = userSettings;
      cacheTimestamp = Date.now();

      setSettings(userSettings);
    } catch (err) {
      // Don't set error if request was aborted
      if (err instanceof Error && err.name !== 'AbortError') {
        const errorMessage = 'Failed to load timer settings';
        setError(errorMessage);
        console.error('Error loading Pomodoro settings:', err);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, []);

  const updateSettings = useCallback(
    async (newSettings: Partial<PomodoroSettings>): Promise<void> => {
      if (!settings) {
        throw new Error('Settings not loaded');
      }

      // Cancel any pending request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      setIsLoading(true);
      setError(null);

      // Optimistic update
      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);

      try {
        const savedSettings = await apiService.updatePomodoroSettings(
          newSettings
        );

        // Update cache
        settingsCache = savedSettings;
        cacheTimestamp = Date.now();

        setSettings(savedSettings);
      } catch (err) {
        // Rollback optimistic update on error
        setSettings(settings);

        if (err instanceof Error && err.name !== 'AbortError') {
          const errorMessage = 'Failed to save timer settings';
          setError(errorMessage);
          console.error('Error updating Pomodoro settings:', err);
          throw new Error(errorMessage);
        }
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [settings]
  );

  const getSessionDuration = useCallback(
    (sessionType: PomodoroSessionType): number => {
      if (!settings) {
        // Default fallbacks
        switch (sessionType) {
          case 'work':
            return 25;
          case 'short_break':
            return 5;
          case 'long_break':
            return 15;
          default:
            return 25;
        }
      }

      switch (sessionType) {
        case 'work':
          return settings.work_duration;
        case 'short_break':
          return settings.short_break_duration;
        case 'long_break':
          return settings.long_break_duration;
        default:
          return settings.work_duration;
      }
    },
    [settings]
  );

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    settings,
    loadSettings,
    updateSettings,
    getSessionDuration,
    isLoading,
    error,
    clearError,
  };
};

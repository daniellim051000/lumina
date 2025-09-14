/**
 * Core timer management hook
 * Handles low-level timer operations with RequestAnimationFrame for smooth updates
 */

import { useRef, useCallback, useEffect } from 'react';

// Browser API declarations
/* global requestAnimationFrame, cancelAnimationFrame */

interface UseTimerCoreProps {
  onTick: (timeRemaining: number) => void;
  onComplete: () => void;
  intervalMs?: number;
}

interface UseTimerCoreReturn {
  startTimer: (durationSeconds: number) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: () => void;
  isRunning: boolean;
  isPaused: boolean;
  timeRemaining: number;
}

export const useTimerCore = ({
  onTick,
  onComplete,
  intervalMs = 1000,
}: UseTimerCoreProps): UseTimerCoreReturn => {
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const pausedTimeRef = useRef<number>(0);
  const durationRef = useRef<number>(0);
  const isRunningRef = useRef<boolean>(false);
  const isPausedRef = useRef<boolean>(false);
  const lastTickTimeRef = useRef<number>(0);
  const timeRemainingRef = useRef<number>(0);

  const updateTimer = useCallback(() => {
    if (!isRunningRef.current || !startTimeRef.current) {
      return;
    }

    const now = Date.now();
    const elapsed = Math.floor(
      (now - startTimeRef.current - pausedTimeRef.current) / 1000
    );
    const remaining = Math.max(0, durationRef.current - elapsed);

    timeRemainingRef.current = remaining;

    // Only call onTick at the specified interval to avoid excessive updates
    if (now - lastTickTimeRef.current >= intervalMs) {
      onTick(remaining);
      lastTickTimeRef.current = now;
    }

    if (remaining === 0) {
      isRunningRef.current = false;
      isPausedRef.current = false;
      onComplete();
      return;
    }

    animationFrameRef.current = requestAnimationFrame(updateTimer);
  }, [onTick, onComplete, intervalMs]);

  const startTimer = useCallback(
    (durationSeconds: number) => {
      if (isRunningRef.current) {
        return;
      }

      durationRef.current = durationSeconds;
      startTimeRef.current = Date.now();
      pausedTimeRef.current = 0;
      isRunningRef.current = true;
      isPausedRef.current = false;
      lastTickTimeRef.current = 0;
      timeRemainingRef.current = durationSeconds;

      onTick(durationSeconds);
      animationFrameRef.current = requestAnimationFrame(updateTimer);
    },
    [updateTimer, onTick]
  );

  const pauseTimer = useCallback(() => {
    if (!isRunningRef.current || isPausedRef.current || !startTimeRef.current) {
      return;
    }

    const now = Date.now();
    pausedTimeRef.current += now - startTimeRef.current;
    isPausedRef.current = true;

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  const resumeTimer = useCallback(() => {
    if (!isRunningRef.current || !isPausedRef.current) {
      return;
    }

    startTimeRef.current = Date.now();
    isPausedRef.current = false;
    lastTickTimeRef.current = 0;

    animationFrameRef.current = requestAnimationFrame(updateTimer);
  }, [updateTimer]);

  const stopTimer = useCallback(() => {
    isRunningRef.current = false;
    isPausedRef.current = false;
    startTimeRef.current = null;
    pausedTimeRef.current = 0;
    durationRef.current = 0;
    timeRemainingRef.current = 0;

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return {
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    isRunning: isRunningRef.current,
    isPaused: isPausedRef.current,
    timeRemaining: timeRemainingRef.current,
  };
};

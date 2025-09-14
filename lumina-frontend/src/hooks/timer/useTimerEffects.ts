/**
 * Effects hook for Pomodoro timer
 * Handles sound, notifications, and user feedback
 */

import { useCallback } from 'react';
import { PomodoroSessionType, PomodoroSettings } from '../../types/pomodoro';
import { useAudio } from '../useAudio';
import { useNotifications } from '../useNotifications';

interface UseTimerEffectsProps {
  settings: PomodoroSettings | null;
}

interface UseTimerEffectsReturn {
  playSessionSound: (sessionType: PomodoroSessionType) => void;
  showSessionNotification: (
    sessionType: PomodoroSessionType,
    timeRemaining?: number
  ) => void;
  showBreakReminder: (timeRemaining: number) => void;
  showWorkReminder: (timeRemaining: number) => void;
}

export const useTimerEffects = ({
  settings,
}: UseTimerEffectsProps): UseTimerEffectsReturn => {
  const { playSound } = useAudio();
  const { showNotification, showBreakReminder, showWorkReminder } =
    useNotifications();

  const playSessionSound = useCallback(
    (sessionType: PomodoroSessionType) => {
      if (!settings?.enable_audio) return;

      try {
        let soundType: string;

        switch (sessionType) {
          case 'work':
            soundType = settings.work_sound || 'bell';
            break;
          case 'short_break':
          case 'long_break':
            soundType = settings.break_sound || 'chime';
            break;
          default:
            soundType = 'bell';
        }

        playSound(soundType, {
          volume: settings.volume || 0.7,
          loop: false,
        });
      } catch (error) {
        console.warn('Failed to play timer sound:', error);
      }
    },
    [settings, playSound]
  );

  const showSessionNotification = useCallback(
    (sessionType: PomodoroSessionType, timeRemaining?: number) => {
      if (!settings?.enable_notifications) return;

      try {
        const sessionLabels = {
          work: 'Work Session',
          short_break: 'Short Break',
          long_break: 'Long Break',
        };

        const title = sessionLabels[sessionType] || 'Timer';
        let body = '';

        if (timeRemaining !== undefined) {
          const minutes = Math.floor(timeRemaining / 60);
          const seconds = timeRemaining % 60;
          body = `${minutes}:${seconds.toString().padStart(2, '0')} remaining`;
        } else {
          body =
            sessionType === 'work' ? 'Time to focus!' : 'Time for a break!';
        }

        showNotification({
          title,
          body,
          icon: '/sounds/icon-timer.png',
          tag: 'pomodoro-session',
        });
      } catch (error) {
        console.warn('Failed to show timer notification:', error);
      }
    },
    [settings, showNotification]
  );

  const handleBreakReminder = useCallback(
    (timeRemaining: number) => {
      if (!settings?.enable_notifications) return;

      try {
        showBreakReminder(timeRemaining);
      } catch (error) {
        console.warn('Failed to show break reminder:', error);
      }
    },
    [settings, showBreakReminder]
  );

  const handleWorkReminder = useCallback(
    (timeRemaining: number) => {
      if (!settings?.enable_notifications) return;

      try {
        showWorkReminder(timeRemaining);
      } catch (error) {
        console.warn('Failed to show work reminder:', error);
      }
    },
    [settings, showWorkReminder]
  );

  return {
    playSessionSound,
    showSessionNotification,
    showBreakReminder: handleBreakReminder,
    showWorkReminder: handleWorkReminder,
  };
};

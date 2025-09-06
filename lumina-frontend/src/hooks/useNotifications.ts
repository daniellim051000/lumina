/**
 * Custom hook for managing system notifications
 * Handles both web Notification API and Electron notifications
 */

import { useCallback, useState, useEffect } from 'react';

export interface NotificationOptions {
  title: string;
  body?: string;
  icon?: string;
  tag?: string; // For replacing notifications
  timeout?: number; // Auto-dismiss timeout in milliseconds
  requireInteraction?: boolean; // Persistent until user action
  silent?: boolean; // No sound
}

export const useNotifications = () => {
  const [permission, setPermission] =
    useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);

  // Check if notifications are supported
  useEffect(() => {
    setIsSupported('Notification' in window);
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  // Request notification permission
  const requestPermission =
    useCallback(async (): Promise<NotificationPermission> => {
      if (!isSupported) return 'denied';

      try {
        const result = await Notification.requestPermission();
        setPermission(result);
        return result;
      } catch (error) {
        console.error('Error requesting notification permission:', error);
        return 'denied';
      }
    }, [isSupported]);

  // Show a system notification
  const showNotification = useCallback(
    async (options: NotificationOptions): Promise<Notification | null> => {
      // Check permission
      if (permission !== 'granted') {
        const newPermission = await requestPermission();
        if (newPermission !== 'granted') {
          console.warn('Notification permission denied');
          return null;
        }
      }

      try {
        const notification = new Notification(options.title, {
          body: options.body,
          icon: options.icon || '/icon.png', // Default app icon
          tag: options.tag,
          requireInteraction: options.requireInteraction || false,
          silent: options.silent || false,
        });

        // Auto-dismiss if timeout is specified
        if (options.timeout && options.timeout > 0) {
          setTimeout(() => {
            notification.close();
          }, options.timeout);
        }

        // Log notification events
        notification.onclick = () => {
          console.log('Notification clicked');
          // Focus the app window if running in Electron
          if (window.electron?.ipcRenderer) {
            window.electron.ipcRenderer.send('focus-window');
          } else {
            // Focus browser window
            window.focus();
          }
          notification.close();
        };

        notification.onclose = () => {
          console.log('Notification closed');
        };

        notification.onerror = error => {
          console.error('Notification error:', error);
        };

        return notification;
      } catch (error) {
        console.error('Error showing notification:', error);
        return null;
      }
    },
    [permission, requestPermission]
  );

  // Show Pomodoro-specific notifications
  const showTimerNotification = useCallback(
    (
      sessionType: 'work' | 'short_break' | 'long_break',
      isComplete: boolean = true
    ) => {
      const sessionNames = {
        work: 'Focus Session',
        short_break: 'Short Break',
        long_break: 'Long Break',
      };

      const sessionName = sessionNames[sessionType];

      if (isComplete) {
        return showNotification({
          title: `${sessionName} Complete!`,
          body: `Your ${sessionName.toLowerCase()} has finished. Ready for the next session?`,
          icon: '/sounds/icon-timer.png', // Timer-specific icon
          tag: 'pomodoro-complete',
          requireInteraction: true,
          timeout: 10000, // 10 seconds
        });
      } else {
        return showNotification({
          title: `${sessionName} Started`,
          body: `Your ${sessionName.toLowerCase()} has begun. Stay focused!`,
          icon: '/sounds/icon-timer.png',
          tag: 'pomodoro-start',
          timeout: 5000, // 5 seconds
        });
      }
    },
    [showNotification]
  );

  // Show break reminder
  const showBreakReminder = useCallback(
    (timeRemaining: number) => {
      const minutes = Math.ceil(timeRemaining / 60);

      return showNotification({
        title: 'Break Reminder',
        body: `Take a break! You've been working for a while. ${minutes} minute${minutes !== 1 ? 's' : ''} remaining.`,
        icon: '/sounds/icon-break.png',
        tag: 'break-reminder',
        timeout: 8000, // 8 seconds
      });
    },
    [showNotification]
  );

  // Show work reminder
  const showWorkReminder = useCallback(
    (sessionNumber: number) => {
      return showNotification({
        title: 'Back to Work!',
        body: `Break time is over. Ready to start session ${sessionNumber}?`,
        icon: '/sounds/icon-work.png',
        tag: 'work-reminder',
        requireInteraction: true,
        timeout: 15000, // 15 seconds
      });
    },
    [showNotification]
  );

  // Clear all notifications with a specific tag
  const clearNotifications = useCallback((tag?: string) => {
    // Note: There's no standard way to programmatically clear notifications
    // This is more of a placeholder for potential future functionality
    console.log(`Clearing notifications${tag ? ` with tag: ${tag}` : ''}`);
  }, []);

  return {
    // State
    permission,
    isSupported,

    // Core functions
    requestPermission,
    showNotification,
    clearNotifications,

    // Pomodoro-specific helpers
    showTimerNotification,
    showBreakReminder,
    showWorkReminder,
  };
};

export default useNotifications;

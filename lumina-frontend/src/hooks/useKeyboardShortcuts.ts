import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  action: () => void;
  description: string;
}

export const useKeyboardShortcuts = (
  shortcuts: KeyboardShortcut[],
  isActive: boolean = true
) => {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!isActive) return;

      // Don't trigger shortcuts when typing in input fields
      const target = event.target as Element;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true' ||
        target.isContentEditable
      ) {
        // Allow Escape key to work in modals even when in input fields
        if (event.key !== 'Escape') return;
      }

      const matchingShortcut = shortcuts.find(shortcut => {
        const keyMatches =
          shortcut.key.toLowerCase() === event.key.toLowerCase();
        const ctrlMatches = !!shortcut.ctrlKey === event.ctrlKey;
        const metaMatches = !!shortcut.metaKey === event.metaKey;
        const shiftMatches = !!shortcut.shiftKey === event.shiftKey;
        const altMatches = !!shortcut.altKey === event.altKey;

        return (
          keyMatches && ctrlMatches && metaMatches && shiftMatches && altMatches
        );
      });

      if (matchingShortcut) {
        event.preventDefault();
        event.stopPropagation();
        matchingShortcut.action();
      }
    },
    [shortcuts, isActive]
  );

  useEffect(() => {
    if (isActive) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [handleKeyDown, isActive]);
};

// Common task management shortcuts
export const createTaskManagementShortcuts = (actions: {
  createTask: () => void;
  searchFocus: () => void;
  toggleFilters: () => void;
  selectToday: () => void;
  selectWeek: () => void;
  selectOverdue: () => void;
  selectCompleted: () => void;
  refresh: () => void;
}): KeyboardShortcut[] => [
  {
    key: 'n',
    ctrlKey: true,
    action: actions.createTask,
    description: 'Create new task',
  },
  {
    key: 'f',
    ctrlKey: true,
    action: actions.searchFocus,
    description: 'Focus search',
  },
  {
    key: 'f',
    shiftKey: true,
    ctrlKey: true,
    action: actions.toggleFilters,
    description: 'Toggle filters',
  },
  {
    key: '1',
    ctrlKey: true,
    action: actions.selectToday,
    description: "View today's tasks",
  },
  {
    key: '2',
    ctrlKey: true,
    action: actions.selectWeek,
    description: "View this week's tasks",
  },
  {
    key: '3',
    ctrlKey: true,
    action: actions.selectOverdue,
    description: 'View overdue tasks',
  },
  {
    key: '4',
    ctrlKey: true,
    action: actions.selectCompleted,
    description: 'View completed tasks',
  },
  {
    key: 'r',
    ctrlKey: true,
    action: actions.refresh,
    description: 'Refresh tasks',
  },
];

// Modal shortcuts
export const createModalShortcuts = (actions: {
  save: () => void;
  cancel: () => void;
}): KeyboardShortcut[] => [
  {
    key: 'Enter',
    ctrlKey: true,
    action: actions.save,
    description: 'Save (Ctrl+Enter)',
  },
  {
    key: 'Enter',
    metaKey: true,
    action: actions.save,
    description: 'Save (Cmd+Enter)',
  },
  {
    key: 'Escape',
    action: actions.cancel,
    description: 'Cancel/Close (Escape)',
  },
];

// Hook for displaying keyboard shortcuts help
export const useKeyboardShortcutsHelp = () => {
  return {
    showHelp: (shortcuts: KeyboardShortcut[]) => {
      const formatShortcut = (shortcut: KeyboardShortcut) => {
        const keys = [];
        if (shortcut.ctrlKey || shortcut.metaKey) {
          keys.push(
            typeof window !== 'undefined' &&
              typeof window.navigator !== 'undefined' &&
              window.navigator.platform?.includes('Mac')
              ? 'Cmd'
              : 'Ctrl'
          );
        }
        if (shortcut.shiftKey) keys.push('Shift');
        if (shortcut.altKey) keys.push('Alt');
        keys.push(shortcut.key.toUpperCase());
        return keys.join('+');
      };

      const helpText = shortcuts
        .map(shortcut => `${formatShortcut(shortcut)}: ${shortcut.description}`)
        .join('\n');

      if (typeof window !== 'undefined') {
        window.alert(`Keyboard Shortcuts:\n\n${helpText}`);
      }
    },
  };
};

import React from 'react';
import clsx from 'clsx';
import { useSidebar } from './SidebarContext';

export const CollapseButton: React.FC = () => {
  const { isCollapsed, toggleSidebar } = useSidebar();

  return (
    <button
      onClick={toggleSidebar}
      className={clsx(
        'flex items-center justify-center w-7 h-7 rounded-md transition-all duration-200',
        'text-gray-400 hover:text-gray-600 hover:bg-gray-100',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
      )}
      title={isCollapsed ? 'Expand sidebar (⌘B)' : 'Collapse sidebar (⌘B)'}
    >
      <svg
        className={clsx(
          'w-4 h-4 transition-transform duration-200',
          isCollapsed ? 'rotate-180' : 'rotate-0'
        )}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 19l-7-7 7-7"
        />
      </svg>
    </button>
  );
};

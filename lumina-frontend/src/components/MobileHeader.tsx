import React from 'react';
import { useSidebar } from './Sidebar';

export const MobileHeader: React.FC = () => {
  const { toggleMobileSidebar } = useSidebar();

  return (
    <header className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between mt-8 electron-no-drag">
      <div className="text-xl font-bold text-gray-900">
        ✨ Lumina
      </div>
      
      <button
        onClick={toggleMobileSidebar}
        className="mobile-menu-button p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 electron-no-drag"
        aria-label="Open menu"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>
    </header>
  );
};
import React, { useEffect } from 'react';
import clsx from 'clsx';
import { SidebarNav } from './SidebarNav';
import { useSidebar } from './SidebarContext';

export const Sidebar: React.FC = () => {
  const { isCollapsed, isMobileOpen, closeMobileSidebar } = useSidebar();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (isMobileOpen && !target.closest('.sidebar') && !target.closest('.mobile-menu-button')) {
        closeMobileSidebar();
      }
    };

    if (isMobileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isMobileOpen, closeMobileSidebar]);

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 lg:hidden"
          onClick={closeMobileSidebar}
        />
      )}

      {/* Sidebar */}
      <div
        className={clsx(
          'sidebar fixed left-0 top-0 h-full bg-white border-r border-gray-200 z-30',
          'transition-all duration-300 ease-in-out',
          'flex flex-col',
          // Desktop behavior
          'hidden lg:flex',
          isCollapsed ? 'lg:w-16' : 'lg:w-60',
          // Mobile behavior
          isMobileOpen ? 'flex w-60' : 'hidden',
        )}
      >
        {/* Logo/Brand Section */}
        <div
          className={clsx(
            'flex items-center px-3 py-4 border-b border-gray-200',
            isCollapsed && !isMobileOpen ? 'justify-center' : 'justify-start'
          )}
        >
          <div className="text-xl font-bold text-gray-900">
            {isCollapsed && !isMobileOpen ? '✨' : '✨ Lumina'}
          </div>
        </div>

        {/* Navigation */}
        <SidebarNav />
      </div>
    </>
  );
};
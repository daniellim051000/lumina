import React, { useEffect } from 'react';
import clsx from 'clsx';
import { SidebarNav } from './SidebarNav';
import { CollapseButton } from './CollapseButton';
import { useSidebar } from './SidebarContext';

export const Sidebar: React.FC = () => {
  const { isCollapsed, isMobileOpen, closeMobileSidebar } = useSidebar();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (
        isMobileOpen &&
        !target.closest('.sidebar') &&
        !target.closest('.mobile-menu-button')
      ) {
        closeMobileSidebar();
      }
    };

    if (isMobileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
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
          'sidebar fixed left-0 top-0 h-full bg-gray-50 border-r border-gray-200 z-30',
          'transition-all duration-300 ease-in-out',
          'flex flex-col pt-8',
          // Desktop behavior
          'hidden lg:flex',
          isCollapsed ? 'lg:w-16' : 'lg:w-60',
          // Mobile behavior
          isMobileOpen ? 'flex w-60' : 'hidden'
        )}
      >
        {/* Logo/Brand Section with Collapse Button */}
        <div
          className={clsx(
            'flex items-center px-3 py-3 border-b border-gray-100 electron-no-drag',
            'min-h-[52px]',
            isCollapsed && !isMobileOpen ? 'justify-center' : 'justify-between'
          )}
        >
          <div className="text-xl font-bold text-gray-900">
            {isCollapsed && !isMobileOpen ? '✨' : '✨ Lumina'}
          </div>
          {isCollapsed && !isMobileOpen ? (
            <div className="absolute right-1 top-11 electron-no-drag">
              <CollapseButton />
            </div>
          ) : (
            <div className="electron-no-drag">
              <CollapseButton />
            </div>
          )}
        </div>

        {/* Navigation */}
        <SidebarNav />
      </div>
    </>
  );
};

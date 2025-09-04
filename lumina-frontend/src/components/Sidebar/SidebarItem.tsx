import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import clsx from 'clsx';
import { useSidebar } from './SidebarContext';

interface SidebarItemProps {
  name: string;
  href: string;
  icon: string;
}

export const SidebarItem: React.FC<SidebarItemProps> = ({
  name,
  href,
  icon,
}) => {
  const location = useLocation();
  const { isCollapsed, isMobileOpen, closeMobileSidebar } = useSidebar();
  const isActive = location.pathname === href;

  const handleClick = () => {
    if (isMobileOpen) {
      closeMobileSidebar();
    }
  };

  return (
    <Link
      to={href}
      onClick={handleClick}
      className={clsx(
        'group relative flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200',
        'hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        isActive
          ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-500'
          : 'text-gray-700 hover:text-gray-900',
        isCollapsed && !isMobileOpen ? 'justify-center' : 'justify-start'
      )}
      title={isCollapsed && !isMobileOpen ? name : undefined}
    >
      <span
        className={clsx(
          'text-lg flex-shrink-0',
          isActive ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'
        )}
      >
        {icon}
      </span>

      {(!isCollapsed || isMobileOpen) && (
        <span className="ml-3 truncate transition-opacity duration-200">
          {name}
        </span>
      )}

      {isCollapsed && !isMobileOpen && (
        <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap">
          {name}
        </div>
      )}
    </Link>
  );
};

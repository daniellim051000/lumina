import React from 'react';
import { SidebarItem } from './SidebarItem';
import { CollapseButton } from './CollapseButton';
import { useSidebar } from './SidebarContext';

const navigationItems = [
  { name: 'Dashboard', href: '/', icon: '🏠' },
  { name: 'Tasks', href: '/tasks', icon: '✅' },
  { name: 'Journal', href: '/journal', icon: '📖' },
  { name: 'Focus Timer', href: '/timer', icon: '⏰' },
  { name: 'Calendar', href: '/calendar', icon: '📅' },
  { name: 'Settings', href: '/settings', icon: '⚙️' },
];

export const SidebarNav: React.FC = () => {
  const { isCollapsed } = useSidebar();

  return (
    <nav className="flex-1 px-3 py-4 space-y-1">
      {navigationItems.map(item => (
        <SidebarItem
          key={item.name}
          name={item.name}
          href={item.href}
          icon={item.icon}
        />
      ))}
      
      <div className="pt-4 mt-4 border-t border-gray-200">
        <div className="flex items-center">
          <CollapseButton />
        </div>
      </div>
    </nav>
  );
};
import React from 'react';
import { SidebarItem } from './SidebarItem';

const navigationItems = [
  { name: 'Dashboard', href: '/', icon: '🏠' },
  { name: 'Tasks', href: '/tasks', icon: '✅' },
  { name: 'Journal', href: '/journal', icon: '📖' },
  { name: 'Focus Timer', href: '/timer', icon: '⏰' },
  { name: 'Calendar', href: '/calendar', icon: '📅' },
  { name: 'Settings', href: '/settings', icon: '⚙️' },
];

export const SidebarNav: React.FC = () => {
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
    </nav>
  );
};

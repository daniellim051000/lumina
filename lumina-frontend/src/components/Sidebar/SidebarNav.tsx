import React from 'react';
import { LogOut, User } from 'lucide-react';
import { SidebarItem } from './SidebarItem';
import { useSidebar } from './SidebarContext';
import { useAuth } from '../../contexts/AuthContext';

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
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Navigation items */}
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

      {/* User section */}
      <div className="px-3 py-4 border-t border-gray-200">
        {user && (
          <>
            {/* User info */}
            <div className="flex items-center mb-3">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                <User size={16} className="text-blue-600" />
              </div>
              {!isCollapsed && (
                <div className="ml-3 truncate">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.first_name ? `${user.first_name} ${user.last_name}`.trim() : user.username}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
              )}
            </div>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className={`w-full flex items-center px-2 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors ${
                isCollapsed ? 'justify-center' : ''
              }`}
              title="Logout"
            >
              <LogOut size={16} />
              {!isCollapsed && <span className="ml-3">Logout</span>}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

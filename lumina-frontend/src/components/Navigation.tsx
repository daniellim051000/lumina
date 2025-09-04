import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import clsx from 'clsx';

const navigationItems = [
  { name: 'Dashboard', href: '/', icon: '🏠' },
  { name: 'Tasks', href: '/tasks', icon: '✅' },
  { name: 'Journal', href: '/journal', icon: '📖' },
  { name: 'Focus Timer', href: '/timer', icon: '⏰' },
  { name: 'Calendar', href: '/calendar', icon: '📅' },
  { name: 'Settings', href: '/settings', icon: '⚙️' },
];

export const Navigation: React.FC = () => {
  const location = useLocation();

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="text-xl font-bold text-gray-900 mr-8">
              ✨ Lumina
            </div>

            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                {navigationItems.map(item => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={clsx(
                        'px-3 py-2 rounded-md text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      )}
                    >
                      <span className="mr-2">{item.icon}</span>
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="md:hidden">
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-200">
          {navigationItems.map(item => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={clsx(
                  'block px-3 py-2 rounded-md text-base font-medium transition-colors',
                  isActive
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                )}
              >
                <span className="mr-2">{item.icon}</span>
                {item.name}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

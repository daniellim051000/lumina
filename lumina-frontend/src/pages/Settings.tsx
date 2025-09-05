import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ProfileForm } from '../components/settings/ProfileForm';
import { PasswordForm } from '../components/settings/PasswordForm';

type TabType = 'profile' | 'security';

const tabs = [
  { id: 'profile', name: 'Account Profile', icon: '👤' },
  { id: 'security', name: 'Security', icon: '🔒' },
] as const;

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Please sign in to access settings.</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">
          Manage your account and security preferences
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {activeTab === 'profile' && (
          <div>
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Profile Information
              </h2>
              <p className="text-gray-600 text-sm">
                Update your personal information and account details.
              </p>
            </div>
            <ProfileForm />
          </div>
        )}

        {activeTab === 'security' && (
          <div>
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Security Settings
              </h2>
              <p className="text-gray-600 text-sm">
                Manage your password and security preferences.
              </p>
            </div>
            <PasswordForm />
          </div>
        )}
      </div>
    </div>
  );
};

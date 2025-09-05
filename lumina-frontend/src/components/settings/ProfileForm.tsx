import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

export const ProfileForm: React.FC = () => {
  const { user, updateProfile, isLoading, error, clearError } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
  });
  const [success, setSuccess] = useState(false);

  // Initialize form data when user data is available
  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email || '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
      });
    }
  }, [user]);

  // Clear messages after a delay
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => clearError(), 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(false);
    clearError();

    try {
      await updateProfile(formData);
      setSuccess(true);
    } catch {
      // Error handling is done in AuthContext
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Success Message */}
      {success && (
        <div className="rounded-md bg-green-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">
                ✅ Profile updated successfully!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">❌ {error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Username (Read-only) */}
      <div>
        <label
          htmlFor="username"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Username
        </label>
        <input
          type="text"
          id="username"
          value={user?.username || ''}
          disabled
          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
        />
        <p className="mt-1 text-xs text-gray-500">Username cannot be changed</p>
      </div>

      {/* Email */}
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Email <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="your.email@example.com"
        />
      </div>

      {/* First Name */}
      <div>
        <label
          htmlFor="first_name"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          First Name
        </label>
        <input
          type="text"
          id="first_name"
          name="first_name"
          value={formData.first_name}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Your first name"
        />
      </div>

      {/* Last Name */}
      <div>
        <label
          htmlFor="last_name"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Last Name
        </label>
        <input
          type="text"
          id="last_name"
          name="last_name"
          value={formData.last_name}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Your last name"
        />
      </div>

      {/* Account Info */}
      <div className="bg-gray-50 rounded-md p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">
          Account Information
        </h3>
        <div className="text-xs text-gray-500 space-y-1">
          <p>
            <strong>User ID:</strong> {user?.id}
          </p>
          <p>
            <strong>Date Joined:</strong>{' '}
            {user?.date_joined
              ? new Date(user.date_joined).toLocaleDateString()
              : 'N/A'}
          </p>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Updating...' : 'Update Profile'}
        </button>
      </div>
    </form>
  );
};

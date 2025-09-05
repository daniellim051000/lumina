import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

export const PasswordForm: React.FC = () => {
  const { changePassword, isLoading, error, clearError } = useAuth();
  const [formData, setFormData] = useState({
    current_password: '',
    new_password: '',
    new_password_confirm: '',
  });
  const [success, setSuccess] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

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

    // Client-side validation
    if (formData.new_password !== formData.new_password_confirm) {
      // This will be handled by backend validation, but we can add client-side too
      return;
    }

    if (formData.new_password.length < 8) {
      // This will be handled by backend validation
      return;
    }

    try {
      await changePassword(formData);
      setSuccess(true);
      // Clear form on success
      setFormData({
        current_password: '',
        new_password: '',
        new_password_confirm: '',
      });
    } catch (error) {
      // Error handling is done in AuthContext
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const passwordStrength = (password: string) => {
    if (password.length < 8) return 'weak';
    if (password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)) return 'strong';
    if (password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)) return 'medium';
    return 'weak';
  };

  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'strong': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-red-500';
    }
  };

  const getStrengthWidth = (strength: string) => {
    switch (strength) {
      case 'strong': return 'w-full';
      case 'medium': return 'w-2/3';
      default: return 'w-1/3';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Success Message */}
      {success && (
        <div className="rounded-md bg-green-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">
                ✅ Password changed successfully!
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
              <p className="text-sm font-medium text-red-800">
                ❌ {error}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Current Password */}
      <div>
        <label htmlFor="current_password" className="block text-sm font-medium text-gray-700 mb-1">
          Current Password <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            type={showPasswords.current ? 'text' : 'password'}
            id="current_password"
            name="current_password"
            value={formData.current_password}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your current password"
          />
          <button
            type="button"
            onClick={() => togglePasswordVisibility('current')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          >
            {showPasswords.current ? '🙈' : '👁️'}
          </button>
        </div>
      </div>

      {/* New Password */}
      <div>
        <label htmlFor="new_password" className="block text-sm font-medium text-gray-700 mb-1">
          New Password <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            type={showPasswords.new ? 'text' : 'password'}
            id="new_password"
            name="new_password"
            value={formData.new_password}
            onChange={handleChange}
            required
            minLength={8}
            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your new password"
          />
          <button
            type="button"
            onClick={() => togglePasswordVisibility('new')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          >
            {showPasswords.new ? '🙈' : '👁️'}
          </button>
        </div>
        
        {/* Password Strength Indicator */}
        {formData.new_password && (
          <div className="mt-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-600">Password strength:</span>
              <span className={`text-xs font-medium ${
                passwordStrength(formData.new_password) === 'strong' ? 'text-green-600' :
                passwordStrength(formData.new_password) === 'medium' ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {passwordStrength(formData.new_password).toUpperCase()}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1">
              <div 
                className={`h-1 rounded-full transition-all duration-300 ${getStrengthColor(passwordStrength(formData.new_password))} ${getStrengthWidth(passwordStrength(formData.new_password))}`}
              ></div>
            </div>
          </div>
        )}
        
        <p className="mt-1 text-xs text-gray-500">
          Password must be at least 8 characters long and contain uppercase, lowercase, numbers, and special characters for best security.
        </p>
      </div>

      {/* Confirm New Password */}
      <div>
        <label htmlFor="new_password_confirm" className="block text-sm font-medium text-gray-700 mb-1">
          Confirm New Password <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            type={showPasswords.confirm ? 'text' : 'password'}
            id="new_password_confirm"
            name="new_password_confirm"
            value={formData.new_password_confirm}
            onChange={handleChange}
            required
            minLength={8}
            className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent ${
              formData.new_password_confirm && formData.new_password !== formData.new_password_confirm
                ? 'border-red-300 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
            }`}
            placeholder="Confirm your new password"
          />
          <button
            type="button"
            onClick={() => togglePasswordVisibility('confirm')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          >
            {showPasswords.confirm ? '🙈' : '👁️'}
          </button>
        </div>
        
        {/* Password Match Indicator */}
        {formData.new_password_confirm && (
          <p className={`mt-1 text-xs ${
            formData.new_password === formData.new_password_confirm ? 'text-green-600' : 'text-red-600'
          }`}>
            {formData.new_password === formData.new_password_confirm ? '✅ Passwords match' : '❌ Passwords do not match'}
          </p>
        )}
      </div>

      {/* Security Tips */}
      <div className="bg-blue-50 rounded-md p-4">
        <h3 className="text-sm font-medium text-blue-800 mb-2">🔒 Password Security Tips</h3>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• Use at least 8 characters with a mix of letters, numbers, and symbols</li>
          <li>• Avoid using personal information or common words</li>
          <li>• Consider using a password manager</li>
          <li>• Don't reuse passwords across different services</li>
        </ul>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isLoading || formData.new_password !== formData.new_password_confirm || formData.new_password.length < 8}
          className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Changing Password...' : 'Change Password'}
        </button>
      </div>
    </form>
  );
};
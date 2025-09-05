import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { SignInRequest } from '../../services/api';

interface SignInProps {
  onSwitchToSignUp: () => void;
  onSuccess?: () => void;
}

export const SignIn: React.FC<SignInProps> = ({ onSwitchToSignUp, onSuccess }) => {
  const { signIn, isLoading, error, clearError } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<SignInRequest>({
    username: '',
    password: '',
  });

  // TODO: Username preservation feature - currently not working properly
  // Issue: React state shows correct data but UI doesn't reflect it
  // Future enhancement: Investigate controlled component synchronization issue
  // GitHub Issue: https://github.com/your-org/lumina/issues/XX (to be created)
  
  /*
  // Refs to directly control input values
  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  // Debug: Log every time formData changes
  
  // Store the username when form is submitted to preserve it on error
  const [submittedUsername, setSubmittedUsername] = useState('');
  
  // Handle error-specific form clearing after error state is updated
  useEffect(() => {
    if (error && submittedUsername) {
      const errorMessage = error.toLowerCase();
      const isPasswordError = errorMessage.includes('password') || 
                             errorMessage.includes('incorrect') || 
                             errorMessage.includes('invalid');
      
      if (isPasswordError) {
        // Update state
        setFormData({
          username: submittedUsername,
          password: ''
        });
        
        // Also directly set input values using refs to ensure UI updates
        if (usernameRef.current) {
          usernameRef.current.value = submittedUsername;
        }
        if (passwordRef.current) {
          passwordRef.current.value = '';
        }
      }
    }
  }, [error, submittedUsername]);
  */

  const [formErrors, setFormErrors] = useState<Partial<SignInRequest>>({});

  const validateForm = (): boolean => {
    const errors: Partial<SignInRequest> = {};
    
    if (!formData.username.trim()) {
      errors.username = 'Username is required';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      await signIn(formData);
      onSuccess?.();
    } catch (error) {
      // Error is handled by AuthContext and displayed in UI
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear field error when user starts typing
    if (formErrors[name as keyof SignInRequest]) {
      setFormErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
        <p className="text-gray-600 mt-2">Sign in to your Lumina account</p>
      </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="text-red-500 flex-shrink-0" size={20} />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                formErrors.username
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
              placeholder="Enter your username"
              disabled={isLoading}
            />
            {formErrors.username && (
              <p className="mt-1 text-sm text-red-600">{formErrors.username}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                  formErrors.password
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
                placeholder="Enter your password"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {formErrors.password && (
              <p className="mt-1 text-sm text-red-600">{formErrors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
              isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
            } text-white`}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Signing In...
              </>
            ) : (
              <>
                <LogIn size={20} />
                Sign In
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-gray-600">
            Don't have an account?{' '}
            <button
              onClick={onSwitchToSignUp}
              className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
              disabled={isLoading}
            >
              Sign up
            </button>
          </p>
        </div>
    </div>
  );
};
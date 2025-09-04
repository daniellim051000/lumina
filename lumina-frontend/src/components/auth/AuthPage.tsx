import React, { useState } from 'react';
import { SignIn } from './SignIn';
import { SignUp } from './SignUp';

interface AuthPageProps {
  initialMode?: 'signin' | 'signup';
}

export const AuthPage: React.FC<AuthPageProps> = ({ 
  initialMode = 'signin' 
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);

  const handleSuccess = () => {
    // Authentication success is handled by the AuthContext
    // The app will automatically redirect to the main content
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-purple-700 p-12 flex-col justify-center">
        <div className="max-w-md">
          <div className="text-6xl mb-8">✨</div>
          <h1 className="text-4xl font-bold text-white mb-6">
            Welcome to Lumina
          </h1>
          <p className="text-xl text-blue-100 leading-relaxed">
            Your personal productivity companion. Organize tasks, track progress, 
            and stay focused on what matters most.
          </p>
          <div className="mt-8 space-y-4">
            <div className="flex items-center text-blue-100">
              <div className="w-2 h-2 bg-blue-300 rounded-full mr-3"></div>
              Task Management
            </div>
            <div className="flex items-center text-blue-100">
              <div className="w-2 h-2 bg-blue-300 rounded-full mr-3"></div>
              Focus Timer
            </div>
            <div className="flex items-center text-blue-100">
              <div className="w-2 h-2 bg-blue-300 rounded-full mr-3"></div>
              Journal & Calendar
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Authentication Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile branding */}
          <div className="lg:hidden text-center mb-8">
            <div className="text-4xl mb-4">✨</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome to Lumina
            </h1>
            <p className="text-gray-600">
              Your personal productivity companion
            </p>
          </div>

          {/* Authentication Forms */}
          <div className="bg-white">
            {mode === 'signin' ? (
              <SignIn
                onSwitchToSignUp={() => setMode('signup')}
                onSuccess={handleSuccess}
              />
            ) : (
              <SignUp
                onSwitchToSignIn={() => setMode('signin')}
                onSuccess={handleSuccess}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
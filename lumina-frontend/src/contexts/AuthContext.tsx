import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import {
  apiService,
  User,
  SignInRequest,
  SignUpRequest,
  PasswordChangeRequest,
} from '../services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (credentials: SignInRequest) => Promise<void>;
  signUp: (data: SignUpRequest) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  changePassword: (data: PasswordChangeRequest) => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize authentication state on app startup
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      setIsLoading(true);

      // Check if user is already authenticated
      if (apiService.isAuthenticated()) {
        const storedUser = apiService.getCurrentUser();
        if (storedUser) {
          // Verify token is still valid by fetching fresh user data
          try {
            const freshUser = await apiService.getUserProfile();
            setUser(freshUser);
          } catch {
            // Token might be expired, try with stored user data
            setUser(storedUser);
          }
        }
      }
    } catch {
      setError('Failed to initialize authentication');
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (credentials: SignInRequest) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiService.signIn(credentials);
      setUser(response.user);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Sign in failed';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (data: SignUpRequest) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiService.signUp(data);
      setUser(response.user);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Sign up failed';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      setError(null);

      await apiService.logout();
      setUser(null);
    } catch {
      // Even if logout request fails, clear local state
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    try {
      setIsLoading(true);
      setError(null);

      const updatedUser = await apiService.updateUserProfile(data);
      setUser(updatedUser);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Profile update failed';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const changePassword = async (data: PasswordChangeRequest) => {
    try {
      setIsLoading(true);
      setError(null);

      await apiService.changePassword(data);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Password change failed';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    signIn,
    signUp,
    logout,
    updateProfile,
    changePassword,
    error,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// API service for backend communication
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export interface HealthResponse {
  status: string;
  message: string;
  version: string;
}

export interface ApiInfoResponse {
  api_name: string;
  description: string;
  framework: string;
  database: string;
  cors_enabled: boolean;
  endpoints: string[];
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  date_joined: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  access_token: string;
  refresh_token: string;
}

export interface SignUpRequest {
  username: string;
  email: string;
  password: string;
  password_confirm: string;
  first_name?: string;
  last_name?: string;
}

export interface SignInRequest {
  username: string;
  password: string;
}

export interface PasswordChangeRequest {
  current_password: string;
  new_password: string;
  new_password_confirm: string;
}

export interface PasswordChangeResponse {
  message: string;
}

class ApiService {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    // Initialize tokens from storage on app start
    this.loadTokens();
  }

  private loadTokens() {
    this.accessToken = localStorage.getItem('access_token');
    this.refreshToken = localStorage.getItem('refresh_token');
  }

  private saveTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
  }

  private clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  }

  private async refreshAccessToken(): Promise<string | null> {
    if (!this.refreshToken) return null;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh: this.refreshToken,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        this.accessToken = data.access;
        localStorage.setItem('access_token', data.access);
        return data.access;
      } else {
        this.clearTokens();
        return null;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.clearTokens();
      return null;
    }
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit,
    isRetry = false
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options?.headers,
    };

    // Add authorization header if we have an access token
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // If unauthorized and we haven't retried yet, try to refresh token
      if (response.status === 401 && !isRetry && this.refreshToken) {
        const newToken = await this.refreshAccessToken();
        if (newToken) {
          // Retry the request with new token
          return this.request(endpoint, options, true);
        }
      }

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        
        try {
          const errorData = await response.json();
          
          // Handle different error response formats
          if (errorData.detail) {
            errorMessage = errorData.detail;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          } else if (typeof errorData === 'string') {
            errorMessage = errorData;
          } else if (errorData.non_field_errors && Array.isArray(errorData.non_field_errors)) {
            errorMessage = errorData.non_field_errors.join(', ');
          } else {
            // Handle field-specific errors
            const fieldErrors: string[] = [];
            Object.keys(errorData).forEach(field => {
              if (Array.isArray(errorData[field])) {
                fieldErrors.push(...errorData[field]);
              } else if (typeof errorData[field] === 'string') {
                fieldErrors.push(errorData[field]);
              }
            });
            
            if (fieldErrors.length > 0) {
              errorMessage = fieldErrors.join(', ');
            }
          }
          
          // Map common status codes to user-friendly messages if no specific message found
          if (errorMessage.includes(`HTTP error! status: ${response.status}`)) {
            switch (response.status) {
              case 400:
                errorMessage = 'Invalid request. Please check your input.';
                break;
              case 401:
                errorMessage = 'Invalid username or password.';
                break;
              case 403:
                errorMessage = 'Access denied. You do not have permission to perform this action.';
                break;
              case 404:
                errorMessage = 'The requested resource was not found.';
                break;
              case 429:
                errorMessage = 'Too many requests. Please wait before trying again.';
                break;
              case 500:
                errorMessage = 'Server error. Please try again later.';
                break;
              default:
                errorMessage = 'An unexpected error occurred. Please try again.';
            }
          }
        } catch (parseError) {
          // If we can't parse the response, use status-based messages
          switch (response.status) {
            case 400:
              errorMessage = 'Invalid request. Please check your input.';
              break;
            case 401:
              errorMessage = 'Invalid username or password.';
              break;
            case 403:
              errorMessage = 'Access denied. You do not have permission to perform this action.';
              break;
            case 404:
              errorMessage = 'The requested resource was not found.';
              break;
            case 429:
              errorMessage = 'Too many requests. Please wait before trying again.';
              break;
            case 500:
              errorMessage = 'Server error. Please try again later.';
              break;
            default:
              errorMessage = 'An unexpected error occurred. Please try again.';
          }
        }
        
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  // Get current user from localStorage
  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  // Health check endpoint
  async getHealth(): Promise<HealthResponse> {
    return this.request<HealthResponse>('/health/');
  }

  // API info endpoint
  async getApiInfo(): Promise<ApiInfoResponse> {
    return this.request<ApiInfoResponse>('/info/');
  }

  // Authentication methods
  async signUp(data: SignUpRequest): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/signup/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    // Save tokens and user data
    this.saveTokens(response.access_token, response.refresh_token);
    localStorage.setItem('user', JSON.stringify(response.user));
    
    return response;
  }

  async signIn(data: SignInRequest): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/signin/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    // Save tokens and user data
    this.saveTokens(response.access_token, response.refresh_token);
    localStorage.setItem('user', JSON.stringify(response.user));
    
    return response;
  }

  async logout(): Promise<void> {
    if (this.refreshToken) {
      try {
        await this.request('/auth/logout/', {
          method: 'POST',
          body: JSON.stringify({ refresh_token: this.refreshToken }),
        });
      } catch (error) {
        console.error('Logout request failed:', error);
      }
    }
    
    this.clearTokens();
  }

  async getUserProfile(): Promise<User> {
    return this.request<User>('/auth/profile/');
  }

  async updateUserProfile(data: Partial<User>): Promise<User> {
    const response = await this.request<User>('/auth/profile/', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    
    // Update stored user data
    localStorage.setItem('user', JSON.stringify(response));
    
    return response;
  }

  async changePassword(data: PasswordChangeRequest): Promise<PasswordChangeResponse> {
    return this.request<PasswordChangeResponse>('/auth/change-password/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const apiService = new ApiService();

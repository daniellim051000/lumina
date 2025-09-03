// API service for backend communication
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

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

class ApiService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Health check endpoint
  async getHealth(): Promise<HealthResponse> {
    return this.request<HealthResponse>('/health/');
  }

  // API info endpoint
  async getApiInfo(): Promise<ApiInfoResponse> {
    return this.request<ApiInfoResponse>('/info/');
  }
}

export const apiService = new ApiService();
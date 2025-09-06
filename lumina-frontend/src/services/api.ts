/**
 * API service for backend communication with comprehensive error handling,
 * token management, and exponential backoff for retry logic.
 */
import { API_ENDPOINTS, TOKEN_REFRESH } from '../constants/apiEndpoints';
import {
  Task,
  TaskListItem,
  TaskQuickCreate,
  TaskFilters,
  TaskStats,
  TaskBulkUpdate,
  Project,
  Label,
  TaskComment,
} from '../types/task';
import {
  PomodoroSettings,
  PomodoroPreset,
  PomodoroSession,
  PomodoroSessionCreate,
  PomodoroSessionUpdate,
  PomodoroSessionStats,
  PomodoroSettingsUpdate,
  PomodoroPresetData,
  SessionFilters,
} from '../types/pomodoro';

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
  // Note: tokens are now handled via httpOnly cookies, not in response body
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
  private refreshPromise: Promise<string | null> | null = null;

  constructor() {
    // Note: With httpOnly cookies, we don't need to manage tokens in JS
    // The browser will automatically send cookies with requests
  }

  private clearUserData() {
    // Only clear user data from localStorage, cookies are handled by the backend
    localStorage.removeItem('user');
  }

  /**
   * Sleep utility for exponential backoff
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Refresh access token with exponential backoff retry logic.
   * Uses a promise to prevent multiple simultaneous refresh attempts.
   * With httpOnly cookies, the refresh token is automatically sent by the browser.
   */
  private async refreshAccessToken(): Promise<boolean> {
    // If a refresh is already in progress, wait for it
    if (this.refreshPromise) {
      const result = await this.refreshPromise;
      return result !== null;
    }

    this.refreshPromise = this.performTokenRefresh();
    const result = await this.refreshPromise;
    this.refreshPromise = null;

    return result !== null;
  }

  private async performTokenRefresh(): Promise<string | null> {
    for (let attempt = 1; attempt <= TOKEN_REFRESH.MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(
          `${API_BASE_URL}${API_ENDPOINTS.AUTH.REFRESH}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include', // Include cookies in the request
          }
        );

        if (response.ok) {
          // With httpOnly cookies, tokens are automatically set by the backend
          // We just need to return success indicator
          return 'success';
        } else if (response.status === 401) {
          // Refresh token is invalid, don't retry
          this.clearUserData();
          return null;
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch {
        if (attempt < TOKEN_REFRESH.MAX_RETRIES) {
          const delay = Math.min(
            TOKEN_REFRESH.INITIAL_DELAY_MS *
              Math.pow(TOKEN_REFRESH.BACKOFF_MULTIPLIER, attempt - 1),
            TOKEN_REFRESH.MAX_DELAY_MS
          );

          await this.sleep(delay);
        }
      }
    }

    // All retries failed
    this.clearUserData();
    return null;
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

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include', // Include cookies in all requests
      });

      // If unauthorized and we haven't retried yet, try to refresh token
      if (response.status === 401 && !isRetry) {
        const refreshSuccess = await this.refreshAccessToken();
        if (refreshSuccess) {
          // Retry the request with new token (now in cookies)
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
          } else if (
            errorData.non_field_errors &&
            Array.isArray(errorData.non_field_errors)
          ) {
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
                errorMessage =
                  'Access denied. You do not have permission to perform this action.';
                break;
              case 404:
                errorMessage = 'The requested resource was not found.';
                break;
              case 429:
                errorMessage =
                  'Too many requests. Please wait before trying again.';
                break;
              case 500:
                errorMessage = 'Server error. Please try again later.';
                break;
              default:
                errorMessage =
                  'An unexpected error occurred. Please try again.';
            }
          }
        } catch {
          // If we can't parse the response, use status-based messages
          switch (response.status) {
            case 400:
              errorMessage = 'Invalid request. Please check your input.';
              break;
            case 401:
              errorMessage = 'Invalid username or password.';
              break;
            case 403:
              errorMessage =
                'Access denied. You do not have permission to perform this action.';
              break;
            case 404:
              errorMessage = 'The requested resource was not found.';
              break;
            case 429:
              errorMessage =
                'Too many requests. Please wait before trying again.';
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

      // Check if response has content before parsing JSON
      const contentLength = response.headers.get('content-length');
      if (contentLength === '0' || !contentLength) {
        return null;
      }

      const text = await response.text();
      if (!text || text.trim() === '') {
        return null;
      }

      try {
        return JSON.parse(text);
      } catch (jsonError) {
        // If text is 'null', return null
        if (text.trim() === 'null') {
          return null;
        }
        throw jsonError;
      }
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Checks if the user is currently authenticated
   * With httpOnly cookies, we check if user data exists in localStorage
   * @returns {boolean} True if user data exists (indicating they're logged in)
   */
  isAuthenticated(): boolean {
    return !!this.getCurrentUser();
  }

  /**
   * Retrieves the current user data from localStorage
   * @returns {User | null} User object if logged in, null otherwise
   */
  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  /**
   * Performs a health check on the API server
   * @returns {Promise<HealthResponse>} Promise resolving to health status
   */
  async getHealth(): Promise<HealthResponse> {
    return this.request<HealthResponse>(API_ENDPOINTS.HEALTH);
  }

  /**
   * Retrieves API information from the server
   * @returns {Promise<ApiInfoResponse>} Promise resolving to API information
   */
  async getApiInfo(): Promise<ApiInfoResponse> {
    return this.request<ApiInfoResponse>(API_ENDPOINTS.INFO);
  }

  /**
   * Registers a new user account
   * @param {SignUpRequest} data User registration data
   * @returns {Promise<AuthResponse>} Promise resolving to authentication response with tokens
   */
  async signUp(data: SignUpRequest): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>(
      API_ENDPOINTS.AUTH.SIGNUP,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );

    // Save user data to localStorage (tokens are handled via httpOnly cookies)
    localStorage.setItem('user', JSON.stringify(response.user));

    return response;
  }

  /**
   * Authenticates a user with username/password
   * @param {SignInRequest} data Login credentials
   * @returns {Promise<AuthResponse>} Promise resolving to authentication response with tokens
   */
  async signIn(data: SignInRequest): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>(
      API_ENDPOINTS.AUTH.SIGNIN,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );

    // Save user data to localStorage (tokens are handled via httpOnly cookies)
    localStorage.setItem('user', JSON.stringify(response.user));

    return response;
  }

  /**
   * Logs out the current user and clears all authentication data
   * @returns {Promise<void>} Promise that resolves when logout is complete
   */
  async logout(): Promise<void> {
    try {
      // Call logout endpoint - it will clear httpOnly cookies on the backend
      await this.request(API_ENDPOINTS.AUTH.LOGOUT, {
        method: 'POST',
      });
    } catch {
      // Silent failure for logout - still clear user data locally
    }

    this.clearUserData();
  }

  /**
   * Retrieves the current user's profile information
   * @returns {Promise<User>} Promise resolving to user profile data
   */
  async getUserProfile(): Promise<User> {
    return this.request<User>(API_ENDPOINTS.USER.PROFILE);
  }

  /**
   * Updates the current user's profile information
   * @param {Partial<User>} data Partial user data to update
   * @returns {Promise<User>} Promise resolving to updated user profile data
   */
  async updateUserProfile(data: Partial<User>): Promise<User> {
    const response = await this.request<User>(API_ENDPOINTS.USER.PROFILE, {
      method: 'PUT',
      body: JSON.stringify(data),
    });

    // Update stored user data
    localStorage.setItem('user', JSON.stringify(response));

    return response;
  }

  /**
   * Changes the current user's password
   * @param {PasswordChangeRequest} data Password change data including current and new passwords
   * @returns {Promise<PasswordChangeResponse>} Promise resolving to password change confirmation
   */
  async changePassword(
    data: PasswordChangeRequest
  ): Promise<PasswordChangeResponse> {
    return this.request<PasswordChangeResponse>(
      API_ENDPOINTS.USER.CHANGE_PASSWORD,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }

  // ========================
  // TASK MANAGEMENT METHODS
  // ========================

  /**
   * Retrieves tasks with optional filtering
   * @param {TaskFilters} filters Optional filters for tasks
   * @returns {Promise<TaskListItem[]>} Promise resolving to list of tasks
   */
  async getTasks(filters?: TaskFilters): Promise<TaskListItem[]> {
    const params = new globalThis.URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }

    const endpoint = params.toString()
      ? `${API_ENDPOINTS.TASKS.LIST}?${params.toString()}`
      : API_ENDPOINTS.TASKS.LIST;

    const response = await this.request<{
      count: number;
      next: string | null;
      previous: string | null;
      results: TaskListItem[];
    }>(endpoint);

    // Extract the results array from the paginated response
    return response.results || [];
  }

  /**
   * Retrieves a single task by ID
   * @param {number} taskId Task ID
   * @returns {Promise<Task>} Promise resolving to task details
   */
  async getTask(taskId: number): Promise<Task> {
    return this.request<Task>(API_ENDPOINTS.TASKS.DETAIL(taskId));
  }

  /**
   * Creates a new task
   * @param {Partial<Task>} taskData Task data to create
   * @returns {Promise<Task>} Promise resolving to created task
   */
  async createTask(taskData: Partial<Task>): Promise<Task> {
    return this.request<Task>(API_ENDPOINTS.TASKS.CREATE, {
      method: 'POST',
      body: JSON.stringify(taskData),
    });
  }

  /**
   * Creates a new task with minimal fields (quick create)
   * @param {TaskQuickCreate} taskData Minimal task data
   * @returns {Promise<Task>} Promise resolving to created task
   */
  async createTaskQuick(taskData: TaskQuickCreate): Promise<Task> {
    return this.request<Task>(API_ENDPOINTS.TASKS.QUICK_CREATE, {
      method: 'POST',
      body: JSON.stringify(taskData),
    });
  }

  /**
   * Updates an existing task
   * @param {number} taskId Task ID
   * @param {Partial<Task>} taskData Task data to update
   * @returns {Promise<Task>} Promise resolving to updated task
   */
  async updateTask(taskId: number, taskData: Partial<Task>): Promise<Task> {
    return this.request<Task>(API_ENDPOINTS.TASKS.UPDATE(taskId), {
      method: 'PUT',
      body: JSON.stringify(taskData),
    });
  }

  /**
   * Deletes a task
   * @param {number} taskId Task ID
   * @returns {Promise<void>} Promise resolving when task is deleted
   */
  async deleteTask(taskId: number): Promise<void> {
    return this.request<void>(API_ENDPOINTS.TASKS.DELETE(taskId), {
      method: 'DELETE',
    });
  }

  /**
   * Performs bulk operations on tasks
   * @param {TaskBulkUpdate} bulkData Bulk update data
   * @returns {Promise<{message: string}>} Promise resolving to operation result
   */
  async bulkUpdateTasks(
    bulkData: TaskBulkUpdate
  ): Promise<{ message: string }> {
    return this.request<{ message: string }>(API_ENDPOINTS.TASKS.BULK_UPDATE, {
      method: 'PATCH',
      body: JSON.stringify(bulkData),
    });
  }

  /**
   * Retrieves task statistics
   * @returns {Promise<TaskStats>} Promise resolving to task statistics
   */
  async getTaskStats(): Promise<TaskStats> {
    return this.request<TaskStats>(API_ENDPOINTS.TASKS.STATS);
  }

  // ========================
  // PROJECT MANAGEMENT METHODS
  // ========================

  /**
   * Retrieves all projects
   * @returns {Promise<Project[]>} Promise resolving to list of projects
   */
  async getProjects(): Promise<Project[]> {
    const response = await this.request<
      | {
          count: number;
          next: string | null;
          previous: string | null;
          results: Project[];
        }
      | Project[]
    >(API_ENDPOINTS.PROJECTS.LIST);

    // Handle both paginated and non-paginated responses
    return Array.isArray(response) ? response : response.results || [];
  }

  /**
   * Creates a new project
   * @param {Partial<Project>} projectData Project data
   * @returns {Promise<Project>} Promise resolving to created project
   */
  async createProject(projectData: Partial<Project>): Promise<Project> {
    return this.request<Project>(API_ENDPOINTS.PROJECTS.CREATE, {
      method: 'POST',
      body: JSON.stringify(projectData),
    });
  }

  /**
   * Updates an existing project
   * @param {number} projectId Project ID
   * @param {Partial<Project>} projectData Project data to update
   * @returns {Promise<Project>} Promise resolving to updated project
   */
  async updateProject(
    projectId: number,
    projectData: Partial<Project>
  ): Promise<Project> {
    return this.request<Project>(API_ENDPOINTS.PROJECTS.UPDATE(projectId), {
      method: 'PUT',
      body: JSON.stringify(projectData),
    });
  }

  /**
   * Deletes a project (soft delete)
   * @param {number} projectId Project ID
   * @returns {Promise<void>} Promise resolving when project is deleted
   */
  async deleteProject(projectId: number): Promise<void> {
    return this.request<void>(API_ENDPOINTS.PROJECTS.DELETE(projectId), {
      method: 'DELETE',
    });
  }

  // ========================
  // LABEL MANAGEMENT METHODS
  // ========================

  /**
   * Retrieves all labels
   * @returns {Promise<Label[]>} Promise resolving to list of labels
   */
  async getLabels(): Promise<Label[]> {
    const response = await this.request<
      | {
          count: number;
          next: string | null;
          previous: string | null;
          results: Label[];
        }
      | Label[]
    >(API_ENDPOINTS.LABELS.LIST);

    // Handle both paginated and non-paginated responses
    return Array.isArray(response) ? response : response.results || [];
  }

  /**
   * Creates a new label
   * @param {Partial<Label>} labelData Label data
   * @returns {Promise<Label>} Promise resolving to created label
   */
  async createLabel(labelData: Partial<Label>): Promise<Label> {
    return this.request<Label>(API_ENDPOINTS.LABELS.CREATE, {
      method: 'POST',
      body: JSON.stringify(labelData),
    });
  }

  /**
   * Updates an existing label
   * @param {number} labelId Label ID
   * @param {Partial<Label>} labelData Label data to update
   * @returns {Promise<Label>} Promise resolving to updated label
   */
  async updateLabel(
    labelId: number,
    labelData: Partial<Label>
  ): Promise<Label> {
    return this.request<Label>(API_ENDPOINTS.LABELS.UPDATE(labelId), {
      method: 'PUT',
      body: JSON.stringify(labelData),
    });
  }

  /**
   * Deletes a label
   * @param {number} labelId Label ID
   * @returns {Promise<void>} Promise resolving when label is deleted
   */
  async deleteLabel(labelId: number): Promise<void> {
    return this.request<void>(API_ENDPOINTS.LABELS.DELETE(labelId), {
      method: 'DELETE',
    });
  }

  // ========================
  // TASK COMMENT METHODS
  // ========================

  /**
   * Retrieves comments for a task
   * @param {number} taskId Task ID
   * @returns {Promise<TaskComment[]>} Promise resolving to list of comments
   */
  async getTaskComments(taskId: number): Promise<TaskComment[]> {
    return this.request<TaskComment[]>(
      API_ENDPOINTS.TASKS.COMMENTS.LIST(taskId)
    );
  }

  /**
   * Creates a new comment on a task
   * @param {number} taskId Task ID
   * @param {string} content Comment content
   * @returns {Promise<TaskComment>} Promise resolving to created comment
   */
  async createTaskComment(
    taskId: number,
    content: string
  ): Promise<TaskComment> {
    return this.request<TaskComment>(
      API_ENDPOINTS.TASKS.COMMENTS.CREATE(taskId),
      {
        method: 'POST',
        body: JSON.stringify({ content }),
      }
    );
  }

  /**
   * Updates a task comment
   * @param {number} commentId Comment ID
   * @param {string} content Updated comment content
   * @returns {Promise<TaskComment>} Promise resolving to updated comment
   */
  async updateTaskComment(
    commentId: number,
    content: string
  ): Promise<TaskComment> {
    return this.request<TaskComment>(
      API_ENDPOINTS.TASKS.COMMENTS.UPDATE(commentId),
      {
        method: 'PUT',
        body: JSON.stringify({ content }),
      }
    );
  }

  /**
   * Deletes a task comment
   * @param {number} commentId Comment ID
   * @returns {Promise<void>} Promise resolving when comment is deleted
   */
  async deleteTaskComment(commentId: number): Promise<void> {
    return this.request<void>(API_ENDPOINTS.TASKS.COMMENTS.DELETE(commentId), {
      method: 'DELETE',
    });
  }

  // ========================
  // POMODORO TIMER METHODS
  // ========================

  /**
   * Retrieves user's Pomodoro settings
   * @returns {Promise<PomodoroSettings>} Promise resolving to user settings
   */
  async getPomodoroSettings(): Promise<PomodoroSettings> {
    const response = await this.request<PomodoroSettings[]>(
      API_ENDPOINTS.POMODORO.SETTINGS.LIST
    );
    return response[0]; // Settings are returned as single-item array
  }

  /**
   * Updates user's Pomodoro settings
   * @param {PomodoroSettingsUpdate} settingsData Settings data to update
   * @returns {Promise<PomodoroSettings>} Promise resolving to updated settings
   */
  async updatePomodoroSettings(
    settingsData: PomodoroSettingsUpdate
  ): Promise<PomodoroSettings> {
    return this.request<PomodoroSettings>(
      API_ENDPOINTS.POMODORO.SETTINGS.UPDATE,
      {
        method: 'PUT',
        body: JSON.stringify(settingsData),
      }
    );
  }

  /**
   * Resets user's Pomodoro settings to defaults
   * @returns {Promise<PomodoroSettings>} Promise resolving to reset settings
   */
  async resetPomodoroSettings(): Promise<PomodoroSettings> {
    return this.request<PomodoroSettings>(
      API_ENDPOINTS.POMODORO.SETTINGS.RESET,
      {
        method: 'DELETE',
      }
    );
  }

  /**
   * Retrieves all user's Pomodoro presets
   * @returns {Promise<PomodoroPreset[]>} Promise resolving to list of presets
   */
  async getPomodoroPresets(): Promise<PomodoroPreset[]> {
    const response = await this.request<
      | {
          count: number;
          next: string | null;
          previous: string | null;
          results: PomodoroPreset[];
        }
      | PomodoroPreset[]
    >(API_ENDPOINTS.POMODORO.PRESETS.LIST);

    return Array.isArray(response) ? response : response.results || [];
  }

  /**
   * Creates a new Pomodoro preset
   * @param {PomodoroPresetData} presetData Preset data
   * @returns {Promise<PomodoroPreset>} Promise resolving to created preset
   */
  async createPomodoroPreset(
    presetData: PomodoroPresetData
  ): Promise<PomodoroPreset> {
    return this.request<PomodoroPreset>(API_ENDPOINTS.POMODORO.PRESETS.CREATE, {
      method: 'POST',
      body: JSON.stringify(presetData),
    });
  }

  /**
   * Updates a Pomodoro preset
   * @param {number} presetId Preset ID
   * @param {Partial<PomodoroPresetData>} presetData Preset data to update
   * @returns {Promise<PomodoroPreset>} Promise resolving to updated preset
   */
  async updatePomodoroPreset(
    presetId: number,
    presetData: Partial<PomodoroPresetData>
  ): Promise<PomodoroPreset> {
    return this.request<PomodoroPreset>(
      API_ENDPOINTS.POMODORO.PRESETS.UPDATE(presetId),
      {
        method: 'PUT',
        body: JSON.stringify(presetData),
      }
    );
  }

  /**
   * Deletes a Pomodoro preset
   * @param {number} presetId Preset ID
   * @returns {Promise<void>} Promise resolving when preset is deleted
   */
  async deletePomodoroPreset(presetId: number): Promise<void> {
    return this.request<void>(API_ENDPOINTS.POMODORO.PRESETS.DELETE(presetId), {
      method: 'DELETE',
    });
  }

  /**
   * Sets a preset as the default for the user
   * @param {number} presetId Preset ID
   * @returns {Promise<PomodoroPreset>} Promise resolving to updated preset
   */
  async setDefaultPomodoroPreset(presetId: number): Promise<PomodoroPreset> {
    return this.request<PomodoroPreset>(
      API_ENDPOINTS.POMODORO.PRESETS.SET_DEFAULT(presetId),
      {
        method: 'POST',
      }
    );
  }

  /**
   * Applies a preset to the user's current settings
   * @param {number} presetId Preset ID
   * @returns {Promise<PomodoroSettings>} Promise resolving to updated settings
   */
  async applyPomodoroPreset(presetId: number): Promise<PomodoroSettings> {
    return this.request<PomodoroSettings>(
      API_ENDPOINTS.POMODORO.PRESETS.APPLY_TO_SETTINGS(presetId),
      {
        method: 'POST',
      }
    );
  }

  /**
   * Retrieves Pomodoro sessions with optional filtering
   * @param {SessionFilters} filters Optional filters for sessions
   * @returns {Promise<PomodoroSession[]>} Promise resolving to list of sessions
   */
  async getPomodoroSessions(
    filters?: SessionFilters
  ): Promise<PomodoroSession[]> {
    const params = new globalThis.URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }

    const endpoint = params.toString()
      ? `${API_ENDPOINTS.POMODORO.SESSIONS.LIST}?${params.toString()}`
      : API_ENDPOINTS.POMODORO.SESSIONS.LIST;

    const response = await this.request<
      | {
          count: number;
          next: string | null;
          previous: string | null;
          results: PomodoroSession[];
        }
      | PomodoroSession[]
    >(endpoint);

    return Array.isArray(response) ? response : response.results || [];
  }

  /**
   * Retrieves a single Pomodoro session by ID
   * @param {number} sessionId Session ID
   * @returns {Promise<PomodoroSession>} Promise resolving to session details
   */
  async getPomodoroSession(sessionId: number): Promise<PomodoroSession> {
    return this.request<PomodoroSession>(
      API_ENDPOINTS.POMODORO.SESSIONS.DETAIL(sessionId)
    );
  }

  /**
   * Creates a new Pomodoro session
   * @param {PomodoroSessionCreate} sessionData Session data
   * @returns {Promise<PomodoroSession>} Promise resolving to created session
   */
  async createPomodoroSession(
    sessionData: PomodoroSessionCreate
  ): Promise<PomodoroSession> {
    return this.request<PomodoroSession>(
      API_ENDPOINTS.POMODORO.SESSIONS.CREATE,
      {
        method: 'POST',
        body: JSON.stringify(sessionData),
      }
    );
  }

  /**
   * Updates a Pomodoro session
   * @param {number} sessionId Session ID
   * @param {PomodoroSessionUpdate} sessionData Session data to update
   * @returns {Promise<PomodoroSession>} Promise resolving to updated session
   */
  async updatePomodoroSession(
    sessionId: number,
    sessionData: PomodoroSessionUpdate
  ): Promise<PomodoroSession> {
    return this.request<PomodoroSession>(
      API_ENDPOINTS.POMODORO.SESSIONS.UPDATE(sessionId),
      {
        method: 'PUT',
        body: JSON.stringify(sessionData),
      }
    );
  }

  /**
   * Deletes a Pomodoro session
   * @param {number} sessionId Session ID
   * @returns {Promise<void>} Promise resolving when session is deleted
   */
  async deletePomodoroSession(sessionId: number): Promise<void> {
    return this.request<void>(
      API_ENDPOINTS.POMODORO.SESSIONS.DELETE(sessionId),
      {
        method: 'DELETE',
      }
    );
  }

  /**
   * Pauses an active Pomodoro session
   * @param {number} sessionId Session ID
   * @returns {Promise<PomodoroSession>} Promise resolving to updated session
   */
  async pausePomodoroSession(sessionId: number): Promise<PomodoroSession> {
    return this.request<PomodoroSession>(
      API_ENDPOINTS.POMODORO.SESSIONS.PAUSE(sessionId),
      {
        method: 'POST',
      }
    );
  }

  /**
   * Resumes a paused Pomodoro session
   * @param {number} sessionId Session ID
   * @returns {Promise<PomodoroSession>} Promise resolving to updated session
   */
  async resumePomodoroSession(sessionId: number): Promise<PomodoroSession> {
    return this.request<PomodoroSession>(
      API_ENDPOINTS.POMODORO.SESSIONS.RESUME(sessionId),
      {
        method: 'POST',
      }
    );
  }

  /**
   * Completes a Pomodoro session
   * @param {number} sessionId Session ID
   * @returns {Promise<PomodoroSession>} Promise resolving to updated session
   */
  async completePomodoroSession(sessionId: number): Promise<PomodoroSession> {
    return this.request<PomodoroSession>(
      API_ENDPOINTS.POMODORO.SESSIONS.COMPLETE(sessionId),
      {
        method: 'POST',
      }
    );
  }

  /**
   * Skips a Pomodoro session
   * @param {number} sessionId Session ID
   * @returns {Promise<PomodoroSession>} Promise resolving to updated session
   */
  async skipPomodoroSession(sessionId: number): Promise<PomodoroSession> {
    return this.request<PomodoroSession>(
      API_ENDPOINTS.POMODORO.SESSIONS.SKIP(sessionId),
      {
        method: 'POST',
      }
    );
  }

  /**
   * Gets the current active Pomodoro session
   * @returns {Promise<PomodoroSession | null>} Promise resolving to active session or null
   */
  async getActivePomodoroSession(): Promise<PomodoroSession | null> {
    try {
      return await this.request<PomodoroSession>(
        API_ENDPOINTS.POMODORO.SESSIONS.ACTIVE
      );
    } catch (error) {
      // Return null if no active session (204 status)
      if (error instanceof Error && error.message.includes('204')) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Retrieves Pomodoro session statistics
   * @param {number} days Number of days to include in stats (default: 30)
   * @returns {Promise<PomodoroSessionStats>} Promise resolving to session statistics
   */
  async getPomodoroStats(days = 30): Promise<PomodoroSessionStats> {
    const params = new globalThis.URLSearchParams();
    params.append('days', days.toString());

    const endpoint = `${API_ENDPOINTS.POMODORO.SESSIONS.STATS}?${params.toString()}`;
    return this.request<PomodoroSessionStats>(endpoint);
  }
}

export const apiService = new ApiService();

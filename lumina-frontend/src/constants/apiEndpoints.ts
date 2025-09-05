/**
 * API endpoint constants for Lumina application.
 * Centralized endpoint definitions to avoid magic strings throughout the codebase.
 */

export const API_ENDPOINTS = {
  // Health and info endpoints
  HEALTH: '/health/',
  INFO: '/info/',

  // Authentication endpoints
  AUTH: {
    SIGNUP: '/auth/signup/',
    SIGNIN: '/auth/signin/',
    LOGOUT: '/auth/logout/',
    REFRESH: '/auth/refresh/',
    VERIFY: '/auth/verify/',
  },

  // User profile endpoints
  USER: {
    PROFILE: '/auth/profile/',
    CHANGE_PASSWORD: '/auth/change-password/',
  },

  // Task management endpoints
  TASKS: {
    LIST: '/tasks/',
    CREATE: '/tasks/',
    DETAIL: (id: number) => `/tasks/${id}/`,
    UPDATE: (id: number) => `/tasks/${id}/`,
    DELETE: (id: number) => `/tasks/${id}/`,
    QUICK_CREATE: '/tasks/quick/',
    BULK_UPDATE: '/tasks/bulk/',
    STATS: '/tasks/stats/',
    COMMENTS: {
      LIST: (taskId: number) => `/tasks/${taskId}/comments/`,
      CREATE: (taskId: number) => `/tasks/${taskId}/comments/`,
      DETAIL: (commentId: number) => `/comments/${commentId}/`,
      UPDATE: (commentId: number) => `/comments/${commentId}/`,
      DELETE: (commentId: number) => `/comments/${commentId}/`,
    },
  },

  // Project management endpoints
  PROJECTS: {
    LIST: '/projects/',
    CREATE: '/projects/',
    DETAIL: (id: number) => `/projects/${id}/`,
    UPDATE: (id: number) => `/projects/${id}/`,
    DELETE: (id: number) => `/projects/${id}/`,
  },

  // Label management endpoints
  LABELS: {
    LIST: '/labels/',
    CREATE: '/labels/',
    DETAIL: (id: number) => `/labels/${id}/`,
    UPDATE: (id: number) => `/labels/${id}/`,
    DELETE: (id: number) => `/labels/${id}/`,
  },
} as const;

/**
 * Rate limiting constants for authentication endpoints
 */
export const RATE_LIMITS = {
  AUTH_SIGNUP: '5/m',
  AUTH_SIGNIN: '5/m',
} as const;

/**
 * Token refresh constants
 */
export const TOKEN_REFRESH = {
  MAX_RETRIES: 3,
  INITIAL_DELAY_MS: 1000,
  BACKOFF_MULTIPLIER: 2,
  MAX_DELAY_MS: 30000,
} as const;

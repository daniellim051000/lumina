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

  // Future task management endpoints
  TASKS: {
    LIST: '/tasks/',
    CREATE: '/tasks/',
    DETAIL: (id: number) => `/tasks/${id}/`,
    UPDATE: (id: number) => `/tasks/${id}/`,
    DELETE: (id: number) => `/tasks/${id}/`,
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

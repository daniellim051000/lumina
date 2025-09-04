export const colors = {
  primary: {
    50: '#f0f0ff',
    100: '#e6e6ff',
    200: '#d4d4ff',
    300: '#b8b8ff',
    400: '#9999ff',
    500: '#667eea',
    600: '#5566d6',
    700: '#4455c2',
    800: '#3344ae',
    900: '#22339a',
  },
  
  secondary: {
    50: '#f5f2ff',
    100: '#ebe8ff',
    200: '#d6d0ff',
    300: '#c2b8ff',
    400: '#ad99ff',
    500: '#764ba2',
    600: '#6a4391',
    700: '#5d3b80',
    800: '#51336f',
    900: '#442b5e',
  },

  neutral: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
    white: '#ffffff',
    black: '#000000',
  },

  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },

  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },

  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },

  info: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
} as const;

export const glassmorphism = {
  light: 'rgba(255, 255, 255, 0.1)',
  medium: 'rgba(255, 255, 255, 0.2)',
  heavy: 'rgba(255, 255, 255, 0.3)',
  dark: 'rgba(0, 0, 0, 0.1)',
  darkMedium: 'rgba(0, 0, 0, 0.2)',
  darkHeavy: 'rgba(0, 0, 0, 0.3)',
} as const;

export const gradients = {
  primary: `linear-gradient(135deg, ${colors.primary[500]} 0%, ${colors.secondary[500]} 100%)`,
  primaryLight: `linear-gradient(135deg, ${colors.primary[400]} 0%, ${colors.secondary[400]} 100%)`,
  primaryDark: `linear-gradient(135deg, ${colors.primary[600]} 0%, ${colors.secondary[600]} 100%)`,
  success: `linear-gradient(135deg, ${colors.success[400]} 0%, ${colors.success[600]} 100%)`,
  warning: `linear-gradient(135deg, ${colors.warning[400]} 0%, ${colors.warning[600]} 100%)`,
  error: `linear-gradient(135deg, ${colors.error[400]} 0%, ${colors.error[600]} 100%)`,
  info: `linear-gradient(135deg, ${colors.info[400]} 0%, ${colors.info[600]} 100%)`,
} as const;

export const semantic = {
  background: {
    primary: colors.neutral.white,
    secondary: colors.neutral[50],
    tertiary: colors.neutral[100],
  },
  text: {
    primary: colors.neutral[900],
    secondary: colors.neutral[600],
    tertiary: colors.neutral[500],
    inverse: colors.neutral.white,
  },
  border: {
    light: colors.neutral[200],
    medium: colors.neutral[300],
    heavy: colors.neutral[400],
  },
  status: {
    todo: {
      bg: colors.neutral[100],
      text: colors.neutral[800],
      border: colors.neutral[200],
    },
    inProgress: {
      bg: colors.info[100],
      text: colors.info[800],
      border: colors.info[200],
    },
    completed: {
      bg: colors.success[100],
      text: colors.success[800],
      border: colors.success[200],
    },
    overdue: {
      bg: colors.error[100],
      text: colors.error[800],
      border: colors.error[200],
    },
  },
  priority: {
    low: {
      bg: colors.success[100],
      text: colors.success[800],
      border: colors.success[200],
    },
    medium: {
      bg: colors.warning[100],
      text: colors.warning[800],
      border: colors.warning[200],
    },
    high: {
      bg: colors.error[100],
      text: colors.error[800],
      border: colors.error[200],
    },
  },
} as const;

export const tailwindColors = {
  gray: colors.neutral,
  blue: colors.info,
  green: colors.success,
  yellow: colors.warning,
  red: colors.error,
  primary: colors.primary,
  secondary: colors.secondary,
} as const;

export type ColorScale = typeof colors.primary;
export type SemanticColors = typeof semantic;
export type GradientType = keyof typeof gradients;
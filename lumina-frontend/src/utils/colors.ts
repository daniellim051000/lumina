import colorConfig from '../config/colors.json';

export const colors = colorConfig;

export function validateColorConfig(): boolean {
  try {
    const requiredColors = [
      'primary',
      'secondary',
      'neutral',
      'success',
      'warning',
      'error',
      'info',
    ];
    for (const colorName of requiredColors) {
      if (!colors[colorName as keyof typeof colors]) {
        console.error(`Missing color palette: ${colorName}`);
        return false;
      }
    }
    return true;
  } catch (error) {
    console.error('Error validating color configuration:', error);
    return false;
  }
}

export function getColorWithFallback(
  palette: keyof typeof colors,
  shade: string | number,
  fallback = '#000000'
): string {
  try {
    const colorPalette = colors[palette];
    if (
      colorPalette &&
      typeof colorPalette === 'object' &&
      shade in colorPalette
    ) {
      return colorPalette[shade as keyof typeof colorPalette] as string;
    }
    console.warn(
      `Color not found: ${String(palette)}.${String(shade)}, using fallback: ${fallback}`
    );
    return fallback;
  } catch (error) {
    console.error('Error accessing color:', error);
    return fallback;
  }
}

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

import { colors, glassmorphism, gradients } from './colors';

export const injectCSSVariables = () => {
  const root = document.documentElement;

  Object.entries(colors.primary).forEach(([key, value]) => {
    root.style.setProperty(`--color-primary-${key}`, value);
  });

  Object.entries(colors.secondary).forEach(([key, value]) => {
    root.style.setProperty(`--color-secondary-${key}`, value);
  });

  Object.entries(colors.neutral).forEach(([key, value]) => {
    root.style.setProperty(`--color-neutral-${key}`, value);
  });

  Object.entries(colors.success).forEach(([key, value]) => {
    root.style.setProperty(`--color-success-${key}`, value);
  });

  Object.entries(colors.warning).forEach(([key, value]) => {
    root.style.setProperty(`--color-warning-${key}`, value);
  });

  Object.entries(colors.error).forEach(([key, value]) => {
    root.style.setProperty(`--color-error-${key}`, value);
  });

  Object.entries(colors.info).forEach(([key, value]) => {
    root.style.setProperty(`--color-info-${key}`, value);
  });

  Object.entries(glassmorphism).forEach(([key, value]) => {
    root.style.setProperty(`--glass-${key}`, value);
  });

  Object.entries(gradients).forEach(([key, value]) => {
    root.style.setProperty(`--gradient-${key}`, value);
  });
};

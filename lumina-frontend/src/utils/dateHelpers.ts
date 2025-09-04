/**
 * Date utility functions for consistent date handling across the application
 */

/**
 * Gets today's date as a string in YYYY-MM-DD format for date inputs
 * Uses local timezone to ensure consistency with user's expectation
 */
export const getTodayAsDateString = (): string => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Converts a Date object to YYYY-MM-DD format for date inputs
 * Returns empty string if date is null/undefined
 */
export const formatDateForInput = (date: Date | null | undefined): string => {
  return date ? date.toISOString().split('T')[0] : '';
};

/**
 * Checks if a date is in the past (overdue)
 * Compares dates at midnight local time to avoid timezone issues
 */
export const isDateOverdue = (date: Date | null | undefined): boolean => {
  if (!date) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const compareDate = new Date(date);
  compareDate.setHours(0, 0, 0, 0);

  return compareDate < today;
};

/**
 * Checks if a date is today
 */
export const isDateToday = (date: Date | null | undefined): boolean => {
  if (!date) return false;

  const today = new Date();
  const compareDate = new Date(date);

  return (
    today.getFullYear() === compareDate.getFullYear() &&
    today.getMonth() === compareDate.getMonth() &&
    today.getDate() === compareDate.getDate()
  );
};

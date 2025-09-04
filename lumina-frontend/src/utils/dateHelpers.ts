/**
 * Date utility functions for consistent date handling across the application
 */

/**
 * Gets today's date as a string in YYYY-MM-DD format for date inputs
 * Uses local timezone to ensure consistency with user's expectation
 */
export const getTodayAsDateString = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Converts a Date object to YYYY-MM-DD format for date inputs
 * Returns empty string if date is null/undefined
 * Uses local timezone to ensure consistency with user's expectation
 */
export const formatDateForInput = (date: Date | null | undefined): string => {
  if (!date || isNaN(date.getTime())) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Checks if a date is in the past (overdue)
 * Compares dates at midnight local time to avoid timezone issues
 */
export const isDateOverdue = (date: Date | null | undefined): boolean => {
  if (!date || isNaN(date.getTime())) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const compareDate = new Date(date.getTime());
  compareDate.setHours(0, 0, 0, 0);

  return compareDate < today;
};

/**
 * Checks if a date is today
 */
export const isDateToday = (date: Date | null | undefined): boolean => {
  if (!date || isNaN(date.getTime())) return false;

  const today = new Date();
  const compareDate = new Date(date.getTime());

  return (
    today.getFullYear() === compareDate.getFullYear() &&
    today.getMonth() === compareDate.getMonth() &&
    today.getDate() === compareDate.getDate()
  );
};

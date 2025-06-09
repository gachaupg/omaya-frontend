/**
 * formatters.ts – auto‑generated placeholder
 */

/**
 * Utility functions for formatting data
 */

/**
 * Formats a date string or Date object into DD/MM/YYYY format
 * @param date - The date to format
 * @returns Formatted date string in DD/MM/YYYY format
 */
export const formatDate = (date: string | Date): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const day = String(dateObj.getDate()).padStart(2, "0");
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const year = dateObj.getFullYear();
  return `${day}/${month}/${year}`;
};

/**
 * Formats a number to 2 decimal places
 * @param value - The number to format
 * @returns Formatted number string
 */
export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

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

/**
 * Formats a balance with appropriate decimal places for small values
 * @param value - The balance to format
 * @returns Formatted balance string
 */
export const formatBalance = (value: number): string => {
  if (value === 0) return "0.00";
  
  // For very small values, show more decimal places
  if (value < 0.01) {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 8,
      maximumFractionDigits: 8,
    }).format(value);
  }
  
  // For normal values, use standard 2 decimal places
  return formatNumber(value);
};

/**
 * Formats large numbers to be user-friendly
 * Converts numbers with more than 7 digits to use K, M, B suffixes
 */
export const formatLargeNumber = (num: number): string => {
  if (num === 0) return '0';
  
  const absNum = Math.abs(num);
  
  if (absNum >= 1e9) {
    return (num / 1e9).toFixed(1) + 'B';
  } else if (absNum >= 1e6) {
    return (num / 1e6).toFixed(1) + 'M';
  } else if (absNum >= 1e3) {
    return (num / 1e3).toFixed(1) + 'K';
  } else if (absNum >= 1000000) {
    // For numbers with 7+ digits but less than 1M
    return num.toLocaleString();
  }
  
  return num.toString();
};

/**
 * Global formatter utilities for consistent number and currency formatting across the application
 */

/**
 * Formats a number with appropriate abbreviations for large numbers
 * and full precision for small numbers
 * 
 * @param value - The number to format
 * @param options - Formatting options
 * @returns Formatted string
 * 
 * Examples:
 * - 3600000 -> "3.6M"
 * - 1500000 -> "1.5M" 
 * - 500000 -> "500,000"
 * - 0.00067 -> "0.00067"
 * - 0.001234 -> "0.00123"
 * - 1234.56 -> "1,234.56"
 */
const extractNumericValue = (
  value: number | string | null | undefined
): number | null => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string") {
    const normalized = value.replace(/,/g, "").match(/-?\d+(\.\d+)?/);
    if (normalized) {
      const parsed = parseFloat(normalized[0]);
      return Number.isNaN(parsed) ? null : parsed;
    }
    return null;
  }

  return null;
};

export const formatAmount = (
  rawValue: number | string,
  options: {
    decimals?: number;
    showCurrency?: boolean;
    currency?: string;
    threshold?: number; // Minimum value to start abbreviating (default: 1000)
  } = {}
): string => {
  const {
    decimals = 2,
    showCurrency = false,
    currency = 'USD',
    threshold = 1000
  } = options;

  const numericValue = extractNumericValue(rawValue);

  if (numericValue === null) {
    return showCurrency ? `0 ${currency}` : '0';
  }

  const absValue = Math.abs(numericValue);
  const sign = numericValue < 0 ? '-' : '';

  // For very small numbers, show full precision
  if (absValue < 0.01 && absValue > 0) {
    const formatted = numericValue.toFixed(Math.max(5, decimals));
    return showCurrency ? `${formatted} ${currency}` : formatted;
  }

  // For numbers below threshold, show with normal formatting
  if (absValue < threshold) {
    const formatted = numericValue.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals
    });
    return showCurrency ? `${formatted} ${currency}` : formatted;
  }

  // For large numbers, use abbreviations (starting from 1M, not K)
  const abbreviations = [
    { value: 1e12, symbol: 'T' },
    { value: 1e9, symbol: 'B' },
    { value: 1e6, symbol: 'M' }
  ];

  for (const { value: abbrevValue, symbol } of abbreviations) {
    if (absValue >= abbrevValue) {
      const formatted = (absValue / abbrevValue).toFixed(decimals);
      // Remove trailing zeros and decimal point if not needed
      const cleanFormatted = parseFloat(formatted).toString();
      const result = `${sign}${cleanFormatted}${symbol}`;
      return showCurrency ? `${result} ${currency}` : result;
    }
  }

  // Fallback for edge cases
  const formatted = numericValue.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals
  });
  return showCurrency ? `${formatted} ${currency}` : formatted;
};

/**
 * Formats currency amounts with smart abbreviations
 * 
 * @param amount - The amount to format
 * @param currency - Currency code (default: 'USD')
 * @returns Formatted currency string
 * 
 * Examples:
 * - formatCurrency(3600000) -> "3.6M USD"
 * - formatCurrency(500000) -> "500,000 USD"
 * - formatCurrency(0.00067) -> "0.00067 USD"
 * - formatCurrency(1234.56) -> "1,234.56 USD"
 */
export const formatCurrency = (
  amount: number | string,
  currency: string = 'USD'
): string => {
  return formatAmount(amount, {
    showCurrency: true,
    currency,
    decimals: 2
  });
};

/**
 * Formats numbers for display in tables and lists
 * 
 * @param value - The number to format
 * @param options - Formatting options
 * @returns Formatted string
 */
export const formatNumber = (
  value: number | string,
  options: {
    decimals?: number;
    compact?: boolean;
  } = {}
): string => {
  const { decimals = 2, compact = true } = options;

  if (compact) {
    return formatAmount(value, { decimals });
  }

  const numericValue = extractNumericValue(value);

  if (numericValue === null) {
    return '0';
  }

  return numericValue.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals
  });
};

/**
 * Formats percentage values
 * 
 * @param value - The percentage value (0-100)
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted percentage string
 * 
 * Examples:
 * - formatPercentage(25.67) -> "25.7%"
 * - formatPercentage(0.123) -> "0.1%"
 */
export const formatPercentage = (
  value: number,
  decimals: number = 1
): string => {
  if (isNaN(value) || value === null || value === undefined) {
    return '0%';
  }

  return `${value.toFixed(decimals)}%`;
};

/**
 * Formats large numbers with commas for readability
 * 
 * @param value - The number to format
 * @returns Formatted string with commas
 * 
 * Examples:
 * - formatWithCommas(1234567) -> "1,234,567"
 * - formatWithCommas(1234.56) -> "1,234.56"
 */
export const formatWithCommas = (value: number): string => {
  if (isNaN(value) || value === null || value === undefined) {
    return '0';
  }

  return value.toLocaleString('en-US');
};

/**
 * Formats wallet balance with appropriate precision
 * 
 * @param balance - The balance amount
 * @param currency - Currency code (default: 'USD')
 * @returns Formatted balance string
 */
export const formatBalance = (
  balance: number,
  currency: string = 'USD'
): string => {
  return formatCurrency(balance, currency);
};

/**
 * Formats transaction amounts with smart formatting
 * 
 * @param amount - The transaction amount
 * @param currency - Currency code (default: 'USD')
 * @returns Formatted transaction amount
 */
export const formatTransactionAmount = (
  amount: number,
  currency: string = 'USD'
): string => {
  return formatAmount(amount, {
    showCurrency: true,
    currency,
    decimals: 2,
    threshold: 1000
  });
};

/** East Africa Time (EAT) — e.g. Kenya, Tanzania, Uganda */
const EAST_AFRICA_TZ = "Africa/Nairobi";

export const formatDateTimeEastAfrica = (
  input: Date | number | string
): string => {
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) {
    return "";
  }
  return new Intl.DateTimeFormat("en-KE", {
    timeZone: EAST_AFRICA_TZ,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
};

/** Show relative “When” labels only for transactions within this window. */
export const TRANSACTION_WHEN_RELATIVE_MAX_DAYS = 7;

const TRANSACTION_WHEN_RELATIVE_MAX_MS =
  TRANSACTION_WHEN_RELATIVE_MAX_DAYS * 24 * 60 * 60 * 1000;

function formatTransactionAbsoluteDate(d: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: EAST_AFRICA_TZ,
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

function formatTransactionRelativeWhen(d: Date, now: Date): string {
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diffInSeconds < 60) return "now";
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} min ago`;
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  }
  const days = Math.floor(diffInSeconds / 86400);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

/** Dashboard Recent Transactions (All, Exchange, Swap, P2P, MoneyX) — always exact date. */
export const formatDashboardTransactionWhen = (
  input: Date | number | string | null | undefined
): string => {
  if (input == null || input === "") return "-";
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return "-";
  return formatTransactionAbsoluteDate(d);
};

/**
 * OMAYA / live feeds: relative time up to 7 days, then exact date (EAT).
 */
export const formatRecentTransactionWhen = (
  input: Date | number | string | null | undefined
): string => {
  if (input == null || input === "") return "-";
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return "-";

  const now = new Date();
  const diffMs = now.getTime() - d.getTime();

  if (diffMs > TRANSACTION_WHEN_RELATIVE_MAX_MS || diffMs < 0) {
    return formatTransactionAbsoluteDate(d);
  }

  return formatTransactionRelativeWhen(d, now);
};

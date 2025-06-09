import Decimal from "decimal.js";

/**
 * Safely converts a value to a Decimal instance
 * @param value - The value to convert (string, number, or Decimal)
 * @returns A Decimal instance
 */
export const toDecimal = (value: string | number | Decimal): Decimal => {
  if (value instanceof Decimal) return value;
  if (typeof value === "string" && !value.trim()) return new Decimal(0);
  return new Decimal(value || 0);
};

/**
 * Calculates the withdrawal amount after fees
 * @param amount - The withdrawal amount
 * @param fee - The withdrawal fee
 * @returns The amount after fee deduction
 */
export const calculateWithdrawalAmount = (
  amount: string | number | Decimal,
  fee: string | number | Decimal
): string => {
  const amountDecimal = toDecimal(amount);
  const feeDecimal = toDecimal(fee);

  return amountDecimal.minus(feeDecimal).toFixed(2);
};

/**
 * Safely converts a value to a number for API requests
 * @param value - The value to convert
 * @returns A number
 */
export const toNumber = (value: string | number | Decimal): number => {
  return toDecimal(value).toNumber();
};

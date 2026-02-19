/**
 * Reusable wallet amounts (balance, available, escrow) from P2P transaction summary API.
 * Use these helpers and selectors wherever transaction summary data is consumed.
 */

import type { TransactionSummary } from "./types";

/** Parse API amount string to number; returns 0 for invalid/missing */
export function parseWalletAmount(value: string | undefined | null): number {
  if (value == null || value === "") return 0;
  const n = parseFloat(String(value).replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

/** Shape of wallet amounts from transaction summary */
export interface P2PWalletAmounts {
  /** Total balance (total_balance from API) */
  balance: number;
  /** Available to use (available_amount from API) */
  availableAmount: number;
  /** In escrow / locked (escrow from API) */
  escrow: number;
}

/**
 * Get balance, available amount, and escrow from transaction summary.
 * Reusable for selectors or when you already have the summary object.
 */
export function getWalletAmountsFromSummary(
  summary: TransactionSummary | null
): P2PWalletAmounts {
  if (!summary) {
    return { balance: 0, availableAmount: 0, escrow: 0 };
  }
  return {
    balance: parseWalletAmount(summary.total_balance),
    availableAmount: parseWalletAmount(summary.available_amount),
    escrow: parseWalletAmount(summary.escrow),
  };
}

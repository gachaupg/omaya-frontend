const MONEYX_TRANSACTION_KEYS = [
  "moneyx_transaction_data",
  "express_transaction_data",
  "moneyx_transaction_expiry",
] as const;

/**
 * Remove an abandoned MoneyX/Express transaction draft once its countdown has
 * expired. Components only clear these keys when the user reaches a
 * success/failure screen or explicitly backs out - if the tab is closed or
 * navigated away from mid-transaction, the draft (including short-lived
 * presigned S3 URLs) would otherwise sit in localStorage indefinitely.
 * Safe to call on every app load; it's a no-op unless a stale entry exists.
 */
export function clearExpiredMoneyXTransactionCache(): void {
  if (typeof window === "undefined") return;

  try {
    const stored = localStorage.getItem("moneyx_transaction_expiry");
    if (!stored) return;

    const parsed = JSON.parse(stored) as { expiry?: number } | null;
    if (typeof parsed?.expiry === "number" && parsed.expiry <= Date.now()) {
      MONEYX_TRANSACTION_KEYS.forEach((key) => localStorage.removeItem(key));
    }
  } catch {
    // Malformed entry — drop just the expiry marker, leave the rest alone.
    localStorage.removeItem("moneyx_transaction_expiry");
  }
}

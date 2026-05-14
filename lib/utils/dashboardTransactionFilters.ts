/**
 * Exchange / deposit flows may return `pending_address` until the user submits
 * an on-chain address. Hide these from dashboard “recent transactions” views.
 */
export function isPendingAddressDashboardStatus(status: unknown): boolean {
  const raw = String(status ?? "").trim().toLowerCase();
  if (!raw) return false;
  const normalized = raw.replace(/\s+/g, "_");
  return normalized === "pending_address";
}

function isBlankAddressField(v: unknown): boolean {
  return v == null || String(v).trim() === "";
}

/**
 * Omit `type: "exchange"` rows where both chain addresses are unset (null or "").
 * Used by dashboard Recent Transactions (All + Exchange tabs).
 */
export function shouldOmitExchangeWithoutDepositOrWithdrawal(tx: {
  type?: unknown;
  transaction_type?: unknown;
  deposit_address?: unknown;
  withdrawal_address?: unknown;
}): boolean {
  const ty = String(tx?.type ?? tx?.transaction_type ?? "")
    .trim()
    .toLowerCase();
  if (ty !== "exchange") return false;
  return (
    isBlankAddressField(tx?.deposit_address) &&
    isBlankAddressField(tx?.withdrawal_address)
  );
}

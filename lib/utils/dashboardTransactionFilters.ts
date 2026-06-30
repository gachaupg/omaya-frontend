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
 * Omit incomplete `type: "exchange"` stub rows with no addresses and no bank/payment info.
 * Bank deposits often have null `deposit_address` but valid `from_address` + `payment_method`.
 */
export function shouldOmitExchangeWithoutDepositOrWithdrawal(tx: {
  type?: unknown;
  transaction_type?: unknown;
  deposit_address?: unknown;
  withdrawal_address?: unknown;
  from_address?: unknown;
  to_address?: unknown;
  payment_method?: unknown;
}): boolean {
  const ty = String(tx?.type ?? tx?.transaction_type ?? "")
    .trim()
    .toLowerCase();
  if (ty !== "exchange") return false;

  const hasAddress =
    !isBlankAddressField(tx?.deposit_address) ||
    !isBlankAddressField(tx?.withdrawal_address) ||
    !isBlankAddressField(tx?.from_address) ||
    !isBlankAddressField(tx?.to_address);

  if (hasAddress) return false;

  const pm = tx?.payment_method;
  const hasPaymentMethod =
    pm != null &&
    typeof pm === "object" &&
    !isBlankAddressField((pm as { provider?: unknown }).provider);

  return !hasPaymentMethod;
}

export { OMAYA_IO_ACCOUNT_DETAILS_TITLE, PLATFORM_BRAND } from "@/lib/constants/brand";

export type PaymentDetailDisplayRow = {
  label: string;
  value: string;
  copyable?: boolean;
};

const pick = (v: unknown): string =>
  v != null && String(v).trim() !== "" ? String(v).trim() : "";

/** First nested admin or legacy payment_details entry. */
export function getPaymentDetailNested(pd: unknown): Record<string, unknown> | null {
  if (!pd || typeof pd !== "object") return null;
  const p = pd as Record<string, unknown>;
  const admin = Array.isArray(p.admin_payment_details) ? p.admin_payment_details[0] : null;
  const legacy = Array.isArray(p.payment_details) ? p.payment_details[0] : null;
  const nested = (admin || legacy) as Record<string, unknown> | null;
  return nested && typeof nested === "object" ? nested : null;
}

export function resolvePaymentAccountName(
  pd: unknown,
  fallbackName?: string
): string {
  if (!pd || typeof pd !== "object") return fallbackName?.trim() || "";
  const p = pd as Record<string, unknown>;
  const n = getPaymentDetailNested(pd);
  return pick(p.account_name) || pick(n?.account_name) || fallbackName?.trim() || "";
}

export function resolvePaymentAccountNumber(pd: unknown): string {
  if (!pd || typeof pd !== "object") return "";
  const p = pd as Record<string, unknown>;
  const n = getPaymentDetailNested(pd);
  return (
    pick(p.account_number) ||
    pick(p.account_no) ||
    pick(n?.account_number) ||
    pick(n?.account_no) ||
    pick(p.iban) ||
    pick(n?.iban) ||
    ""
  );
}

export function resolvePaymentMobileNumber(pd: unknown): string {
  if (!pd || typeof pd !== "object") return "";
  const p = pd as Record<string, unknown>;
  const n = getPaymentDetailNested(pd);
  return pick(p.mobile_number) || pick(n?.mobile_number) || "";
}

export function resolvePaymentWalletAddress(pd: unknown): string {
  if (!pd || typeof pd !== "object") return "";
  const p = pd as Record<string, unknown>;
  const n = getPaymentDetailNested(pd);
  return pick(p.wallet_address) || pick(n?.wallet_address) || "";
}

/** Primary reference users send funds to (account, then mobile, then wallet). */
export function resolvePaymentSendToReference(pd: unknown): string {
  return (
    resolvePaymentAccountNumber(pd) ||
    resolvePaymentMobileNumber(pd) ||
    resolvePaymentWalletAddress(pd) ||
    ""
  );
}

export function getPaymentDetailDisplayRows(
  pd: unknown,
  options?: { fallbackName?: string }
): PaymentDetailDisplayRow[] {
  const accountName = resolvePaymentAccountName(pd, options?.fallbackName);
  const accountNumber = resolvePaymentAccountNumber(pd);
  const mobile = resolvePaymentMobileNumber(pd);
  const wallet = resolvePaymentWalletAddress(pd);

  const rows: PaymentDetailDisplayRow[] = [];

  if (accountName) {
    rows.push({ label: "Account name", value: accountName, copyable: false });
  }
  if (accountNumber) {
    rows.push({ label: "Account number", value: accountNumber, copyable: true });
  }
  if (mobile && mobile !== accountNumber) {
    rows.push({ label: "Mobile number", value: mobile, copyable: true });
  }
  if (
    wallet &&
    wallet !== accountNumber &&
    wallet !== mobile
  ) {
    rows.push({ label: "Wallet address", value: wallet, copyable: true });
  }

  return rows;
}

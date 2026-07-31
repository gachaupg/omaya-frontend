export function parseAllowAutoSend(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.trim().toLowerCase() === "true";
  return false;
}

export function findAutoSendPaymentDetail(
  details: unknown
): Record<string, unknown> | null {
  if (!Array.isArray(details)) return null;
  const match = details.find(
    (detail) =>
      detail &&
      typeof detail === "object" &&
      parseAllowAutoSend((detail as Record<string, unknown>).allow_auto_send)
  );
  return (match as Record<string, unknown>) ?? null;
}

/** Auto-send holder among bank/mobile rails only (crypto & forex excluded). */
export function findAutoSendPaymentDetailForFiatRails(
  details: unknown
): Record<string, unknown> | null {
  if (!Array.isArray(details)) return null;
  for (const detail of details) {
    if (!detail || typeof detail !== "object") continue;
    const d = detail as PaymentMethodShape;
    if (isCryptoPaymentMethodForAutoSend(d)) continue;
    if (isForexPaymentMethodForAutoSend(d)) continue;
    if (parseAllowAutoSend(d.allow_auto_send)) {
      return d as Record<string, unknown>;
    }
  }
  return null;
}

export function shouldShowAddAllowAutoSendCheckbox(
  methodTab: "bank" | "crypto" | "forex",
  allDetails: unknown
): boolean {
  if (methodTab !== "bank") return false;
  return findAutoSendPaymentDetailForFiatRails(allDetails) == null;
}

type PaymentDetailRef = {
  id?: number | string;
  user_payment_detail_id?: string;
};

export function paymentDetailKeysMatch(
  a: PaymentDetailRef | null | undefined,
  b: PaymentDetailRef | null | undefined
): boolean {
  if (!a || !b) return false;
  const aUuid = String(a.user_payment_detail_id ?? "").trim();
  const bUuid = String(b.user_payment_detail_id ?? "").trim();
  if (aUuid && bUuid && aUuid === bUuid) return true;
  const aId = String(a.id ?? "").trim();
  const bId = String(b.id ?? "").trim();
  return Boolean(aId && bId && aId === bId);
}

/** True when the row being edited is the account that currently has auto-send enabled. */
export function isEditingAutoSendPaymentDetail(
  editing: PaymentDetailRef | null | undefined,
  allDetails: unknown
): boolean {
  const holder = findAutoSendPaymentDetailForFiatRails(allDetails);
  if (!holder || !editing) return false;
  return paymentDetailKeysMatch(editing, holder as PaymentDetailRef);
}

type PaymentMethodShape = PaymentDetailRef & {
  payment_method_name?: string;
  payment_provider_name?: string;
  wallet_address?: string | null;
  allow_auto_send?: boolean | string;
};

/** Crypto on-chain wallets — auto-send applies to fiat/bank/mobile rails only. */
export function isCryptoPaymentMethodForAutoSend(
  method: PaymentMethodShape | null | undefined
): boolean {
  if (!method) return false;
  const pm = String(method.payment_method_name || "").toLowerCase();
  if (pm.includes("crypto")) return true;
  const prov = String(method.payment_provider_name || "").toLowerCase();
  if (/\b(bsc|bep20|usdt|trc20|tron|erc20|polygon|metamask|tether)\b/.test(prov)) {
    const wa = String(method.wallet_address || "").trim();
    if (wa.startsWith("0x") || wa.length >= 26) return true;
  }
  return false;
}

export function isForexPaymentMethodForAutoSend(
  method: PaymentMethodShape | null | undefined
): boolean {
  if (!method) return false;
  return String(method.payment_method_name || "").toLowerCase().includes("forex");
}

/**
 * Edit modal: show allow_auto_send when no account has it (all bank/mobile methods),
 * or when editing the account that currently has it (can disable).
 */
export function shouldShowEditAllowAutoSendCheckbox(
  editing: PaymentMethodShape | null | undefined,
  allDetails: unknown
): boolean {
  if (!editing) return false;
  if (isCryptoPaymentMethodForAutoSend(editing)) return false;
  if (isForexPaymentMethodForAutoSend(editing)) return false;
  if (!findAutoSendPaymentDetailForFiatRails(allDetails)) return true;
  return isEditingAutoSendPaymentDetail(editing, allDetails);
}

export function maskPaymentIdentifier(value: string): string {
  const v = String(value || "").trim();
  if (!v) return "";
  if (v.length <= 6) return "••••••";
  return `${v.slice(0, 2)}••••${v.slice(-4)}`;
}

/** User-facing label for the payment method that has auto-send enabled. */
export function normalizeProviderName(name: string | null | undefined): string {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

/** Best public-provider row for a withdrawal/payment-method label (e.g. "WAAFI WALLET"). */
export function pickProviderForFilter<
  T extends { provider_name?: string; provider?: string },
>(providers: T[], filterName: string): T | null {
  const term = normalizeProviderName(filterName);
  if (!term || !providers.length) return null;

  let best: T | null = null;
  let bestScore = 0;

  for (const p of providers) {
    const name = normalizeProviderName(p.provider_name);
    const prov = normalizeProviderName(p.provider);
    let score = 0;
    if (name === term || prov === term) score = 100;
    else if (name.includes(term) || term.includes(name) || prov.includes(term) || term.includes(prov)) {
      score = 70;
    } else {
      const tokens = term.split(" ").filter(Boolean);
      if (tokens.length > 0 && tokens.every((t) => name.includes(t) || prov.includes(t))) {
        score = 50;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      best = p;
    }
  }

  return bestScore >= 50 ? best : null;
}

export function formatAutoSendMethodLabel(detail: Record<string, unknown>): string {
  const provider =
    String(
      detail.payment_provider_name ||
        detail.provider_name ||
        detail.payment_method_name ||
        "Payment method"
    ).trim() || "Payment method";

  const identifier = maskPaymentIdentifier(
    String(detail.wallet_address || detail.account_number || "")
  );

  return identifier ? `${provider} (${identifier})` : provider;
}

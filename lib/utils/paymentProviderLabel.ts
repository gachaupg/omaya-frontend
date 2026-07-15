/**
 * Strip payment-method type suffixes from provider labels.
 * e.g. "eDahab - Mobile" → "eDahab", "SAHAL Golis - Marchant" → "SAHAL Golis"
 */
const METHOD_TYPE_SUFFIX_RE =
  /\s*-\s*(Bank|Mobile|Crypto|Forex|Marchant|Merchant|Money\s*Transfer)\s*$/i;

export function stripPaymentMethodTypeSuffix(name: string): string {
  const trimmed = String(name || "").trim();
  if (!trimmed) return "";
  return trimmed.replace(METHOD_TYPE_SUFFIX_RE, "").trim() || trimmed;
}

/** Prefer clean `provider` field, then strip type suffix from provider_name. */
export function getCleanPaymentProviderLabel(payment: {
  provider?: string | null;
  provider_name?: string | null;
  payment_provider_name?: string | null;
  name?: string | null;
} | null | undefined): string {
  if (!payment) return "";

  const preferred = String(payment.provider || "").trim();
  if (preferred && !METHOD_TYPE_SUFFIX_RE.test(preferred)) {
    return preferred;
  }

  const raw =
    preferred ||
    String(payment.provider_name || "").trim() ||
    String(payment.payment_provider_name || "").trim() ||
    String(payment.name || "").trim();

  return stripPaymentMethodTypeSuffix(raw);
}

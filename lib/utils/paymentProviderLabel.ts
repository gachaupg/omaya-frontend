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

type PaymentLabelSource = {
  short_name?: string | null;
  provider?: string | null;
  provider_name?: string | null;
  payment_provider_name?: string | null;
  name?: string | null;
} | null | undefined;

function pickProviderName(payment: PaymentLabelSource): string {
  if (!payment) return "";
  return (
    String(payment.provider_name || "").trim() ||
    String(payment.payment_provider_name || "").trim() ||
    ""
  );
}

/** Prefer clean `provider` field, then strip type suffix from provider_name. */
export function getCleanPaymentProviderLabel(payment: PaymentLabelSource): string {
  if (!payment) return "";

  const preferred = String(payment.provider || "").trim();
  if (preferred && !METHOD_TYPE_SUFFIX_RE.test(preferred)) {
    return preferred;
  }

  const raw =
    preferred ||
    pickProviderName(payment) ||
    String(payment.name || "").trim();

  return stripPaymentMethodTypeSuffix(raw);
}

/**
 * Primary dropdown / selector label — matches mobile PaymentMethodListUi.displayTitle.
 * Prefer `short_name` (e.g. "Cop Bank"), else cleaned provider name.
 */
export function getPaymentMethodDisplayTitle(payment: PaymentLabelSource): string {
  if (!payment) return "";
  const short = String(payment.short_name || "").trim();
  if (short) return short;
  return getCleanPaymentProviderLabel(payment);
}

/**
 * Secondary dropdown / selector label — matches mobile PaymentMethodListUi.displaySubtitle.
 * Always `provider_name` (never method_display / Bank / Mobile).
 */
export function getPaymentMethodDisplaySubtitle(
  payment: PaymentLabelSource
): string {
  return stripPaymentMethodTypeSuffix(pickProviderName(payment));
}

/** Build label + subtitle for payment method select options. */
export function getPaymentMethodSelectLabels(payment: PaymentLabelSource): {
  label: string;
  subtitle?: string;
} {
  const label = getPaymentMethodDisplayTitle(payment) || "Unknown";
  const subtitle = getPaymentMethodDisplaySubtitle(payment);
  return {
    label,
    subtitle: subtitle || undefined,
  };
}

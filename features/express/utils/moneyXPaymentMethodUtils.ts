/** Coerce API payment-method fields (string | number | nested object) to plain text. */
export function coercePaymentMethodText(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value).trim();
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    return coercePaymentMethodText(
      record.method_display ??
        record.method_name ??
        record.method ??
        record.provider_name ??
        record.name ??
        record.label ??
        ""
    );
  }
  return String(value).trim();
}

export function getMoneyXPaymentMethodSearchBlob(payment: any): string {
  return [
    payment?.short_name,
    payment?.provider_name,
    payment?.provider,
    payment?.method,
    payment?.method_display,
    payment?.payment_method,
    payment?.payment_method_type,
    payment?.payment_method_name,
  ]
    .map(coercePaymentMethodText)
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

const MOBILE_MONEY_KEYWORDS = [
  "mobile",
  "mpesa",
  "m-pesa",
  "mtn",
  "airtel",
  "safaricom",
  "vodafone",
  "telesom",
  "hormuud",
  "golis",
  "evc",
  "zaad",
  "sahal",
  "edahab",
  "e-dahab",
  "marchant",
  "merchant",
];

export function isMoneyXMobilePaymentMethod(payment: any): boolean {
  const blob = getMoneyXPaymentMethodSearchBlob(payment);
  return MOBILE_MONEY_KEYWORDS.some((keyword) => blob.includes(keyword));
}

export function isMoneyXBankPaymentMethod(payment: any): boolean {
  const blob = getMoneyXPaymentMethodSearchBlob(payment);
  return blob.includes("bank");
}

export function getMoneyXProviderId(method: any): string | null {
  if (!method) return null;
  const providerId = String(
    method?.provider_id ?? method?.providerId ?? method?.id ?? ""
  ).trim();
  return providerId || null;
}

export function matchMoneyXMethodById(
  methods: any[],
  id: string | null | undefined
): any | null {
  if (!id || !Array.isArray(methods)) return null;
  return methods.find((m) => getMoneyXProviderId(m) === id) ?? null;
}

export function pickOtherMoneyXMethod(
  methods: any[],
  excludeId: string | null | undefined
): any | null {
  if (!Array.isArray(methods) || methods.length === 0) return null;
  const other = methods.find((m) => getMoneyXProviderId(m) !== excludeId);
  return other ?? methods[0] ?? null;
}

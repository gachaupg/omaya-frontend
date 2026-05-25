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

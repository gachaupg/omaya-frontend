export const DEFAULT_MONEYX_FROM_PROVIDER_ID =
  "564eabaf-14f8-4fed-a2bf-f0b57884dbfd";

export const DEFAULT_MONEYX_FROM_PROVIDER_NAME = "SALAAM SOMALI BANK";

const normalizeProviderLabel = (value: unknown) =>
  String(value ?? "")
    .replace(
      /\s*-\s*(Bank|Mobile|Crypto|Forex|Marchant|Money\s*Transfer|Merchant)\s*$/i,
      ""
    )
    .trim()
    .toUpperCase();

/** Default "From" provider for Money X — Salaam Somali Bank. */
export function pickDefaultMoneyXFromMethod(methods: any[]): any | null {
  if (!Array.isArray(methods) || methods.length === 0) return null;

  const byId = methods.find(
    (m) =>
      String(m?.provider_id ?? m?.providerId ?? "").toLowerCase() ===
      DEFAULT_MONEYX_FROM_PROVIDER_ID
  );
  if (byId) return byId;

  const byName = methods.find((m) => {
    const name = normalizeProviderLabel(
      m?.provider_name ?? m?.provider?.provider_name ?? m?.provider ?? m?.name
    );
    return (
      name === DEFAULT_MONEYX_FROM_PROVIDER_NAME ||
      name.includes("SALAAM SOMALI")
    );
  });
  if (byName) return byName;

  return methods[0] ?? null;
}

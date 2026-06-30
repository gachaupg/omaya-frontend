const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isDepositProviderUuid(value: unknown): boolean {
  return typeof value === "string" && UUID_REGEX.test(value.trim());
}

const pickProviderName = (provider: unknown): string => {
  if (!provider || typeof provider !== "object") return "";
  const row = provider as Record<string, unknown>;
  return String(
    row.provider_name ?? row.payment_provider_name ?? row.provider ?? ""
  ).trim();
};

export function normalizeProviderName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Only keys that identify a payment *provider* — never admin_payment_detail_id or numeric id. */
function readProviderUuidFromRow(row: Record<string, unknown>): string | null {
  for (const key of [
    "payment_provider_id",
    "provider_id",
    "providerId",
    "linked_bank_provider_id",
  ]) {
    const id = String(row[key] ?? "").trim();
    if (isDepositProviderUuid(id)) return id;
  }

  const linked = row.linked_bank_provider;
  if (linked && typeof linked === "object") {
    const linkedId = readProviderUuidFromRow(linked as Record<string, unknown>);
    if (linkedId) return linkedId;
  }

  return null;
}

function providerNamesMatch(a: string, b: string): boolean {
  const left = normalizeProviderName(a);
  const right = normalizeProviderName(b);
  return Boolean(left && right && left === right);
}

function findProviderIdByNameInList(
  list: unknown[] | undefined,
  providerName: string
): string | null {
  if (!Array.isArray(list) || !providerName.trim()) return null;

  for (const row of list) {
    if (!row || typeof row !== "object") continue;
    const record = row as Record<string, unknown>;
    const name = pickProviderName(record);
    if (!providerNamesMatch(name, providerName)) continue;
    const id = readProviderUuidFromRow(record);
    if (id) return id;
  }

  return null;
}

/** Flatten wallet-list / payment-provider rows into catalog entries with provider_id when present. */
export function flattenPaymentProviderCatalogRows(
  list?: unknown[]
): Record<string, unknown>[] {
  if (!Array.isArray(list)) return [];

  const out: Record<string, unknown>[] = [];

  for (const item of list) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;

    if (readProviderUuidFromRow(row)) {
      out.push(row);
      continue;
    }

    const detail = row.admin_payment_detail;
    if (detail && typeof detail === "object") {
      const detailRecord = detail as Record<string, unknown>;
      const providerId = readProviderUuidFromRow(row);
      if (providerId) {
        out.push({
          ...detailRecord,
          provider_id: providerId,
          provider_name:
            detailRecord.provider_name ?? row.provider_name ?? "",
        });
      }
    }
  }

  return out;
}

function findProviderIdInPublicMethods(
  publicMethodsData: unknown,
  providerName: string
): string | null {
  const target = normalizeProviderName(providerName);
  if (!target) return null;

  const root =
    publicMethodsData &&
    typeof publicMethodsData === "object" &&
    "data" in (publicMethodsData as object)
      ? (publicMethodsData as { data?: unknown }).data
      : publicMethodsData;

  const tryMatch = (provider: unknown): string | null => {
    if (!provider || typeof provider !== "object") return null;
    const name = normalizeProviderName(pickProviderName(provider));
    if (!name || name !== target) return null;
    return readProviderUuidFromRow(provider as Record<string, unknown>);
  };

  const providers = (root as { providers?: unknown[] })?.providers;
  if (Array.isArray(providers)) {
    for (const provider of providers) {
      const id = tryMatch(provider);
      if (id) return id;
    }
  }

  const paymentMethods = (root as { payment_methods?: unknown[] })?.payment_methods;
  if (Array.isArray(paymentMethods)) {
    for (const method of paymentMethods) {
      const nested = (method as { providers?: unknown[] })?.providers;
      if (!Array.isArray(nested)) continue;
      for (const provider of nested) {
        const id = tryMatch(provider);
        if (id) return id;
      }
    }
  }

  return null;
}

export type PaymentProviderIdLookup = {
  providerName?: string;
  publicMethodsData?: unknown;
  providerList?: unknown[];
  /** `/administration/admin/payment-providers/` — rows include `provider_id`. */
  adminPaymentProviders?: unknown[];
  /** `/administration/admin/wallet-list/` — may be flat or nested; matched by `provider_name`. */
  adminWalletProviders?: unknown[];
};

/** UUID for POST /trading_engine/deposits/ `payment_provider_id` (optional on API). */
export function resolvePaymentProviderId(
  provider: unknown,
  lookup?: PaymentProviderIdLookup
): string | null {
  if (provider && typeof provider === "object") {
    const direct = readProviderUuidFromRow(provider as Record<string, unknown>);
    if (direct) return direct;
  }

  const providerName =
    lookup?.providerName?.trim() || pickProviderName(provider);
  if (!providerName) return null;

  const adminPaymentCatalog = flattenPaymentProviderCatalogRows(
    lookup?.adminPaymentProviders
  );
  const adminWalletCatalog = flattenPaymentProviderCatalogRows(
    lookup?.adminWalletProviders
  );

  const searchLists: unknown[][] = [
    lookup?.providerList,
    adminPaymentCatalog.length > 0 ? adminPaymentCatalog : undefined,
    adminWalletCatalog.length > 0 ? adminWalletCatalog : undefined,
  ].filter((list): list is unknown[] => Array.isArray(list) && list.length > 0);

  for (const list of searchLists) {
    const id = findProviderIdByNameInList(list, providerName);
    if (id) return id;
  }

  if (lookup?.publicMethodsData) {
    return findProviderIdInPublicMethods(
      lookup.publicMethodsData,
      providerName
    );
  }

  return null;
}

/** Attach payment_provider_id when resolvable; omit field otherwise (backend treats as optional). */
export function withOptionalPaymentProviderId<T extends Record<string, unknown>>(
  payload: T,
  provider: unknown,
  lookup?: PaymentProviderIdLookup
): T & { payment_provider_id?: string } {
  const paymentProviderId = resolvePaymentProviderId(provider, lookup);
  if (!paymentProviderId) return payload;
  return { ...payload, payment_provider_id: paymentProviderId };
}

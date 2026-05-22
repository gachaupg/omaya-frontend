import { get, post, del } from "@/lib/apiClient";
import { API_CONFIG } from "@/lib/appConfig";

export interface BookmarkedAddress {
  id: string;
  address: string;
  label?: string;
  network: string;
  asset: string;
  created_at?: string;
}

export interface CreateBookmarkPayload {
  address: string;
  label?: string;
  network: string;
  asset: string;
}

export function getDefaultBookmarkLabel(
  asset?: string,
  kind: "wallet" | "account" = "wallet"
): string {
  const ticker = String(asset || "").trim().toUpperCase();
  if (!ticker) return kind === "account" ? "My account" : "My wallet";
  return kind === "account" ? `My ${ticker} account` : `My ${ticker} wallet`;
}

const BOOKMARK_FIELD_LABELS: Record<string, string> = {
  address: "Address",
  label: "Label",
  network: "Network",
  asset: "Asset",
  non_field_errors: "Error",
  __all__: "Error",
};

function collectErrorStrings(value: unknown): string[] {
  if (value == null) return [];
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? [trimmed] : [];
  }
  if (Array.isArray(value)) {
    return value.flatMap(collectErrorStrings);
  }
  if (typeof value === "object") {
    return Object.values(value as Record<string, unknown>).flatMap(
      collectErrorStrings
    );
  }
  return [];
}

/** Parse API body like `{ "address": ["Invalid USDT/BSC address checksum."] }`. */
export function formatBookmarkApiErrors(data: unknown): string | null {
  if (data == null) return null;
  if (typeof data === "string") {
    const trimmed = data.trim();
    return trimmed || null;
  }
  if (Array.isArray(data)) {
    const msgs = collectErrorStrings(data);
    return msgs.length ? msgs.join(" ") : null;
  }
  if (typeof data !== "object") return null;

  const obj = data as Record<string, unknown>;
  const parts: string[] = [];

  const detail = collectErrorStrings(obj.detail);
  if (detail.length) parts.push(...detail);

  const message = collectErrorStrings(obj.message);
  if (message.length) parts.push(...message);

  if (obj.error != null) {
    parts.push(...collectErrorStrings(obj.error));
  }

  const fieldKeys = Object.keys(obj).filter(
    (key) => !["detail", "message", "error"].includes(key)
  );
  const fieldMessages: string[] = [];
  for (const key of fieldKeys) {
    fieldMessages.push(...collectErrorStrings(obj[key]));
  }

  if (fieldMessages.length === 1 && parts.length === 0) {
    return fieldMessages[0];
  }

  for (const key of fieldKeys) {
    const msgs = collectErrorStrings(obj[key]);
    if (!msgs.length) continue;
    const label =
      BOOKMARK_FIELD_LABELS[key] ||
      key.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
    for (const msg of msgs) {
      parts.push(`${label}: ${msg}`);
    }
  }

  const unique = [...new Set(parts.filter(Boolean))];
  return unique.length ? unique.join(" · ") : null;
}

/** DRF / axios error → human-readable message */
export function getBookmarkApiErrorMessage(err: unknown): string | null {
  const e = err as { response?: { data?: unknown }; message?: string };
  const fromBody = formatBookmarkApiErrors(e?.response?.data);
  if (fromBody) return fromBody;
  if (typeof e?.message === "string" && e.message.trim()) {
    const trimmed = e.message.trim();
    if (!/^request failed with status code \d+$/i.test(trimmed)) {
      return trimmed;
    }
  }
  return null;
}

export function isBookmarkAuthError(err: unknown): boolean {
  const e = err as { response?: { status?: number } };
  const status = e?.response?.status;
  if (status === 401 || status === 403) return true;
  const msg = (getBookmarkApiErrorMessage(err) || "").toLowerCase();
  return (
    msg.includes("authentication credentials were not provided") ||
    msg.includes("not authenticated") ||
    msg.includes("credentials were not provided")
  );
}

/** Coerce API / nested shapes into a stable bookmark row (avoids render crashes on save). */
export function normalizeBookmarkedAddress(
  raw: unknown,
  fallback?: Partial<CreateBookmarkPayload>
): BookmarkedAddress | null {
  if (raw == null) return null;

  let record: Record<string, unknown>;
  if (typeof raw === "object" && !Array.isArray(raw)) {
    const obj = raw as Record<string, unknown>;
    const nested =
      obj.data && typeof obj.data === "object" && !Array.isArray(obj.data)
        ? (obj.data as Record<string, unknown>)
        : obj.bookmark && typeof obj.bookmark === "object" && !Array.isArray(obj.bookmark)
          ? (obj.bookmark as Record<string, unknown>)
          : null;
    record = nested ?? obj;
  } else {
    return null;
  }

  const address = String(
    record.address ?? record.wallet_address ?? fallback?.address ?? ""
  ).trim();
  if (!address) return null;

  const idRaw =
    record.id ?? record.bookmark_id ?? record.pk ?? record.user_wallet_address_id;
  const id =
    idRaw != null && String(idRaw).trim()
      ? String(idRaw)
      : `tmp-${address.slice(0, 8)}-${Date.now()}`;

  return {
    id,
    address,
    label:
      record.label != null
        ? String(record.label)
        : fallback?.label,
    network: String(
      record.network ?? record.network_type ?? fallback?.network ?? ""
    ),
    asset: String(record.asset ?? record.currency ?? fallback?.asset ?? ""),
    created_at:
      record.created_at != null ? String(record.created_at) : undefined,
  };
}

function normalizeBookmarkList(data: unknown): BookmarkedAddress[] {
  const rows: unknown[] = Array.isArray(data)
    ? data
    : (() => {
        const obj = data as Record<string, unknown>;
        const arr = obj?.results ?? obj?.data;
        return Array.isArray(arr) ? arr : [];
      })();

  return rows
    .map((row) => normalizeBookmarkedAddress(row))
    .filter((b): b is BookmarkedAddress => b != null);
}

export const bookmarkedAddressesApi = {
  /** GET /api/wallet/bookmarked-addresses/?asset=USDT&network=bsc */
  list: async (params?: { asset?: string; network?: string }): Promise<BookmarkedAddress[]> => {
    const searchParams = new URLSearchParams();
    if (params?.asset) searchParams.append("asset", params.asset);
    if (params?.network) searchParams.append("network", params.network);
    const query = searchParams.toString();
    const url =
      API_CONFIG.WALLET.BOOKMARKED_ADDRESSES + (query ? `?${query}` : "");
    const res = await get<unknown>(url);
    return normalizeBookmarkList(res.data);
  },

  /** POST /api/wallet/bookmarked-addresses/ */
  create: async (payload: CreateBookmarkPayload): Promise<BookmarkedAddress> => {
    const res = await post<unknown>(
      API_CONFIG.WALLET.BOOKMARKED_ADDRESSES,
      payload
    );
    const normalized = normalizeBookmarkedAddress(res.data, payload);
    if (normalized) return normalized;
    throw new Error("Invalid response when saving bookmarked address");
  },

  /** DELETE /api/wallet/bookmarked-addresses/{id}/ */
  delete: async (bookmarkId: string): Promise<void> => {
    await del(API_CONFIG.WALLET.BOOKMARKED_ADDRESS(bookmarkId));
  },
};

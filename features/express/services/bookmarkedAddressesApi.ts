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

export const bookmarkedAddressesApi = {
  list: async (params?: { asset?: string; network?: string }): Promise<BookmarkedAddress[]> => {
    const searchParams = new URLSearchParams();
    if (params?.asset) searchParams.append("asset", params.asset);
    if (params?.network) searchParams.append("network", params.network);
    const query = searchParams.toString();
    const url = API_CONFIG.WALLET.BOOKMARKED_ADDRESSES + (query ? `?${query}` : "");
    const res = await get<unknown>(url);
    const data = res.data as unknown;
    if (Array.isArray(data)) return data;
    const obj = data as Record<string, unknown>;
    const arr = (obj?.results ?? obj?.data) as BookmarkedAddress[] | undefined;
    return Array.isArray(arr) ? arr : [];
  },

  create: async (payload: CreateBookmarkPayload): Promise<BookmarkedAddress> => {
    const res = await post<BookmarkedAddress>(API_CONFIG.WALLET.BOOKMARKED_ADDRESSES, payload);
    return res.data;
  },

  delete: async (bookmarkId: string): Promise<void> => {
    await del(API_CONFIG.WALLET.BOOKMARKED_ADDRESS(bookmarkId));
  },
};

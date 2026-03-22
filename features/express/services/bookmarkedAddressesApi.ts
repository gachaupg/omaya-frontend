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

/** DRF-style `{ "detail": "..." }` or string detail */
export function getBookmarkApiErrorMessage(err: unknown): string | null {
  const e = err as { response?: { data?: unknown }; message?: string };
  const data = e?.response?.data as Record<string, unknown> | string | undefined;
  if (data && typeof data === "object" && !Array.isArray(data)) {
    const d = data.detail;
    if (typeof d === "string" && d.trim()) return d.trim();
    if (Array.isArray(d) && typeof d[0] === "string") return d[0].trim();
    const msg = data.message;
    if (typeof msg === "string" && msg.trim()) return msg.trim();
  }
  if (typeof e?.message === "string" && e.message.trim()) return e.message.trim();
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

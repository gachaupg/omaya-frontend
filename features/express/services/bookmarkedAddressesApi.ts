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

export const bookmarkedAddressesApi = {
  list: async (params?: { asset?: string; network?: string }): Promise<BookmarkedAddress[]> => {
    try {
      const searchParams = new URLSearchParams();
      if (params?.asset) searchParams.append("asset", params.asset);
      if (params?.network) searchParams.append("network", params.network);
      const query = searchParams.toString();
      const url = API_CONFIG.WALLET.BOOKMARKED_ADDRESSES + (query ? `?${query}` : "");
      const res = await get<{ results?: BookmarkedAddress[]; data?: BookmarkedAddress[] }>(url);
      const data = res?.data;
      if (!data) return [];
      return Array.isArray(data) ? data : (data?.results || data?.data || []);
    } catch {
      return [];
    }
  },

  create: async (payload: CreateBookmarkPayload): Promise<BookmarkedAddress> => {
    const res = await post<BookmarkedAddress>(API_CONFIG.WALLET.BOOKMARKED_ADDRESSES, payload);
    if (!res?.data) throw new Error("Failed to save bookmark — no data returned");
    return res.data;
  },

  delete: async (bookmarkId: string): Promise<void> => {
    await del(API_CONFIG.WALLET.BOOKMARKED_ADDRESS(bookmarkId));
  },
};

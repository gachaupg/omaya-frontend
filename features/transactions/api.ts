import { get } from "@/lib/apiClient";
import { withRetry } from "@/lib/utils/retry";
import { API_CONFIG } from "@/lib/appConfig";

export interface AllTransactionItem {
  id: string;
  type: "moneyx" | "exchange" | "p2p" | "swap";
  sub_type: string;
  amount: string;
  currency: string;
  asset: string;
  asset_name: string | null;
  asset_image: string | null;
  network: string | null;
  status: string;
  commission: string;
  net_amount: string;
  created_at: string;
  updated_at: string;
  deposit_address: string | null;
  withdrawal_address: string | null;
  transaction_hash: string | null;
  screenshot: string | null;
  reason: string | null;
  sender_provider?: string;
  receiver_provider?: string;
  recipient_name?: string;
  recipient_account?: string | null;
  from_currency?: string;
  from_network?: string;
  to_currency?: string;
  to_network?: string;
  to_amount?: string;
}

export interface AllTransactionsResponse {
  count: number;
  total_pages: number;
  current_page: number;
  page_size: number;
  next: string | null;
  previous: string | null;
  results: AllTransactionItem[];
}

export const getAllUserTransactions = async (
  params?: { type?: string; page?: number; page_size?: number }
): Promise<AllTransactionsResponse> => {
  return withRetry(async () => {
    const searchParams = new URLSearchParams();
    searchParams.set("type", params?.type ?? "all");
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.page_size) searchParams.set("page_size", String(params.page_size));

    const url = `${API_CONFIG.P2P.USER_ALL_TRANSACTIONS}?${searchParams.toString()}`;
    const response = await get<AllTransactionsResponse>(url);
    return response.data;
  });
};

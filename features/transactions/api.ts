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
  /** Unit price in USD (P2P / exchange) when provided by API */
  price?: string | null;
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
  from_asset?: string;
  to_asset?: string;
  from_asset_logo?: string | null;
  to_asset_logo?: string | null;
  sender_provider_logo?: string | null;
  receiver_provider_logo?: string | null;
  payment_method?: {
    provider?: string;
    account_name?: string;
    account_number?: string;
    logo_url?: string | null;
  };
  from_address?: string | null;
  to_address?: string | null;
  payout_hash?: string | null;
  referral_withdrawal_id?: string | null;
  withdrawal_id?: string | null;
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
    searchParams.set("page", String(params?.page ?? 1));
    searchParams.set("page_size", String(params?.page_size ?? 50));

    const url = `${API_CONFIG.P2P.USER_ALL_TRANSACTIONS}?${searchParams.toString()}`;
    const response = await get<AllTransactionsResponse>(url);
    return response.data;
  });
};

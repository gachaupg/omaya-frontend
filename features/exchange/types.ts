/**
 * types.ts – auto‑generated placeholder
 */
export interface ApiError {
  message: string;
  status?: number;
  data?: any;
}

export interface Network {
  network_id: string;
  network_type: string;
  deposit_fee: string;
  withdrawal_fee: string;
  logo: string;
}

export interface RangeCommission {
  range_commission_network_id: string;
  range_min: string;
  range_max: string;
  commission: string;
  commission_type: "deposit" | "withdrawal";
}

export interface Asset {
  asset_id: string;
  symbol: string;
  ticker?: string;
  description: string;
  asset_image: string;
  network?: string;
  networks: Network[];
  range_commissions: RangeCommission[];
  admin_accounts: AdminPaymentDetail[];
  name: string;
}

export interface AssetsResponse {
  total_wallet_balance: string;
  assets: Asset[];
}

export interface FavoriteAsset {
  favorite_asset_id: string;
  asset_symbol: string;
  asset_name?: string;
  asset_image: string;
  network?: string;
  percentage?: string;
  price?: string;
  added_on: string;
}

export interface AddFavoritePayload {
  asset_symbol: string;
  asset_name: string;
  asset_image: string;
  network: string;
  percentage: string;
  price: string;
}

export interface RemoveFavoritePayload {
  favorite_asset_id: string;
}

/** @deprecated Use AddFavoritePayload / RemoveFavoritePayload */
export interface ManageFavoritePayload {
  asset_id: string;
}

export interface ManageFavoriteResponse {
  id?: string;
  asset?: {
    id: string;
    name: string;
    symbol: string;
  };
  created_at?: string;
  message: string;
}

// Transaction Types
export interface Transaction {
  transaction_id: string;
  amount: number;
  currency: string;
  status: string;
  stages: string;
  transaction_harsh: string | null;
  payment_method: string;
  payment_provider: string;
  account_name: string;
  account_number: string;
  transaction_type: "deposit" | "withdrawal";
  timestamp: string;
  additional_info: string;
  screenshot: string | null;
  reason: string | null;
  user_id: number;
  total_amount: number;
  user_email: string;
  user_names: string;
  withdrawal_address: string | null;
  commission: number;
  assigned_to: string[];
}

// Deposit Response Types
export interface DepositWebSocketInfo {
  url: string;
  protocols: string[];
  parameters: {
    tx_id: string;
  };
}

export interface DepositResponse {
  status: string;
  type: string;
  asset: string;
  amount: string;
  net_amount: string;
  network: string;
  deposit_address: string | null;
  message: string;
  websocket_url: string;
  transaction_id: string;
  deposit_code: string;
  fees: {
    commission: string;
    network_fee: string;
    total_fees: string;
  };
  // Legacy fields for backward compatibility
  requested_amount?: string;
  total_amount_due?: string;
  commission?: string;
  network_fee?: string;
  currency?: string;
  requires_manual_review?: boolean;
  bank_confirmed?: boolean;
  admin_approved?: boolean;
  websocket?: DepositWebSocketInfo;
  instructions?: string;
}

export type TransactionsResponse = Transaction[];

export interface TransactionSearchParams {
  search?: string;
  page?: number;
  status?: string;
  transaction_type?: string;
  start_date?: string;
  end_date?: string;
}

// Exchange stats
export interface ExchangeStatistics {
  total_pending_exchange_deposits: number;
  total_pending_exchange_withdrawals: number;
  total_approved_exchange_deposits: number;
  total_approved_exchange_withdrawals: number;
  total_approved_exchange_combined?: number; // Deprecated, use total_approved_exchange_net
  total_approved_exchange_net?: number;
  total_approved_exchange_volume?: number;
  total_pending_p2p_deposits?: number;
  total_pending_p2p_withdrawals?: number;
  total_approved_p2p_deposits?: number;
  total_approved_p2p_withdrawals?: number;
  total_approved_p2p_combined?: number; // Deprecated, use total_approved_p2p_net
  total_approved_p2p_net?: number;
  total_approved_p2p_volume?: number;
  total_approved_all?: number; // Deprecated, use total_approved_volume
  total_approved_volume?: number;
  total_approved_net?: number;
  total_buy_orders_by_status?: {
    pending: number;
    completed: number;
    canceled: number;
    offline: number;
  };
  total_sell_orders_by_status?: {
    pending: number;
    completed: number;
    canceled: number;
    offline: number;
  };
  total_buy_orders?: number;
  total_sell_orders?: number;
  total_p2p_orders?: number;
  total_trades?: number;
  avg_release_time?: string;
  avg_payment_time?: string;
  rating?: string;
  total_volume?: string;
  total_pending_changenow_swaps?: number;
  total_completed_changenow_swaps?: number;
  total_failed_changenow_swaps?: number;
  total_changenow_swaps?: number;
  created?: string;
}

export interface DepositTransactionPayload {
  requested_amount: string | number;
  deposit_address: string;
  payment_provider: string;
  payment_method: string;
  additional_info?: string;
  currency: string;
  network: string;
  asset: string;
  sent_from?: string;
  screenshot?: File;
}

export interface WithdrawalFormData {
  requested_amount: number | string;
  payment_provider: string;
  payment_method: string;
  additional_info?: string;
  network: string;
  asset: string;
  user_payment_detail_id: string;
  currency: string;
  screenshot?: File;
}

// paymentTypes
export interface PaymentMethod {
  payment_method_id: string;
  name: string;
}

export interface PaymentProvider {
  provider_id: string;
  provider_name: string;
  method: string;
  logo: string;
}

export interface UserPaymentDetail {
  id: number;
  provider_name: string;
  payment_method_name: string;
  payment_provider_name: string;
  account_name: string;
  account_number: string;
  wallet_address?: string;
}

export interface AdminWallet {
  admin_wallet_id: string;
  currency: string;
  balance: string;
  created_on: string;
  last_updated: string;
}

export interface AdminPaymentDetail {
  admin_payment_detail_id: string;
  provider_name: string;
  payment_method: string;
  payment_type: string;
  account_name: string;
  account_number: string;
  mobile_number: string;
  wallet_address: string;
  how_to_send: string;
  account_type: string;
  asset: string;
  network: string;
  wallets: AdminWallet[];
}

export interface CreatePaymentMethodData {
  name: string;
}

export interface CreatePaymentProviderData {
  provider_name: string;
  logo: File;
}

export interface AddUserPaymentDetailData {
  provider_name: string;
  account_name: string;
  account_number: string;
  wallet_address?: string;
}

// Admin Wallet List Types
export interface AdminWalletPaymentDetail {
  asset: string | null;
  network: string | null;
  payment_type: string;
  account_name: string;
  provider_name: string;
  provider_logo: string | null;
  account_number: string | null;
  mobile_number: string | null;
  wallet_address: string | null;
  how_to_send: string | null;
  account_type: string;
}

export interface AdminWalletListItem {
  admin_wallet_id: string;
  currency: string;
  balance: number;
  created_on: string;
  last_updated: string;
  admin_payment_detail_id: string;
  admin_payment_detail: AdminWalletPaymentDetail;
}

export interface AdminWalletListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: AdminWalletListItem[];
}

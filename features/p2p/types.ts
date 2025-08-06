/**
 * types.ts – auto‑generated placeholder
 */

/**
 * P2P feature type definitions
 */

import { ReactNode } from "react";

export interface Tab {
  id: string;
  label: string;
  path?: string;
}

export interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export type TransactionType = {
  id: string;
  type: string | ReactNode;
  date: string;
  amount: string | ReactNode;
  status: string | ReactNode;
  asset: string;
  assetSymbol: string;
  rate?: string;
  payment?: { bank: string; logo: string } | { bank: string; logo: string }[];
  username?: string;
  rating?: string;
  comment?: string;
  limit?: string;
  price?: string;
  commission?: string;
  lastUpdate?: string;
  payment_details?: Array<any>;
};

export interface TransactionType1 {}

export type Network = "TRON" | "ETH" | "BSC";
export type Currency = "USDT" | "BTC" | "ETH";
export type WalletType = "USDT" | "BTC" | "ETH" | "withdraw";
export type ApprovalStatus = "pending" | "approved" | "rejected";
export type TransactionStage =
  | "pending_review"
  | "transaction_review"
  | "admin_review"
  | "completed"
  | "rejected";

// Deposit Types
export interface CreateP2PDepositRequest {
  amount: number;
  currency: Currency;
  network: Network;
  wallet_type: WalletType;
  document: File;
}

export interface P2PDeposit {
  id: string;
  transaction_type: "Deposit";
  receiver_id: number;
  amount: number;
  currency: Currency;
  network: Network;
  wallet_type: WalletType;
  timestamp: string;
  approved: ApprovalStatus;
  assigned_to: Array<{
    name: string;
    photo: string;
  }>;
}

// Withdrawal Types
export interface WithdrawalFormData {
  amount: string;
  file: File | null;
  confirmPayment: boolean;
  walletAddress: string;
  binance_address: string;
}

export interface CreateP2PWithdrawRequest {
  amount: number;
  currency: Currency;
  network: Network;
  wallet_type: WalletType;
  receiver_wallet: string;
  // binance_address: string;
}

export interface P2PWithdraw {
  id: string;
  transaction_type: "withdraw";
  amount: number;
  currency: Currency;
  network: Network;
  wallet_type: WalletType;
  receiver_wallet: string;
  timestamp: string;
  approved: ApprovalStatus;
  assigned_to: Array<{
    name: string;
    photo: string;
  }>;
}

// Common Response Types
export interface P2PResponse {
  id: string;
  amount: number;
  currency: Currency;
  network: Network;
  wallet_type: WalletType;
  timestamp: string;
  user?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    user_type: string;
    referral_code: string;
  };
  profile?: {
    date_of_birth: string | null;
    country: string | null;
    photo: string;
  };
}

export interface WithdrawalResponse {
  message: string;
  withdrawal_id: string;
  amount: string;
}

export interface P2PListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Array<P2PDeposit | P2PWithdraw>;
}

// P2P Ad Types
export interface P2PAdvertiser {
  id: number;
  username: string;
  email: string;
}

export interface CreateP2PAdRequest {
  order_type: string;
  currency: Currency;
  amount: string;
  min_order_amount: string;
  max_order_amount: string;
  commission_rate: string;
  exchange_rate: string;
  payment_method_name: string;
  payment_provider_name: string;
  account_number: string;
  account_name: string;
  limit: string;
  completion_time: string;
  completion_rate: string;
  asset: Network;
  advertiser_name: P2PAdvertiser;
  auto_reply: string;
  terms_and_conditions: string;
  payment_details_ids: number[];
}

export interface P2PAd extends CreateP2PAdRequest {
  id: string;
  created_at: string;
  updated_at: string;
  status: ApprovalStatus;
}

export interface AssetNetwork {
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
  commission_type: string;
}

export interface AdminWallet {
  admin_wallet_id: string;
  currency: string;
  balance: string;
  created_on: string;
  last_updated: string;
}

export interface AdminAccount {
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
  asset?: string;
  network?: string;
  wallets: AdminWallet[];
}

export interface Asset {
  asset_id: string;
  symbol: string;
  description: string;
  asset_image: string | null;
  networks: AssetNetwork[];
  range_commissions: RangeCommission[];
  admin_accounts: AdminAccount[];
}

export interface AssetsResponse {
  total_wallet_balance: string;
  assets: Asset[];
}

export interface Wallet {
  id: number;
  currency: string;
  balance: string;
  deposit_address: string;
  created_on: string;
}

export interface PaymentDetail {
  id: number;
  provider: string;
  payment_method: string;
  account_name: string;
  account_number: string;
}

export interface P2POrder {
  id: string;
  advertiser_first_name: string;
  advertiser_last_name: string;
  advertiser_email: string;
  asset: string;
  order_type: "buy" | "sell";
  currency: string;
  amount: string;
  min_order_amount: string;
  max_order_amount: string;
  commission_rate: string;
  exchange_rate: string;
  status: string;
  created_on: string;
  limit_duration: string;
  completion_time: string;
  completion_rate: string | null;
  terms_and_conditions: string;
  auto_reply: string;
  user_total_sell_orders: number | null;
  user_total_buy_orders: number | null;
  total_trades_as_buyer: number;
  total_trades_as_seller: number;
  payment_details: PaymentDetail[];
  sell_order: string;
  buy_order: string;
}

export interface P2POrderList {
  next: string | null;
  previous: string | null;
  total_orders_count: number;
  results: P2POrder[];
}

export interface P2PState {
  orders: P2PBuySellResponse;
  loading: boolean;
  error: string | null;
  currentPage: number;
}

export interface P2PMyOrders {
  count: number;
  next: string | null;
  previous: string | null;
  results: {
    total_orders_count: number;
    results: P2POrder[];
  };
}

export interface OrderStatus {
  pending: number;
  completed: number;
  canceled: number;
  offline: number;
}

export interface TransactionSummary {
  total_pending_exchange_deposits: number;
  total_pending_exchange_withdrawals: number;
  total_approved_exchange_deposits: number;
  total_approved_exchange_withdrawals: number;
  total_approved_exchange_combined: number;
  total_pending_p2p_deposits: number;
  total_pending_p2p_withdrawals: number;
  total_approved_p2p_deposits: number;
  total_approved_p2p_withdrawals: number;
  total_approved_p2p_combined: number;
  total_approved_all: number;
  total_buy_orders_by_status: OrderStatus;
  total_sell_orders_by_status: OrderStatus;
  total_buy_orders: number;
  total_sell_orders: number;
  total_p2p_orders: number;
  total_trades: number;
  avg_release_time: string;
  avg_payment_time: string;
  rating: string;
  total_volume: string;
}

export interface TransactionSummaryState {
  summary: TransactionSummary | null;
  loading: boolean;
  error: string | null;
}

export interface OrderMatchRequest {
  id: string;
  advertiser_first_name: string;
  advertiser_last_name: string;
  advertiser_email: string;
  asset: string;
  order_type: "buy" | "sell";
  currency: string;
  amount: string;
  min_order_amount: string;
  max_order_amount: string;
  commission_rate: string;
  exchange_rate: string;
  status: string;
  created_on: string;
  limit_duration: string;
  completion_time: string;
  completion_rate: string | null;
  terms_and_conditions: string;
  auto_reply: string;
  user_total_sell_orders: number | null;
  user_total_buy_orders: number | null;
  total_trades_as_buyer: number;
  total_trades_as_seller: number;
  payment_details: Array<{
    id: number;
    provider: string;
    payment_method: string;
    account_name: string;
    account_number: string;
  }>;
}

export interface P2PBuySellResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: {
    total_orders_count: number;
    results: P2POrder[];
  };
}

export interface CreateAppealRequest {
  trade_id: string;
  reason_for_appeal: string;
  screenshot: string;
}

export interface AppealState {
  loading: boolean;
  error: string | null;
  success: boolean;
}

export interface MatchedTrade {
  id: string;
  buy_order: number | null;
  sell_order: number | null;
  owner: string;
  advertiser_name: string;
  auto_reply: string;
  terms_and_conditions: string;
  completion_rate: number;
  completion_time: string;
  limit: string;
  buyer: string;
  seller: string;
  price: string;
  amount: string;
  timestamp: string;
  associated_trade: number;
  order_type: "buy" | "sell";
  status: "matched" | "half-matched";
  rate: number;
  payment_details: PaymentDetail[];
}

export interface MatchedTradesResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: MatchedTrade[];
}
export interface UserTrade {
  id: string;
  buy_order: number | null;
  sell_order: number | null;
  owner: string;
  advertiser_name: string;
  auto_reply: string;
  terms_and_conditions: string;
  completion_rate: number;
  completion_time: string;
  limit: string;
  buyer: string;
  seller: string;
  price: string;
  amount: string;
  timestamp: string;
  associated_trade: number;
  order_type: string;
  status: string;
  rate: number;
  currency?: string;
  payment_details: Array<{
    provider: string;
    account_name: string;
    account_number: string;
  }>;
}

export interface UserTradesState {
  trades: {
    count: number;
    next: string | null;
    previous: string | null;
    results: UserTrade[];
  };
  loading: boolean;
  error: string | null;
  currentPage: number;
}

export interface FetchUserTradesParams {
  page: number;
  type?: string;
  status?: string;
  date?: string;
  currency?: string;
}

export interface Feedback {
  trade_id: number;
  order_id: number;
  coin: string;
  type: "buy" | "sell";
  transaction_id: number;
  amount: number;
  price: number;
  trade_status: string;
  date: string;
  is_positive: boolean;
  comment: string;
  reviewer_email: string;
  order_amount: number;
  order_type: "buy" | "sell";
}

export interface P2PTransaction {
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
  transaction_type: string;
  timestamp: string;
  additional_info: string;
  screenshot: string;
  reason: string | null;
  user_id: number;
  total_amount: number;
  user_email: string;
  user_names: string;
  withdrawal_address: string | null;
  commission: number;
  assigned_to: any[];
}

export interface P2PTransactionResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: P2PTransaction[];
}

export interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  photo: File | null;
}

export interface ReferredUser {
  id: string;
  name: string;
  email: string;
  status: string;
}

export interface ReferralWallet {
  total_earned: number;
  total_withdrawn: number;
  balance: number;
}

export interface WithdrawalAddress {
  id: number;
  address: string;
  chain: string;
  network_name: string;
  is_default: boolean;
  created_at: string;
}

export interface WithdrawalAddressDebug {
  address: string;
  chain: string;
  assigned: boolean;
  is_activated: boolean;
}

export interface WithdrawalAddressesResponse {
  status: string;
  data: WithdrawalAddress[];
  debug: {
    user_id: number;
    address_count: number;
    addresses: WithdrawalAddressDebug[];
  };
}

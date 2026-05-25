/**
 * types.ts – auto‑generated placeholder
 */

export interface BlogPost {
  id: number;
  category: string;
  title: string;
  description: string;
  image: string;
  created_at: string;
  updated_at: string;
  author_name: string;
}

export interface BlogResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: BlogPost[];
}

export interface BlogState {
  blogs: BlogPost[];
  news: BlogPost[];
  loading: boolean;
  error: string | null;
}

// Transaction types
export interface TransactionUser {
  id: number;
  name: string;
  email: string;
  photo: string | null;
}

export interface Transaction {
  transaction_type: string;
  transaction_id: string;
  user: TransactionUser;
  amount: string;
  currency: string;
  asset_image: string | null;
  total_amount_due: string;
  payment_provider: string;
  status: string;
  stages: string;
  timestamp: string;
  /** API `type`: swap | exchange | p2p | moneyx | forex */
  system_type?: string;
  /** API `sub_type` or exchange deposit/withdrawal */
  sub_type?: string;
  asset?: string;
  network?: string;
  from_network?: string;
  to_network?: string;
  from_asset?: string;
  to_asset?: string;
  // MoneyX / bank rails (institution names only on public feed)
  from_provider?: string;
  to_provider?: string;
  sender_provider?: string;
  receiver_provider?: string;
  from_provider_logo?: string | null;
  to_provider_logo?: string | null;
  sender_provider_logo?: string | null;
  receiver_provider_logo?: string | null;
  // Exchange / swap / changenow / moneyx: from/to currencies and logos
  from_currency?: string;
  to_currency?: string;
  from_asset_logo?: string | null;
  to_asset_logo?: string | null;
  // Legacy fields for backward compatibility
  source?: string;
  related_order?: string | null;
  wallet_address?: string | null;
  photo?: string | null;
  document?: string;
  requested_amount?: number;
}

export interface TransactionResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Transaction[];
}

export interface TransactionState {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  count: number;
  next: string | null;
  previous: string | null;
}

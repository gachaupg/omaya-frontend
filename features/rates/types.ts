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
  // MoneyX: destination bank/provider
  to_provider?: string;
  from_provider_logo?: string | null;
  to_provider_logo?: string | null;
  // Exchange: from/to currencies
  from_currency?: string;
  to_currency?: string;
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
}

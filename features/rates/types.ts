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
export interface AssignedTo {
  name: string;
  photo: string | null;
}

export interface Transaction {
  source: string;
  transaction_type: string;
  currency: string;
  timestamp: string;
  status: string;
  transaction_id: string;
  user: string;
  related_order: string | null;
  wallet_address: string | null;
  assigned_to: AssignedTo[];
  photo: string | null;
  document: string;
  requested_amount: number;
  total_amount_due: number;
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

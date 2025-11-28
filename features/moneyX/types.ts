/**
 * moneyX types.ts – Types for MoneyX transactions
 */

export interface CreateMoneyXTransactionPayload {
  amount: string;
  sender_provider: string;
  receiver_provider: string;
  recipient_name: string;
}

export interface UpdateMoneyXTransactionPayload {
  recipient_account_number: string;
  recipient_bank_code?: string;
}

export interface MoneyXTransaction {
  moneyx_transaction_id: string;
  amount: string;
  commission: string;
  net_amount: string;
  currency: string;
  sender_provider: string;
  sender_provider_name: string;
  receiver_provider: string;
  receiver_provider_name: string;
  recipient_name: string;
  recipient_account_number: string | null;
  recipient_bank_code: string | null;
  bank_confirmed: boolean;
  bank_confirmed_at: string | null;
  bank_confirmed_by: string | null;
  bank_confirmed_by_name: string | null;
  bank_reference: string | null;
  bank_amount_received: string | null;
  assign_to: string | null;
  assign_to_name: string | null;
  reviewer_assign: string | null;
  reviewer_assign_name: string | null;
  reference: string | null;
  status: string;
  stages: string;
  reason: string | null;
  error_message: string | null;
  requires_manual_review: boolean;
  admin_approved: boolean;
  created_at: string;
  updated_at: string;
}

export interface MoneyXState {
  transaction: MoneyXTransaction | null;
  loading: boolean;
  error: string | null;
}





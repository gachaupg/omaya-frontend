// Forex Exchange Types

export interface ForexDepositPayload {
  transaction_type: "deposit";
  from_currency: string; // USD
  from_amount: string;
  to_currency: string; // FXP
  to_amount: string;
  exchange_rate: string;
  additional_info: string;
  user_notes: string;
  user_forex_account: string;
  admin_payment_detail_id: string;
}

export interface ForexWithdrawalPayload {
  transaction_type: "withdrawal";
  user_payment_detail_id: string;
  from_currency: string; // FXP
  from_amount: string;
  to_currency: string; // USD
  to_amount: string;
  exchange_rate: string;
  additional_info: string;
  user_notes: string;
}

export interface AdminPaymentInfo {
  account_name: string;
  account_number: string;
  mobile_number: string | null;
  wallet_address: string | null;
  provider_name: string;
  payment_type: string;
  how_to_send: string | null;
}

export interface CommissionInfo {
  commission_rate: number;
  commission_amount: number;
  total_amount_to_send: number;
  currency: string;
  fxprimus_note: string;
}

export interface ForexExchangeResponse {
  id?: string;
  forex_transaction_id: string;
  transaction_id?: string; // Deprecated, use forex_transaction_id
  user_email: string;
  user_name: string;
  user_photo: string | null;
  transaction_type: "deposit" | "withdrawal";
  transaction_type_display: string;
  from_currency: string;
  from_amount: string;
  to_currency: string;
  to_amount: string;
  exchange_rate: string;
  status: string;
  status_display: string;
  status_color: string;
  stages: string;
  stage_display: string;
  can_cancel: boolean;
  can_reject: boolean;
  can_complete: boolean;
  commission_rate: string;
  commission_amount: string;
  reference_number: string | null;
  transaction_reference: string;
  additional_info?: string;
  user_forex_account?: string;
  admin_forex_account_id: string | null;
  admin_bank_account_id: string | null;
  exchange_summary: string;
  total_amount_to_send: string;
  receipt: string | null;
  receipt_url: string | null;
  bank_statement: string | null;
  bank_statement_url: string | null;
  assign_to: string | null;
  assigned_to_name: string | null;
  assigned_to_photo: string | null;
  reviewer_assign: string | null;
  reviewer_name: string | null;
  timestamp: string;
  created_at?: string; // Deprecated, use timestamp
  updated_at: string;
  processed_at: string | null;
  completed_at: string | null;
  rejection_reason: string | null;
  rejected_by: string | null;
  rejected_by_name: string | null;
  rejected_at: string | null;
  admin_notes: string | null;
  user_notes?: string;
  is_verified: boolean;
  requires_manual_review: boolean;
  admin_approved: boolean;
  user_payment_detail: string | null;
  user_payment_info: any | null;
  admin_payment_detail: string;
  admin_payment_info: AdminPaymentInfo | null;
  commission_info: CommissionInfo;
  websocket_url?: string;
}

export interface ForexState {
  currentExchange: ForexExchangeResponse | null;
  loading: boolean;
  error: string | null;
}


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

// New express withdrawal types
export interface ExpressWithdrawalPayload {
  asset: string;
  amount: string;
  network: string;
  user_payment_detail_id: string;
  counter_assigned_id?: number;
}

export interface ChangeNowSwapResponse {
  status: "awaiting_payment";
  type: "changenow_swap";
  message: string;
  transaction_id: string;
  websocket_url: string;
  details: {
    withdrawal_address: string;
    payout_address: string;
    from_currency: string;
    to_currency: string;
    to_network: string;
    estimated_amount: number;
    changenow_id: string;
  };
}

export interface DirectTransferResponse {
  status: "awaiting_payment";
  type: "direct_transfer";
  asset: string;
  amount: string;
  network: string;
  withdrawal_address: string;
  message: string;
  websocket_url: string;
  transaction_id: string;
}

export type ExpressWithdrawalResponse =
  | ChangeNowSwapResponse
  | DirectTransferResponse;

// Forex types
export interface ForexDepositPayload {
  transaction_type: "deposit";
  from_currency: string;
  from_amount: string;
  to_currency: string;
  to_amount: string;
  exchange_rate: string;
  additional_info?: string;
  user_notes?: string;
  user_forex_account?: string;
  admin_payment_detail_id: string;
}

export interface ForexWithdrawalPayload {
  transaction_type: "withdrawal";
  user_payment_detail_id: string;
  from_currency: string;
  from_amount: string;
  to_currency: string;
  to_amount: string;
  exchange_rate: string;
  additional_info?: string;
  user_notes?: string;
}

export type ForexExchangePayload = ForexDepositPayload | ForexWithdrawalPayload;

export interface ForexExchangeResponse {
  id: number;
  transaction_type: string;
  from_currency: string;
  from_amount: string;
  to_currency: string;
  to_amount: string;
  exchange_rate: string;
  status: string;
  message?: string;
}
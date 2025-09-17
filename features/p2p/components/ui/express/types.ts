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
  user_payment_detail_id: number;
}

// New express deposit types
export interface ExpressDepositPayload {
  asset: string;
  amount: string;
  network: string;
  user_payment_detail_id: number;
}

export interface ExpressDepositResponse {
  transaction_id: string;
  status: "pending";
  type: "changenow";
  asset: string;
  amount: string;
  net_amount: string;
  network: string;
  deposit_address: string;
  message: string;
  websocket_url: string;
  details: {
    from_currency: string;
    to_currency: string;
    to_network: string;
    amount: string;
    estimated_amount: string;
    deposit_address: string;
    payout_address: string;
    changenow_id: string;
    direct_transfer: boolean;
  };
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

// New P2P withdrawal types for the new API structure
export interface P2PWithdrawalRequest {
  amount: string;
  currency: string;
  network: string;
  wallet_type: string;
  receiver_wallet: string;
}

export interface P2PWithdrawalResponse {
  status: string;
  message: string;
  transaction_id?: string;
  withdrawal_address?: string;
  // Add other response fields as needed
}

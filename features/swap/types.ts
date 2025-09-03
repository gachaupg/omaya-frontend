/**
 * types.ts – auto‑generated placeholder
 */

export interface SupportedAsset {
  asset_id: string;
  symbol: string;
  name: string;
  description: string | null;
  asset_image: string | null;
  image_url: string;
  ticker: string;
  has_external_id: boolean;
  is_extra_id_supported: boolean;
  is_fiat: boolean;
  featured: boolean;
  is_stable: boolean;
  supports_fixed_rate: boolean;
  network: string;
  token_contract: string;
  can_buy: boolean;
  can_sell: boolean;
  legacy_ticker: string;
  is_changenow_asset: boolean;
}

export interface SwapEstimate {
  fromCurrency: string;
  fromNetwork: string;
  toCurrency: string;
  toNetwork: string;
  flow: string;
  type: string;
  rateId: string;
  validUntil: string;
  transactionSpeedForecast: any;
  warningMessage: any;
  depositFee: number;
  withdrawalFee: number;
  userId: any;
  fromAmount: number;
  toAmount: number;
  // Legacy fields for backward compatibility
  network?: string;
  omaya_fee_percentage?: number;
  omaya_fee?: number;
  gas_fee?: number;
  total_fee?: number;
  estimated_amount?: number;
  user_amount?: number;
  min_amount?: number;
  max_amount?: number;
}

export interface CreateSwapRequest {
  from_currency: string;
  from_network: string;
  to_currency: string;
  to_network: string;
  amount: string;
  address: string;
}

export interface CreateSwapResponse {
  fromAmount: number;
  toAmount: number;
  flow: string;
  type: string;
  payinAddress: string;
  payoutAddress: string;
  fromCurrency: string;
  toCurrency: string;
  id: string;
  directedAmount: number;
  fromNetwork: string;
  toNetwork: string;
}

export interface SwapStatus {
  id: string;
  status: string;
  from_amount: string;
  to_amount: string;
  from_currency: string;
  to_currency: string;
  from_network: string;
  to_network: string;
  from_address: string;
  to_address: string;
  created_at: string;
  updated_at: string;
  refund_address: string;
  refund_extra_id: string;
}

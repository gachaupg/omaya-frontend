/**
 * types.ts – auto‑generated placeholder
 */

export interface SupportedAsset {
  id: string;
  name: string;
  symbol: string;
  ticker: string;
  network: string;
  icon_url: string;
  image: string;
  is_fiat: boolean;
}

export interface SwapEstimate {
  network: string;
  omaya_fee_percentage: number;
  omaya_fee: number;
  gas_fee: number;
  total_fee: number;
  estimated_amount: number;
  user_amount: number;
  min_amount: number;
  max_amount: number;
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

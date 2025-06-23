export interface Asset {
  id?: string;
  name?: string;
  ticker?: string;
  image?: string;
  network?: string;
}

export interface Estimate {
  estimated_amount?: number;
  omaya_fee_percentage?: number;
  omaya_fee?: number;
  gas_fee?: number;
  total_fee?: number;
}

export interface SwapResponse {
  id?: string;
  payinAddress?: string;
}

export type SwapStep = "transaction-info" | "copy-address" | "status";

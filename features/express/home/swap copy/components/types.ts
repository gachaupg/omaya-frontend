export interface SwapResponse {
  id?: string;
  payinAddress?: string;
}

export type SwapStep = "transaction-info" | "wallet-address" | "copy-address" | "status";

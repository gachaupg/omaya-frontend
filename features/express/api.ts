import { post, get } from "@/lib/apiClient";
import { API_CONFIG } from "@/lib/appConfig";
import { API_BASE_URL } from "@/config/api";
import axios from "axios";
import { ForexExchangePayload, ForexExchangeResponse, ExpressWithdrawalPayload } from "./types";

// Map asset ticker to commission API asset name (usdt, usdc, fxprimus)
export const getCommissionApiAsset = (ticker: string): string | null => {
  const t = (ticker || "").toLowerCase();
  if (t === "usdt") return "usdt";
  if (t === "usdc") return "usdc";
  if (t === "fxp" || t === "fxprimus") return "fxprimus";
  return null;
};

interface CommissionLookupResponse {
  commission_rate: string;
  is_percentage: boolean;
  calculated_fee: string;
  range_min: string;
  range_max: string;
}

// Commission lookup API (no auth required) — returns percentage rate
export const fetchCommission = async (
  _asset: string,
  amount: number,
  type: "deposit" | "withdrawal"
): Promise<number> => {
  const url = `${API_BASE_URL}${API_CONFIG.COMMISSION_LOOKUP(amount, type)}`;
  const response = await axios.get<CommissionLookupResponse>(url);
  const rate = response.data?.commission_rate;
  return typeof rate === "number" ? rate : parseFloat(String(rate)) || 0;
};

// Express withdrawal API
export const createExpressWithdrawal = async (data: ExpressWithdrawalPayload) => {
  return post(API_CONFIG.EXPRESS.WITHDRAW, data);
};

// Express withdrawal status via websocket
export const getExpressWithdrawalStatus = (transactionId: string) => {
  return API_CONFIG.EXPRESS.SOCKETS.WITHDRAWAL_STATUS(transactionId);
};

// Cancel deposit transaction
export const cancelDepositTransaction = async (transactionId: string) => {
  return post(API_CONFIG.EXPRESS.CANCEL_DEPOSIT(transactionId), {});
};

// Cancel withdrawal transaction
export const cancelWithdrawalTransaction = async (transactionId: string) => {
  return post(API_CONFIG.EXPRESS.CANCEL_WITHDRAWAL(transactionId), {});
};

// Cancel P2P deposit transaction
export const cancelP2PDepositTransaction = async (transactionId: string) => {
  return post(API_CONFIG.EXPRESS.CANCEL_P2P_DEPOSIT(transactionId), {});
};

// Forex exchange API
export const createForexExchange = async (
  data: ForexExchangePayload
): Promise<ForexExchangeResponse> => {
  const response = await post(API_CONFIG.FOREX.CREATE_EXCHANGE, data);
  return response.data as ForexExchangeResponse;
};
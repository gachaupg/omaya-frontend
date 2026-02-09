import { post, get } from "@/lib/apiClient";
import { API_CONFIG } from "@/lib/appConfig";
import { ForexExchangePayload, ForexExchangeResponse, ExpressWithdrawalPayload } from "./types";

// Map asset ticker to commission API asset name (usdt, usdc, fxprimus)
export const getCommissionApiAsset = (ticker: string): string | null => {
  const t = (ticker || "").toLowerCase();
  if (t === "usdt") return "usdt";
  if (t === "usdc") return "usdc";
  if (t === "fxp" || t === "fxprimus") return "fxprimus";
  return null;
};

// Commission API for USDT, USDC, FX Primus
export const fetchCommission = async (
  asset: string,
  amount: number,
  type: "deposit" | "withdrawal"
): Promise<number> => {
  const response = await get<{ commission?: number; commission_amount?: number }>(
    API_CONFIG.TRADING_ENGINE.COMMISSION(asset, amount, type)
  );
  const commission = response.data?.commission ?? response.data?.commission_amount ?? 0;
  return typeof commission === "number" ? commission : parseFloat(String(commission)) || 0;
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
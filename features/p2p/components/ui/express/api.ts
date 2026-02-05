import { post, get } from "@/lib/apiClient";
import { API_CONFIG } from "@/lib/appConfig";
import { P2PWithdrawalRequest, P2PWithdrawalResponse, ExpressDepositPayload, ExpressDepositResponse } from "./types";

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
export const createExpressWithdrawal = async (data: {
  asset: string;
  amount: string;
  network: string;
  user_payment_detail_id: number;
}) => {
  return post(API_CONFIG.EXPRESS.WITHDRAW, data);
};

// Express withdrawal status via websocket
export const getExpressWithdrawalStatus = (transactionId: string) => {
  return API_CONFIG.EXPRESS.SOCKETS.WITHDRAWAL_STATUS(transactionId);
};

// New P2P withdrawal API with the specified structure
export const createP2PWithdrawal = async (data: P2PWithdrawalRequest) => {
  return post(API_CONFIG.P2P.P2P_WITHDRAW, data);
};

// Express deposit API
export const createExpressDeposit = async (data: ExpressDepositPayload): Promise<ExpressDepositResponse> => {
  const response = await post(API_CONFIG.P2P.P2P_DEPOSIT_CREATE, data);
  return response.data as ExpressDepositResponse;
};

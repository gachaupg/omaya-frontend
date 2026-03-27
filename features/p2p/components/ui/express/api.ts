import { post, get } from "@/lib/apiClient";
import { API_CONFIG } from "@/lib/appConfig";
import { API_BASE_URL } from "@/config/api";
import axios from "axios";
import { P2PWithdrawalRequest, P2PWithdrawalResponse, ExpressDepositPayload, ExpressDepositResponse } from "./types";

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

// Commission lookup API (no auth required) for P2P flow
export const fetchCommission = async (
  _asset: string,
  amount: number,
  type: "deposit" | "withdrawal"
): Promise<number> => {
  const url = `${API_BASE_URL}${API_CONFIG.COMMISSION_LOOKUP(amount, type, "p2p")}`;
  const response = await axios.get<CommissionLookupResponse>(url);
  const rate = response.data?.commission_rate;
  return typeof rate === "number" ? rate : parseFloat(String(rate)) || 0;
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

// Fetch deposit status (for polls when user sent money before hitting deposit)
// API may return status and/or stage (e.g. stage: "completed") – we normalize to status
export const fetchDepositStatus = async (
  transactionId: string
): Promise<{ status?: string } | null> => {
  const endpoints = [
    API_CONFIG.P2P.P2P_DEPOSIT_DETAIL(transactionId),
    API_CONFIG.EXCHANGE.DEPOSIT_DETAIL(transactionId),
  ];
  for (const url of endpoints) {
    try {
      const response = await get<{ status?: string; stage?: string }>(url);
      const data = response?.data as { status?: string; stage?: string } | undefined;
      if (!data) continue;
      const status = data.status ?? data.stage;
      if (status) return { status };
      return data as { status?: string };
    } catch {
      // Try next endpoint
    }
  }
  return null;
};

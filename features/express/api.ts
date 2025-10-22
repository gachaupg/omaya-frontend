import { post, get } from "@/lib/apiClient";
import { API_CONFIG } from "@/lib/appConfig";
import { ForexExchangePayload, ForexExchangeResponse, ExpressWithdrawalPayload } from "./types";

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
import { post, get } from "@/lib/apiClient";
import { API_CONFIG } from "@/lib/appConfig";
import { P2PWithdrawalRequest, P2PWithdrawalResponse, ExpressDepositPayload, ExpressDepositResponse } from "./types";

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

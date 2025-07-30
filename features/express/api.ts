import { post, get } from "../../lib/apiClient";
import { API_CONFIG } from "../../lib/appConfig";

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

import { get, post } from "@/lib/apiClient";
import { API_CONFIG } from "@/lib/appConfig";
import {
  ForexDepositPayload,
  ForexWithdrawalPayload,
  ForexExchangeResponse,
} from "../types/forex";

/**
 * Create a forex exchange (deposit or withdrawal)
 */
export const createForexExchange = async (
  payload: ForexDepositPayload | ForexWithdrawalPayload
): Promise<ForexExchangeResponse> => {
  const response = await post<ForexExchangeResponse>(
    API_CONFIG.FOREX.CREATE_EXCHANGE,
    payload
  );
  return response.data;
};

/**
 * Get forex exchange by transaction ID
 */
export const getForexExchange = async (
  transactionId: string
): Promise<ForexExchangeResponse> => {
  const response = await get<ForexExchangeResponse>(
    API_CONFIG.FOREX.GET_EXCHANGE(transactionId)
  );
  return response.data;
};


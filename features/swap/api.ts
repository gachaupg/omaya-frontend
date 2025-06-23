/**
 * api.ts – auto‑generated placeholder
 */
import { del, get, patch, post, put } from "@/lib/apiClient";
import { withRetry } from "@/lib/utils/retry";
import { API_CONFIG } from "@/lib/appConfig";
import {
  SupportedAsset,
  SwapEstimate,
  CreateSwapRequest,
  CreateSwapResponse,
  SwapStatus,
} from "./types";

export const getSupportedAssets = async (): Promise<SupportedAsset[]> => {
  return withRetry(async () => {
    const response = await get<SupportedAsset[]>(
      API_CONFIG.SWAP.SUPPORTED_ASSETS
    );
    return response.data;
  });
};

export const getEstimateSwap = async (
  fromCurrency: string,
  fromNetwork: string,
  toCurrency: string,
  toNetwork: string,
  amount: number
): Promise<SwapEstimate> => {
  return withRetry(async () => {
    const response = await get<SwapEstimate>(
      API_CONFIG.SWAP.ESTIMATE_SWAP +
        `?from_currency=${fromCurrency}&from_network=${fromNetwork}&to_currency=${toCurrency}&to_network=${toNetwork}&amount=${amount}`
    );
    return response.data;
  });
};

export const createSwap = async (
  swapData: CreateSwapRequest
): Promise<CreateSwapResponse> => {
  return withRetry(async () => {
    console.log("Creating swap with data:", swapData);
    console.log("API endpoint:", API_CONFIG.SWAP.CREATE_SWAP);

    try {
      const response = await post<CreateSwapResponse>(
        API_CONFIG.SWAP.CREATE_SWAP,
        swapData
      );
      console.log("Swap response:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("Swap creation error:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);

      // Provide user-friendly error message for 500 errors
      if (error.response?.status === 500) {
        const customError = new Error(
          "Request failed. Please try again later."
        );
        customError.name = "SwapError";
        throw customError;
      }

      throw error;
    }
  });
};

export const getSwapStatus = async (swapId: string): Promise<SwapStatus> => {
  return withRetry(async () => {
    const response = await get<SwapStatus>(
      `${API_CONFIG.SWAP.SWAP_STATUS}${swapId}/`
    );
    return response.data;
  });
};

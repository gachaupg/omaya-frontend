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
    try {
      const response = await get<SupportedAsset[]>(
        API_CONFIG.SWAP.SUPPORTED_ASSETS
      );
      return response.data;
    } catch (error: any) {
      console.error("Failed to fetch supported assets:", error);
      if (error.response?.status === 500) {
        throw new Error(
          "Server Error: Unable to fetch supported assets. Please try again later."
        );
      }
      throw error;
    }
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
    try {
      const response = await get<SwapEstimate>(
        API_CONFIG.SWAP.ESTIMATE_SWAP +
          `?from_currency=${fromCurrency}&from_network=${fromNetwork}&to_currency=${toCurrency}&to_network=${toNetwork}&amount=${amount}`
      );
      return response.data;
    } catch (error: any) {
      console.error("Failed to fetch swap estimate:", error);
      if (error.response?.status === 500) {
        throw new Error(
          "Server Error: Unable to calculate swap estimate. Please try again later."
        );
      } else if (error.response?.status === 400) {
        throw new Error("Invalid swap parameters. Please check your input.");
      }
      throw error;
    }
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

      // Provide user-friendly error messages for different status codes
      if (error.response?.status === 500) {
        throw new Error(
          "Server Error: Unable to create swap. Please try again later."
        );
      } else if (error.response?.status === 400) {
        const errorMessage =
          error.response?.data?.message ||
          "Invalid swap request. Please check your input.";
        throw new Error(`Bad Request: ${errorMessage}`);
      } else if (error.response?.status === 401) {
        throw new Error("Authentication required. Please log in to continue.");
      } else if (error.response?.status === 403) {
        throw new Error(
          "Access denied. You don't have permission to perform this action."
        );
      } else if (error.response?.status === 429) {
        throw new Error(
          "Too many requests. Please wait a moment before trying again."
        );
      } else if (error.response?.status === 422) {
        const errorMessage =
          error.response?.data?.message || "Invalid transaction data.";
        throw new Error(`Validation Error: ${errorMessage}`);
      } else if (!error.response) {
        throw new Error(
          "Network error. Please check your connection and try again."
        );
      } else {
        const errorMessage =
          error.response?.data?.message || "An unexpected error occurred.";
        throw new Error(`Error ${error.response.status}: ${errorMessage}`);
      }
    }
  });
};

export const getSwapStatus = async (swapId: string): Promise<SwapStatus> => {
  return withRetry(async () => {
    try {
      const response = await get<SwapStatus>(
        `${API_CONFIG.SWAP.SWAP_STATUS}${swapId}/`
      );
      return response.data;
    } catch (error: any) {
      console.error("Failed to fetch swap status:", error);
      if (error.response?.status === 500) {
        throw new Error(
          "Server Error: Unable to fetch swap status. Please try again later."
        );
      } else if (error.response?.status === 404) {
        throw new Error("Swap not found. Please check the swap ID.");
      }
      throw error;
    }
  });
};

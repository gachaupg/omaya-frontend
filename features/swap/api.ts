/**
 * api.ts – auto‑generated placeholder
 */
import { del, get, patch, post, put } from "@/lib/apiClient";
import { cachedGet } from "@/lib/cachedApiClient";
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
      const response = await get<{ message: string; total_changenow_tokens: number; results: SupportedAsset[] }>(
        API_CONFIG.SWAP.SUPPORTED_ASSETS,
        {
          timeout: 30000
        }
      );
      
      // Type guard to check if response.data has the expected structure
      const data = response.data as any;
      
      // Extract the results array from the ChangeNow response
      if (data && data.results) {
        return data.results;
      }
      
      // Fallback: if response is directly an array (backward compatibility)
      if (Array.isArray(data)) {
        return data;
      }
      
      return [];
    } catch (error: any) {
      // Suppress console errors for 401s
      if (error.response?.status !== 401) {
      }

      // Handle different error scenarios
      if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND" || error.message?.includes("Network Error")) {
        if (error.response?.status !== 401) {
        }
        return [];
      }

      if (error.response?.status === 500) {
        return [];
      }

      if (error.response?.status === 404) {
        return [];
      }

      // For 401 errors, silently return empty array
      if (error.response?.status === 401) {
        return [];
      }

      // For other errors, return empty array instead of throwing
      return [];
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
  // Use withRetry with reduced retries and delays for faster response
  return withRetry(async () => {
    try {
      const response = await get<SwapEstimate>(
        API_CONFIG.SWAP.ESTIMATE_SWAP +
          `?from_currency=${fromCurrency}&from_network=${fromNetwork}&to_currency=${toCurrency}&to_network=${toNetwork}&amount=${amount}`,
        {
          timeout: 10000 // 10 second timeout for estimate calls
        }
      );
      return response.data;
    } catch (error: any) {

      // Handle network errors gracefully
      if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND" || error.code === "ECONNABORTED") {
        throw new Error(
          "Network connection issue. Please check your internet connection and try again."
        );
      }

      if (error.response?.status === 500) {
        throw new Error(
          "Server Error: Unable to calculate swap estimate. Please try again later."
        );
      } else if (error.response?.status === 400) {
        throw new Error("Invalid swap parameters. Please check your input.");
      } else if (error.response?.status === 404) {
        throw new Error("Swap service not available. Please try again later.");
      }

      // For other errors, provide a generic message
      throw new Error(
        "Unable to calculate swap estimate. Please try again later."
      );
    }
  }, {
    maxRetries: 1, // Only 1 retry for estimates (faster response)
    initialDelay: 500, // Shorter delay (0.5 seconds)
    maxDelay: 1000, // Max 1 second delay
  });
};

export const createSwap = async (
  swapData: CreateSwapRequest
): Promise<CreateSwapResponse> => {
  return withRetry(async () => {

    try {
      const response = await post<CreateSwapResponse>(
        API_CONFIG.SWAP.CREATE_SWAP,
        swapData
      );
      return response.data;
    } catch (error: any) {
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
        // Silent error for 401
        throw new Error("");
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

// Helper functions for processing ChangeNow assets
export const getFilteredAssets = async (options?: {
  canBuy?: boolean;
  canSell?: boolean;
  network?: string;
  isFiat?: boolean;
  featured?: boolean;
}): Promise<SupportedAsset[]> => {
  const allAssets = await getSupportedAssets();
  
  return allAssets.filter(asset => {
    if (options?.canBuy !== undefined && asset.can_buy !== options.canBuy) return false;
    if (options?.canSell !== undefined && asset.can_sell !== options.canSell) return false;
    if (options?.network && asset.network !== options.network) return false;
    if (options?.isFiat !== undefined && asset.is_fiat !== options.isFiat) return false;
    if (options?.featured !== undefined && asset.featured !== options.featured) return false;
    return true;
  });
};

export const getAssetsByNetwork = async (network: string): Promise<SupportedAsset[]> => {
  return getFilteredAssets({ network });
};

export const getBuyableAssets = async (): Promise<SupportedAsset[]> => {
  return getFilteredAssets({ canBuy: true });
};

export const getSellableAssets = async (): Promise<SupportedAsset[]> => {
  return getFilteredAssets({ canSell: true });
};

export const getFeaturedAssets = async (): Promise<SupportedAsset[]> => {
  return getFilteredAssets({ featured: true });
};

export const getSwapHistory = async (
  params: { page?: number; limit?: number } = {}
): Promise<any> => {
  return withRetry(async () => {
    try {
      const { page = 1, limit = 10 } = params;
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      
      const response = await get<any>(
        `${API_CONFIG.SWAP.SWAP_HISTORY}?${queryParams.toString()}`
      );
      return response.data;
    } catch (error: any) {
      console.error("Failed to fetch swap history:", error);
      
      // Handle network errors gracefully
      if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
        throw new Error(
          "Network connection issue. Please check your internet connection and try again."
        );
      }

      if (error.response?.status === 500) {
        throw new Error(
          "Server Error: Unable to fetch swap history. Please try again later."
        );
      } else if (error.response?.status === 404) {
        throw new Error("Swap history not available. Please try again later.");
      } else if (error.response?.status === 401) {
        // Silent error for 401
        throw new Error("");
      }

      // For other errors, provide a generic message
      throw new Error(
        "Unable to fetch swap history. Please try again later."
      );
    }
  });
};
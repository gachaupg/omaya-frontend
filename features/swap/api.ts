/**
 * api.ts – auto‑generated placeholder
 */
import { del, get, patch, post, put } from "@/lib/apiClient";
import { cachedGet } from "@/lib/cachedApiClient";
import { withRetry } from "@/lib/utils/retry";
import { API_CONFIG } from "@/lib/appConfig";
import { logger } from '@/lib/utils/logger';

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
        logger.debug('swap', `Successfully retrieved ${data.total_changenow_tokens} ChangeNow tokens`);
        return data.results;
      }
      
      // Fallback: if response is directly an array (backward compatibility)
      if (Array.isArray(data)) {
        logger.debug('swap', `Retrieved ${data.length} supported assets`);
        return data;
      }
      
      console.warn("Unexpected response format, returning empty array");
      return [];
    } catch (error: any) {
      console.error("Failed to fetch supported assets:", error);

      // Handle different error scenarios
      if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND" || error.message?.includes("Network Error")) {
        console.warn("Network connection issue, returning empty assets list");
        return [];
      }

      if (error.response?.status === 500) {
        console.warn("Server error, returning empty assets list");
        return [];
      }

      if (error.response?.status === 404) {
        console.warn("Endpoint not found, returning empty assets list");
        return [];
      }

      // For other errors, return empty array instead of throwing
      console.warn("Unknown error, returning empty assets list");
      return [];
    }
  });
};

// Helper function to extract error message from API response
const extractErrorMessage = (errorData: any): string => {
  if (!errorData) return "";
  
  // Handle format: { "error": { "amount": ["Error message"] } }
  if (errorData.error && typeof errorData.error === 'object') {
    const errorFields = Object.entries(errorData.error);
    if (errorFields.length > 0) {
      const messages: string[] = [];
      for (const [field, value] of errorFields) {
        if (Array.isArray(value)) {
          messages.push(...value);
        } else if (typeof value === 'string') {
          messages.push(value);
        }
      }
      if (messages.length > 0) {
        return messages.join('. ');
      }
    }
  }
  
  // Handle format: { "message": "Error message" }
  if (errorData.message) {
    return errorData.message;
  }
  
  // Handle format: { "detail": "Error message" }
  if (errorData.detail) {
    return errorData.detail;
  }
  
  // Handle format: { "errors": ["Error message"] }
  if (Array.isArray(errorData.errors)) {
    return errorData.errors.join('. ');
  }
  
  return "";
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
      console.error("Error response data:", error.response?.data);

      // Handle network errors gracefully
      if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
        throw new Error(
          "Network connection issue. Please check your internet connection and try again."
        );
      }

      // Extract detailed error message from response
      const detailedError = extractErrorMessage(error.response?.data);

      if (error.response?.status === 500) {
        throw new Error(
          detailedError || "Server Error: Unable to calculate swap estimate. Please try again later."
        );
      } else if (error.response?.status === 400) {
        throw new Error(detailedError || "Invalid swap parameters. Please check your input.");
      } else if (error.response?.status === 404) {
        throw new Error(detailedError || "Swap service not available. Please try again later.");
      } else if (error.response?.status === 422) {
        throw new Error(detailedError || "Validation error. Please check your input.");
      }

      // For other errors, provide a generic message or the detailed error
      throw new Error(
        detailedError || "Unable to calculate swap estimate. Please try again later."
      );
    }
  });
};

export const getPublicEstimateSwap = async (
  fromCurrency: string,
  fromNetwork: string,
  toCurrency: string,
  toNetwork: string,
  amount: number
): Promise<SwapEstimate> => {
  return withRetry(async () => {
    try {
      const response = await get<SwapEstimate>(
        API_CONFIG.SWAP.PUBLIC_ESTIMATE_SWAP +
          `?from_currency=${fromCurrency}&from_network=${fromNetwork}&to_currency=${toCurrency}&to_network=${toNetwork}&amount=${amount}`
      );
      return response.data;
    } catch (error: any) {
      console.error("Failed to fetch public swap estimate:", error);
      console.error("Error response data:", error.response?.data);

      if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
        throw new Error(
          "Network connection issue. Please check your internet connection and try again."
        );
      }

      // Extract detailed error message from response
      const detailedError = extractErrorMessage(error.response?.data);

      if (error.response?.status === 500) {
        throw new Error(
          detailedError || "Server Error: Unable to calculate swap estimate. Please try again later."
        );
      } else if (error.response?.status === 400) {
        throw new Error(detailedError || "Invalid swap parameters. Please check your input.");
      } else if (error.response?.status === 404) {
        throw new Error(detailedError || "Swap service not available. Please try again later.");
      } else if (error.response?.status === 422) {
        throw new Error(detailedError || "Validation error. Please check your input.");
      }

      throw new Error(
        detailedError || "Unable to calculate swap estimate. Please try again later."
      );
    }
  });
};

export const createSwap = async (
  swapData: CreateSwapRequest
): Promise<CreateSwapResponse> => {
  // No withRetry - fail fast (ChangeNOW 400 = amount too small, retrying is pointless)
  logger.debug('swap', "Creating swap with data:", swapData);
  logger.debug('swap', "API endpoint:", API_CONFIG.SWAP.CREATE_SWAP);

  try {
    const response = await post<CreateSwapResponse>(
      API_CONFIG.SWAP.CREATE_SWAP,
      swapData
    );
    logger.debug('swap', "Swap response:", response.data);
    return response.data;
  } catch (error: any) {
      console.error("Swap creation error:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);

      // Build raw error string from all possible response shapes
      const rawError =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.response?.data?.detail ||
        (typeof error.response?.data === "string" ? error.response.data : "") ||
        "";
      const rawStr =
        typeof rawError === "string"
          ? rawError
          : JSON.stringify(error.response?.data || {});

      // ChangeNow 400 / "Failed to create transaction" = amount too small (do not retry)
      const isChangeNowAmountTooSmall =
        (rawStr.toLowerCase().includes("failed to create transaction") ||
          rawStr.toLowerCase().includes("changenow") ||
          rawStr.toLowerCase().includes("changenow.io")) &&
        (rawStr.includes("400") || rawStr.toLowerCase().includes("bad request"));

      if (isChangeNowAmountTooSmall) {
        throw new Error("Amount you entered is too small");
      }

      // Provide user-friendly error messages for different status codes
      if (error.response?.status === 500) {
        throw new Error(
          "Server Error: Unable to create swap. Please try again later."
        );
      } else if (error.response?.status === 400) {
        const errorMessage = typeof rawError === "string" ? rawError : rawStr || "Invalid swap request. Please check your input.";
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
        throw new Error("Authentication required. Please log in to continue.");
      }

      // For other errors, provide a generic message
      throw new Error(
        "Unable to fetch swap history. Please try again later."
      );
    }
  });
};
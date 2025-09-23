/**
 * Optimized Swap API with improved performance
 * Reduces timeouts and improves caching for ChangeNow integration
 */

import { optimizedGet, optimizedPost } from '@/lib/optimizedApiClient';
import { API_CONFIG } from '@/lib/appConfig';
import {
  SupportedAsset,
  SwapEstimate,
  CreateSwapRequest,
  CreateSwapResponse,
  SwapStatus,
} from './types';

/**
 * Optimized supported assets fetching with better caching
 */
export const getSupportedAssetsOptimized = async (): Promise<SupportedAsset[]> => {
  try {
    const response = await optimizedGet<{ 
      message: string; 
      total_changenow_tokens: number; 
      results: SupportedAsset[] 
    }>(
      API_CONFIG.SWAP.SUPPORTED_ASSETS,
      {
        apiName: 'changenow',
        useCache: true,
        cacheTTL: 10 * 60 * 1000, // 10 minutes cache for supported assets
        timeout: 8000, // 8 second timeout
      }
    );
    
    // Type guard to check if response.data has the expected structure
    const data = response.data as any;
    
    // Extract the results array from the ChangeNow response
    if (data && data.results) {
      console.log(`Successfully retrieved ${data.total_changenow_tokens} ChangeNow tokens (optimized)`);
      return data.results;
    }
    
    // Fallback: if response is directly an array (backward compatibility)
    if (Array.isArray(data)) {
      console.log(`Retrieved ${data.length} supported assets (optimized)`);
      return data;
    }
    
    console.warn("Unexpected response format, returning empty array");
    return [];
  } catch (error: any) {
    console.error("Failed to fetch supported assets (optimized):", error);

    // Handle different error scenarios gracefully
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
};

/**
 * Optimized swap estimate with better error handling and caching
 */
export const getEstimateSwapOptimized = async (
  fromCurrency: string,
  fromNetwork: string,
  toCurrency: string,
  toNetwork: string,
  amount: number
): Promise<SwapEstimate> => {
  try {
    const cacheKey = `estimate_${fromCurrency}_${fromNetwork}_${toCurrency}_${toNetwork}_${amount}`;
    
    const response = await optimizedGet<SwapEstimate>(
      API_CONFIG.SWAP.ESTIMATE_SWAP +
        `?from_currency=${fromCurrency}&from_network=${fromNetwork}&to_currency=${toCurrency}&to_network=${toNetwork}&amount=${amount}`,
      {
        apiName: 'changenow',
        useCache: true,
        cacheTTL: 30 * 1000, // 30 seconds cache for estimates
        timeout: 6000, // 6 second timeout for estimates
      }
    );
    
    return response.data;
  } catch (error: any) {
    console.error("Failed to fetch swap estimate (optimized):", error);

    // Handle network errors gracefully
    if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
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
};

/**
 * Optimized swap creation with better error handling
 */
export const createSwapOptimized = async (
  swapData: CreateSwapRequest
): Promise<CreateSwapResponse> => {
  console.log("Creating swap with data (optimized):", swapData);
  console.log("API endpoint:", API_CONFIG.SWAP.CREATE_SWAP);

  try {
    const response = await optimizedPost<CreateSwapResponse>(
      API_CONFIG.SWAP.CREATE_SWAP,
      swapData,
      {
        apiName: 'changenow',
        timeout: 30000, // 30 second timeout for swap creation
      }
    );
    
    console.log("Swap response (optimized):", response.data);
    return response.data;
  } catch (error: any) {
    console.error("Swap creation error (optimized):", error);
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
};

/**
 * Optimized swap status fetching
 */
export const getSwapStatusOptimized = async (swapId: string): Promise<SwapStatus> => {
  try {
    const response = await optimizedGet<SwapStatus>(
      `${API_CONFIG.SWAP.SWAP_STATUS}${swapId}/`,
      {
        apiName: 'changenow',
        useCache: true,
        cacheTTL: 10 * 1000, // 10 seconds cache for status
        timeout: 5000, // 5 second timeout for status
      }
    );
    
    return response.data;
  } catch (error: any) {
    console.error("Failed to fetch swap status (optimized):", error);
    
    if (error.response?.status === 500) {
      throw new Error(
        "Server Error: Unable to fetch swap status. Please try again later."
      );
    } else if (error.response?.status === 404) {
      throw new Error("Swap not found. Please check the swap ID.");
    }
    
    throw error;
  }
};

/**
 * Optimized helper functions for processing ChangeNow assets
 */
export const getFilteredAssetsOptimized = async (options?: {
  canBuy?: boolean;
  canSell?: boolean;
  network?: string;
  isFiat?: boolean;
  featured?: boolean;
}): Promise<SupportedAsset[]> => {
  const allAssets = await getSupportedAssetsOptimized();
  
  return allAssets.filter(asset => {
    if (options?.canBuy !== undefined && asset.can_buy !== options.canBuy) return false;
    if (options?.canSell !== undefined && asset.can_sell !== options.canSell) return false;
    if (options?.network && asset.network !== options.network) return false;
    if (options?.isFiat !== undefined && asset.is_fiat !== options.isFiat) return false;
    if (options?.featured !== undefined && asset.featured !== options.featured) return false;
    return true;
  });
};

export const getAssetsByNetworkOptimized = async (network: string): Promise<SupportedAsset[]> => {
  return getFilteredAssetsOptimized({ network });
};

export const getBuyableAssetsOptimized = async (): Promise<SupportedAsset[]> => {
  return getFilteredAssetsOptimized({ canBuy: true });
};

export const getSellableAssetsOptimized = async (): Promise<SupportedAsset[]> => {
  return getFilteredAssetsOptimized({ canSell: true });
};

export const getFeaturedAssetsOptimized = async (): Promise<SupportedAsset[]> => {
  return getFilteredAssetsOptimized({ featured: true });
};

/**
 * Batch operations for better performance
 */
export const getMultipleEstimatesOptimized = async (
  estimates: Array<{
    fromCurrency: string;
    fromNetwork: string;
    toCurrency: string;
    toNetwork: string;
    amount: number;
  }>
): Promise<SwapEstimate[]> => {
  try {
    // Execute all estimates in parallel for better performance
    const promises = estimates.map(estimate =>
      getEstimateSwapOptimized(
        estimate.fromCurrency,
        estimate.fromNetwork,
        estimate.toCurrency,
        estimate.toNetwork,
        estimate.amount
      ).catch(error => {
        console.error(`Failed to get estimate for ${estimate.fromCurrency}->${estimate.toCurrency}:`, error);
        return null; // Return null for failed estimates
      })
    );

    const results = await Promise.all(promises);
    return results.filter(result => result !== null) as SwapEstimate[];
  } catch (error) {
    console.error("Failed to get multiple estimates:", error);
    return [];
  }
};

/**
 * Performance test function
 */
export const testSwapApiPerformance = async (): Promise<{
  success: boolean;
  responseTime: number;
  assetsCount: number;
}> => {
  const startTime = Date.now();
  
  try {
    const assets = await getSupportedAssetsOptimized();
    const responseTime = Date.now() - startTime;
    
    return {
      success: assets.length > 0,
      responseTime,
      assetsCount: assets.length,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error("Swap API performance test failed:", error);
    
    return {
      success: false,
      responseTime,
      assetsCount: 0,
    };
  }
};


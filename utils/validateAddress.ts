/**
 * Reusable address validation utility
 * Validates cryptocurrency addresses using the ChangeNow API
 */
import { post } from "@/lib/apiClient";
import { API_CONFIG } from "@/lib/appConfig";
import { logger } from "@/lib/utils/logger";

export interface ValidateAddressRequest {
  currency: string;
  address: string;
  network: string;
}

export interface ValidateAddressResponse {
  currency: string;
  address: string;
  valid: boolean;
  is_activated: boolean | null;
  message: string | null;
  extra_id: string | null;
  raw_response: {
    isActivated: boolean | null;
    result: boolean;
    message: string | null;
  };
}

export interface ValidationResult {
  isValid: boolean;
  message: string | null;
  isActivated: boolean | null;
  error?: string;
}

/**
 * Normalize network name to lowercase format (e.g., "BSC" -> "bsc", "Ethereum" -> "eth")
 */
function normalizeNetwork(network: string | undefined | null): string {
  if (!network) return "";
  
  const networkLower = network.toLowerCase().trim();
  
  // Map common network names to standard format
  const networkMap: { [key: string]: string } = {
    "bsc": "bsc",
    "binance smart chain": "bsc",
    "binance": "bsc",
    "eth": "eth",
    "ethereum": "eth",
    "polygon": "polygon",
    "matic": "polygon",
    "polygon network": "polygon",
    "trx": "trx",
    "tron": "trx",
    "tron network": "trx",
    "arbitrum": "arbitrum",
    "arb": "arbitrum",
    "optimism": "optimism",
    "op": "optimism",
    "avalanche": "avalanche",
    "avax": "avalanche",
    "solana": "solana",
    "sol": "solana",
  };
  
  // Check if we have a mapping
  if (networkMap[networkLower]) {
    return networkMap[networkLower];
  }
  
  // Return lowercase version if no mapping found
  return networkLower;
}

/**
 * Validate a cryptocurrency address using ChangeNow API
 * @param currency - The currency code (e.g., 'btc', 'eth', 'usdt')
 * @param address - The wallet address to validate
 * @param network - The network name (e.g., 'bsc', 'eth', 'polygon')
 * @returns Promise<ValidationResult>
 */
export async function validateAddress(
  currency: string,
  address: string,
  network?: string
): Promise<ValidationResult> {
  // Basic validation - address should not be empty
  if (!address || address.trim().length === 0) {
    return {
      isValid: false,
      message: "Address cannot be empty",
      isActivated: null,
    };
  }

  // Basic length check
  if (address.trim().length < 10) {
    return {
      isValid: false,
      message: "Address seems too short",
      isActivated: null,
    };
  }

  try {
    // Get endpoint exactly as defined in config (matching pattern used in other API calls)
    const endpoint = API_CONFIG.SWAP.VALIDATE_ADDRESS;
    
    // Runtime check - ensure endpoint exists (helps catch configuration issues)
    if (!endpoint) {
      const errorMsg = "VALIDATE_ADDRESS endpoint is not defined in API_CONFIG.SWAP";
      console.error("[validateAddress]", errorMsg, {
        API_CONFIG: !!API_CONFIG,
        SWAP: !!API_CONFIG?.SWAP,
        VALIDATE_ADDRESS: API_CONFIG?.SWAP?.VALIDATE_ADDRESS,
      });
      logger.error("validateAddress", errorMsg);
      return {
        isValid: false,
        message: null,
        isActivated: null,
        error: "Validation service configuration error. Please contact support.",
      };
    }
    
    // Normalize network if provided
    const normalizedNetwork = network ? normalizeNetwork(network) : "";
    
    // Build request payload with network
    const requestPayload: ValidateAddressRequest = {
      currency: currency.toLowerCase(),
      address: address.trim(),
      network: normalizedNetwork,
    };
    
    // If network is not provided, still include it as empty string (API may require it)
    if (!normalizedNetwork) {
      logger.warn("validateAddress", "Network not provided for address validation", {
        currency,
        address: address.substring(0, 10) + "...",
      });
    }

    logger.debug("validateAddress", `Validating ${currency} address: ${address.substring(0, 10)}...`, {
      endpoint,
      baseURL: API_CONFIG.BASE_URL,
      fullURL: `${API_CONFIG.BASE_URL}${endpoint}`,
      payload: { ...requestPayload, address: `${requestPayload.address.substring(0, 10)}...` },
    });

    // Use the endpoint directly, just like other API calls in the codebase
    const response = await post<ValidateAddressResponse>(
      endpoint,
      requestPayload,
      {
        timeout: 10000, // 10 second timeout
      }
    );

    const data = response.data;

    logger.debug("validateAddress", `Validation result:`, {
      valid: data.valid,
      message: data.message,
      isActivated: data.is_activated,
    });

    return {
      isValid: data.valid || false,
      message: data.message || null,
      isActivated: data.is_activated,
    };
  } catch (error: any) {
    logger.error("validateAddress", "Validation error:", error);

    // Handle network errors
    if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
      return {
        isValid: false,
        message: null,
        isActivated: null,
        error: "Network error. Please check your connection.",
      };
    }

    // Handle API errors
    if (error.response?.status === 400) {
      const errorMessage =
        error.response?.data?.message || "Invalid address format";
      return {
        isValid: false,
        message: errorMessage,
        isActivated: null,
      };
    }

    if (error.response?.status === 500) {
      return {
        isValid: false,
        message: null,
        isActivated: null,
        error: "Server error. Please try again later.",
      };
    }

    // For other errors, return a generic message
    return {
      isValid: false,
      message: null,
      isActivated: null,
      error: "Unable to validate address. Please try again.",
    };
  }
}


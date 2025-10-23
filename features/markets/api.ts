/**
 * Markets API - CoinGecko integration for cryptocurrency market data
 */
import axios from "axios";
import {
  MarketData,
  MarketDataParams,
  MarketDataResponse,
  TopAssetsResponse,
} from "./types";
import { logger } from "@/lib/utils/logger";
import { get } from "@/lib/apiClient";

const RATE_LIMIT_DELAY = 10000;
const MAX_RETRIES = 2;
let lastRequestTime = 0;
let requestCount = 0;
const REQUEST_WINDOW = 60000;

// Add this helper function for rate limiting
const delayIfNeeded = async () => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  // If we've made more than 10 requests in the last minute, delay
  if (requestCount > 10 && timeSinceLastRequest < REQUEST_WINDOW) {
    const delay = REQUEST_WINDOW - timeSinceLastRequest;
    logger.warn("general", `Rate limiting: delaying request by ${delay}ms`);
    await new Promise((resolve) => setTimeout(resolve, delay));
    requestCount = 0;
  }

  // Always wait at least 1 second between requests
  if (timeSinceLastRequest < 1000) {
    await new Promise((resolve) =>
      setTimeout(resolve, 1000 - timeSinceLastRequest)
    );
  }

  lastRequestTime = Date.now();
  requestCount++;
};

// CoinGecko API configuration
const COINGECKO_BASE_URL = "https://api.coingecko.com/api/v3";
const COINGECKO_API_KEY =
  process.env.NEXT_PUBLIC_COINGECKO_API_KEY || "CG-fw2rF4aBSmvBwYnc9Jw4bKBo";

// Create CoinGecko API client
const coingeckoClient = axios.create({
  baseURL: COINGECKO_BASE_URL,
  timeout: 30000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
    "x-cg-demo-api-key": COINGECKO_API_KEY,
  },
});

/**
 * Fetch cryptocurrency market data from CoinGecko
 * @param params - Query parameters for the API request
 * @returns Promise with market data response
 */
export const fetchMarketData = async (
  params: MarketDataParams = {}
): Promise<MarketDataResponse> => {
  try {
    logger.info("markets", "Fetching market data from CoinGecko", { params });

    // Set default parameters
    const defaultParams: MarketDataParams = {
      vs_currency: "usd",
      order: "market_cap_desc",
      per_page: 100,
      page: 1,
      sparkline: false,
      price_change_percentage: "24h",
      locale: "en",
      ...params,
    };

    // Build query string
    const queryParams = new URLSearchParams();
    Object.entries(defaultParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const response = await coingeckoClient.get<MarketData[]>(
      `/coins/markets?${queryParams.toString()}`
    );

    // Type guard to check if response.data has the expected structure
    const data = response.data as any;

    logger.info("markets", "Market data fetched successfully", {
      count: data.length,
      firstCoin: data[0]?.name,
    });

    return {
      data: data,
      success: true,
    };
  } catch (error) {
    logger.error("markets", "Failed to fetch market data", { error });

    if (axios.isAxiosError(error)) {
      return {
        data: [],
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }

    return {
      data: [],
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
};

/**
 * Fetch specific cryptocurrency by ID
 * @param id - Coin ID (e.g., 'bitcoin', 'ethereum')
 * @param currency - Currency to display prices in (default: 'usd')
 * @returns Promise with market data for specific coin
 */
export const fetchCoinData = async (
  id: string,
  currency: string = "usd"
): Promise<MarketDataResponse> => {
  try {
    logger.info("markets", "Fetching coin data", { id, currency });

    const response = await coingeckoClient.get<MarketData[]>(
      `/coins/markets?vs_currency=${currency}&ids=${id}&order=market_cap_desc&per_page=1&page=1&sparkline=false&price_change_percentage=24h&locale=en`
    );

    return {
      data: response.data,
      success: true,
    };
  } catch (error) {
    logger.error("markets", "Failed to fetch coin data", { id, error });

    if (axios.isAxiosError(error)) {
      return {
        data: [],
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }

    return {
      data: [],
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
};

/**
 * Fetch top cryptocurrencies by market cap
 * @param limit - Number of coins to fetch (default: 20)
 * @param currency - Currency to display prices in (default: 'usd')
 * @returns Promise with top market data
 */
export const fetchTopMarkets = async (
  limit: number = 20,
  currency: string = "usd"
): Promise<MarketDataResponse> => {
  return fetchMarketData({
    vs_currency: currency,
    order: "market_cap_desc",
    per_page: limit,
    page: 1,
  });
};

/**
 * Fetch trending cryptocurrencies
 * @param currency - Currency to display prices in (default: 'usd')
 * @returns Promise with trending market data
 */
export const fetchTrendingMarkets = async (
  currency: string = "usd"
): Promise<MarketDataResponse> => {
  return fetchMarketData({
    vs_currency: currency,
    order: "h24_change_desc",
    per_page: 20,
    page: 1,
  });
};

/**
 * Search cryptocurrencies by name or symbol
 * @param query - Search query
 * @param currency - Currency to display prices in (default: 'usd')
 * @returns Promise with search results
 */
export const searchMarkets = async (
  query: string,
  currency: string = "usd"
): Promise<MarketDataResponse> => {
  try {
    logger.info("markets", "Searching markets", { query, currency });

    // First get all markets and filter by query
    const allMarkets = await fetchMarketData({
      vs_currency: currency,
      per_page: 250, // Get more results for better search
    });

    if (!allMarkets.success) {
      return allMarkets;
    }

    // Filter results by name or symbol
    const filteredData = allMarkets.data.filter(
      (coin) =>
        coin.name.toLowerCase().includes(query.toLowerCase()) ||
        coin.symbol.toLowerCase().includes(query.toLowerCase())
    );

    return {
      data: filteredData.slice(0, 20), // Limit to 20 results
      success: true,
    };
  } catch (error) {
    logger.error("markets", "Failed to search markets", { query, error });

    return {
      data: [],
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
};

/**
 * Test function to verify API integration
 * This function can be called to test if the CoinGecko API is working
 */
export const testApiConnection = async (): Promise<boolean> => {
  try {
    const response = await fetchTopMarkets(5, "usd");
    return response.success && response.data.length > 0;
  } catch (error) {
    logger.error("markets", "API connection test failed", { error });
    return false;
  }
};

export const fetchCoinDetails = async (id: string) => {
  try {
    const COINGECKO_API_KEY =
      process.env.NEXT_PUBLIC_COINGECKO_API_KEY ||
      "CG-fw2rF4aBSmvBwYnc9Jw4bKBo";

    // Try with API key first
    let response;
    try {
      response = await axios.get(
        `https://api.coingecko.com/api/v3/coins/${id}`,
        {
          headers: {
            "x-cg-demo-api-key": COINGECKO_API_KEY,
            Accept: "application/json",
          },
          timeout: 30000,
        }
      );
    } catch (apiKeyError) {
      // If API key fails, try without it (public endpoint)
      response = await axios.get(
        `https://api.coingecko.com/api/v3/coins/${id}`,
        {
          headers: { Accept: "application/json" },
          timeout: 30000,
        }
      );
    }

    return response.data;
  } catch (error) {
    logger.error("markets", "Failed to fetch coin details", { id, error });
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        throw new Error(
          "API key authentication failed. Please check your CoinGecko API key."
        );
      }
      throw new Error(
        `Failed to fetch coin details: ${
          error.response?.data?.error || error.message
        }`
      );
    }
    throw new Error("Failed to fetch coin details: Unknown error");
  }
};

export const fetchCoinMarketChart = async (
  id: string,
  days: number = 1,
  vs_currency: string = "usd"
) => {
  try {
    const COINGECKO_API_KEY =
      process.env.NEXT_PUBLIC_COINGECKO_API_KEY ||
      "CG-fw2rF4aBSmvBwYnc9Jw4bKBo";

    // Try with API key first
    let response;
    try {
      response = await axios.get(
        `https://api.coingecko.com/api/v3/coins/${id}/market_chart`,
        {
          params: { vs_currency, days }, // REMOVED interval parameter
          headers: {
            "x-cg-demo-api-key": COINGECKO_API_KEY,
            Accept: "application/json",
          },
          timeout: 30000,
        }
      );
    } catch (apiKeyError) {
      // If API key fails, try without it (public endpoint)
      response = await axios.get(
        `https://api.coingecko.com/api/v3/coins/${id}/market_chart`,
        {
          params: { vs_currency, days }, // REMOVED interval parameter
          headers: { Accept: "application/json" },
          timeout: 30000,
        }
      );
    }

    // Type guard to check if response.data has the expected structure
    const data = response.data as any;
    if (!data || !data.prices || !Array.isArray(data.prices)) {
      throw new Error("Invalid chart data format received from API");
    }

    return data.prices;
  } catch (error) {
    logger.error("markets", "Failed to fetch coin market chart", {
      id,
      days,
      vs_currency,
      error,
    });
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        throw new Error(
          "API key authentication failed. Please check your CoinGecko API key."
        );
      }
      throw new Error(
        `Failed to fetch chart data: ${
          error.response?.data?.error || error.message
        }`
      );
    }
    throw new Error("Failed to fetch chart data: Unknown error");
  }
};

// Add this fallback function
export const fetchCoinMarketChartFallback = async (
  id: string,
  days: number = 1,
  vs_currency: string = "usd"
) => {
  try {
    // Try a different approach - use simple fetch without axios
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=${vs_currency}&days=${days}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.prices || !Array.isArray(data.prices)) {
      throw new Error("Invalid chart data format");
    }

    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Debug function to test chart API endpoint
 * This can be called from browser console to test the API
 */
export const debugChartAPI = async (id: string = "bitcoin") => {
  try {
    const result = await fetchCoinMarketChart(id, 1, "usd");
    return result;
  } catch (error) {
    throw error;
  }
};

/**
 * Debug function to test details API endpoint
 * This can be called from browser console to test the API
 */
export const debugDetailsAPI = async (id: string = "bitcoin") => {
  try {
    const result = await fetchCoinDetails(id);
    return result;
  } catch (error) {
    throw error;
  }
};

/**
 * Alternative function to fetch chart data using public endpoints
 * This should work without API key restrictions
 */
export const fetchCoinMarketChartPublic = async (
  id: string,
  days: number = 1,
  vs_currency: string = "usd"
) => {
  let retries = 0;

  while (retries <= MAX_RETRIES) {
    try {
      await delayIfNeeded();

      // Remove the interval parameter - let CoinGecko auto-determine based on days
      const response = await axios.get(
        `https://api.coingecko.com/api/v3/coins/${id}/market_chart`,
        {
          params: {
            vs_currency,
            days,
            // REMOVED: interval: days === 1 ? "hourly" : "daily"
          },
          timeout: 15000,
        }
      );

      // Type guard to check if response.data has the expected structure
      const data = response.data as any;
      if (!data || !data.prices || !Array.isArray(data.prices)) {
        throw new Error("Invalid chart data format received from API");
      }

      return data;
    } catch (error) {
      retries++;

      if (retries > MAX_RETRIES) {
        if (axios.isAxiosError(error)) {
          if (error.response?.status === 429) {
            throw new Error(
              "Rate limit exceeded. Please try again in a few minutes."
            );
          }
          throw new Error(
            `Failed to fetch chart data: ${
              error.response?.data?.error || error.message
            }`
          );
        }
        throw new Error("Failed to fetch chart data: Unknown error");
      }

      // Wait before retrying
      await new Promise((resolve) =>
        setTimeout(resolve, RATE_LIMIT_DELAY * retries)
      );
    }
  }
};

/**
 * Alternative function to fetch coin details using public endpoints
 * This should work without API key restrictions
 */
export const fetchCoinDetailsPublic = async (id: string) => {
  let retries = 0;

  while (retries <= MAX_RETRIES) {
    try {
      await delayIfNeeded();

      const response = await axios.get(
        `https://api.coingecko.com/api/v3/coins/${id}`,
        {
          timeout: 15000,
        }
      );

      return response.data;
    } catch (error) {
      retries++;

      if (retries > MAX_RETRIES) {
        if (axios.isAxiosError(error)) {
          if (error.response?.status === 429) {
            throw new Error(
              "Rate limit exceeded. Please try again in a few minutes."
            );
          }
          throw new Error(
            `Failed to fetch coin details: ${
              error.response?.data?.error || error.message
            }`
          );
        }
        throw new Error("Failed to fetch coin details: Unknown error");
      }

      await new Promise((resolve) =>
        setTimeout(resolve, RATE_LIMIT_DELAY * retries)
      );
    }
  }
};

/**
 * Fetch top trading assets from OMAYA backend
 * @returns Promise with top assets data
 */
export const fetchTopAssets = async (): Promise<TopAssetsResponse> => {
  try {
    logger.info("markets", "Fetching top trading assets from OMAYA backend");

    const response = await get<TopAssetsResponse>(
      "/trading_engine/market/top-assets/"
    );

    logger.info("markets", "Top assets fetched successfully", {
      count: response.data.data?.length || 0,
    });

    return response.data;
  } catch (error) {
    logger.error("markets", "Failed to fetch top assets", { error });

    if (axios.isAxiosError(error)) {
      return {
        success: false,
        time_period: "24h",
        timestamp: new Date().toISOString(),
        data: [],
      };
    }

    return {
      success: false,
      time_period: "24h",
      timestamp: new Date().toISOString(),
      data: [],
    };
  }
};

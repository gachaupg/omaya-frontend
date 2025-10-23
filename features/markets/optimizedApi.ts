/**
 * Optimized Markets API with improved performance
 * Reduces delays, improves caching, and optimizes CoinGecko calls
 */

import { optimizedGet } from "@/lib/optimizedApiClient";
import { MarketData, MarketDataParams, MarketDataResponse } from "./types";
import { logger } from "@/lib/utils/logger";

const COINGECKO_BASE_URL = "https://api.coingecko.com/api/v3";
const COINGECKO_API_KEY =
  process.env.NEXT_PUBLIC_COINGECKO_API_KEY || "CG-fw2rF4aBSmvBwYnc9Jw4bKBo";

/**
 * Optimized market data fetching with reduced delays and better caching
 */
export const fetchMarketDataOptimized = async (
  params: MarketDataParams = {}
): Promise<MarketDataResponse> => {
  try {
    logger.info("markets", "Fetching market data (optimized)", { params });

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

    const response = await optimizedGet<MarketData[]>(
      `${COINGECKO_BASE_URL}/coins/markets?${queryParams.toString()}`,
      {
        apiName: "coingecko",
        useCache: true,
        cacheTTL: 2 * 60 * 1000, // 2 minutes cache for market data
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "x-cg-demo-api-key": COINGECKO_API_KEY,
        },
      }
    );

    // Type guard to check if response.data has the expected structure
    const data = response.data as any;

    logger.info("markets", "Market data fetched successfully (optimized)", {
      count: data.length,
      firstCoin: data[0]?.name,
    });

    return {
      data: data,
      success: true,
    };
  } catch (error) {
    logger.error("markets", "Failed to fetch market data (optimized)", {
      error,
    });

    if (error instanceof Error) {
      return {
        data: [],
        success: false,
        error: error.message,
      };
    }

    return {
      data: [],
      success: false,
      error: "Unknown error occurred",
    };
  }
};

/**
 * Optimized coin details fetching
 */
export const fetchCoinDetailsOptimized = async (id: string) => {
  try {
    logger.info("markets", "Fetching coin details (optimized)", { id });

    const response = await optimizedGet(`${COINGECKO_BASE_URL}/coins/${id}`, {
      apiName: "coingecko",
      useCache: true,
      cacheTTL: 5 * 60 * 1000, // 5 minutes cache for coin details
      headers: {
        Accept: "application/json",
        "x-cg-demo-api-key": COINGECKO_API_KEY,
      },
    });

    return response.data;
  } catch (error) {
    logger.error("markets", "Failed to fetch coin details (optimized)", {
      id,
      error,
    });

    if (error instanceof Error) {
      if (error.message.includes("401")) {
        throw new Error(
          "API key authentication failed. Please check your CoinGecko API key."
        );
      }
      throw new Error(`Failed to fetch coin details: ${error.message}`);
    }

    throw new Error("Failed to fetch coin details: Unknown error");
  }
};

/**
 * Optimized chart data fetching with better error handling
 */
export const fetchCoinMarketChartOptimized = async (
  id: string,
  days: number = 1,
  vs_currency: string = "usd"
) => {
  try {
    logger.info("markets", "Fetching chart data (optimized)", {
      id,
      days,
      vs_currency,
    });

    const response = await optimizedGet(
      `${COINGECKO_BASE_URL}/coins/${id}/market_chart`,
      {
        apiName: "coingecko",
        useCache: true,
        cacheTTL: 3 * 60 * 1000, // 3 minutes cache for chart data
        params: { vs_currency, days },
        headers: {
          Accept: "application/json",
          "x-cg-demo-api-key": COINGECKO_API_KEY,
        },
      }
    );

    // Type guard to check if response.data has the expected structure
    const data = response.data as any;
    if (!data || !data.prices || !Array.isArray(data.prices)) {
      throw new Error("Invalid chart data format received from API");
    }

    return data.prices;
  } catch (error) {
    logger.error("markets", "Failed to fetch chart data (optimized)", {
      id,
      days,
      vs_currency,
      error,
    });

    if (error instanceof Error) {
      if (error.message.includes("401")) {
        throw new Error(
          "API key authentication failed. Please check your CoinGecko API key."
        );
      }
      throw new Error(`Failed to fetch chart data: ${error.message}`);
    }

    throw new Error("Failed to fetch chart data: Unknown error");
  }
};

/**
 * Optimized top markets fetching
 */
export const fetchTopMarketsOptimized = async (
  limit: number = 20,
  currency: string = "usd"
): Promise<MarketDataResponse> => {
  return fetchMarketDataOptimized({
    vs_currency: currency,
    order: "market_cap_desc",
    per_page: limit,
    page: 1,
  });
};

/**
 * Optimized trending markets fetching
 */
export const fetchTrendingMarketsOptimized = async (
  currency: string = "usd"
): Promise<MarketDataResponse> => {
  return fetchMarketDataOptimized({
    vs_currency: currency,
    order: "h24_change_desc",
    per_page: 20,
    page: 1,
  });
};

/**
 * Optimized search with better caching
 */
export const searchMarketsOptimized = async (
  query: string,
  currency: string = "usd"
): Promise<MarketDataResponse> => {
  try {
    logger.info("markets", "Searching markets (optimized)", {
      query,
      currency,
    });

    // Use cached market data for search instead of making new API calls
    const allMarkets = await fetchMarketDataOptimized({
      vs_currency: currency,
      per_page: 250,
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
      data: filteredData.slice(0, 20),
      success: true,
    };
  } catch (error) {
    logger.error("markets", "Failed to search markets (optimized)", {
      query,
      error,
    });

    return {
      data: [],
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
};

/**
 * Batch fetch multiple coins at once for better performance
 */
export const fetchMultipleCoinsOptimized = async (
  coinIds: string[],
  currency: string = "usd"
): Promise<MarketDataResponse> => {
  try {
    logger.info("markets", "Fetching multiple coins (optimized)", {
      coinIds,
      currency,
    });

    const response = await optimizedGet<MarketData[]>(
      `${COINGECKO_BASE_URL}/coins/markets`,
      {
        apiName: "coingecko",
        useCache: true,
        cacheTTL: 2 * 60 * 1000,
        params: {
          vs_currency: currency,
          ids: coinIds.join(","),
          order: "market_cap_desc",
          per_page: coinIds.length,
          page: 1,
          sparkline: false,
          price_change_percentage: "24h",
          locale: "en",
        },
        headers: {
          Accept: "application/json",
          "x-cg-demo-api-key": COINGECKO_API_KEY,
        },
      }
    );

    return {
      data: response.data,
      success: true,
    };
  } catch (error) {
    logger.error("markets", "Failed to fetch multiple coins (optimized)", {
      coinIds,
      error,
    });

    return {
      data: [],
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
};

/**
 * Test function to verify optimized API performance
 */
export const testOptimizedApiPerformance = async (): Promise<{
  success: boolean;
  responseTime: number;
  dataCount: number;
}> => {
  const startTime = Date.now();

  try {
    const result = await fetchTopMarketsOptimized(5, "usd");
    const responseTime = Date.now() - startTime;

    return {
      success: result.success && result.data.length > 0,
      responseTime,
      dataCount: result.data.length,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    logger.error("markets", "Optimized API performance test failed", {
      error,
      responseTime,
    });

    return {
      success: false,
      responseTime,
      dataCount: 0,
    };
  }
};

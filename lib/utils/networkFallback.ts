/**
 * networkFallback.ts - Network error fallback handler
 * Provides graceful degradation for API network errors
 */
import { logger } from "./logger";

interface NetworkFallbackConfig {
  retryAttempts: number;
  retryDelay: number;
  fallbackData?: any;
  onError?: (error: any) => void;
}

export class NetworkFallback {
  private static isOnline: boolean = true;
  private static failedEndpoints: Set<string> = new Set();

  static init() {
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => {
        this.isOnline = true;
        this.failedEndpoints.clear();
        logger.info("api", "Network back online, clearing failed endpoints");
      });

      window.addEventListener("offline", () => {
        this.isOnline = false;
        logger.warn("api", "Network went offline");
      });
    }
  }

  static isNetworkAvailable(): boolean {
    return this.isOnline;
  }

  static markEndpointFailed(endpoint: string) {
    this.failedEndpoints.add(endpoint);
    logger.warn("api", `Endpoint marked as failed: ${endpoint}`);
  }

  static isEndpointFailed(endpoint: string): boolean {
    return this.failedEndpoints.has(endpoint);
  }

  static clearFailedEndpoint(endpoint: string) {
    this.failedEndpoints.delete(endpoint);
    logger.info("api", `Endpoint cleared from failed list: ${endpoint}`);
  }

  static async withFallback<T>(
    apiCall: () => Promise<T>,
    config: NetworkFallbackConfig = {
      retryAttempts: 2,
      retryDelay: 1000,
    }
  ): Promise<T | null> {
    let lastError: any = null;

    // If network is offline, return fallback data immediately
    if (!this.isOnline && config.fallbackData) {
      logger.warn("api", "Network offline, returning fallback data");
      return config.fallbackData;
    }

    for (let attempt = 0; attempt <= config.retryAttempts; attempt++) {
      try {
        const result = await apiCall();
        // Success - clear any previous failures
        return result;
      } catch (error: any) {
        lastError = error;

        // Log the error
        logger.error("api", `API call failed, attempt ${attempt + 1}`, {
          error: error.message,
          status: error.response?.status,
          stack: error.stack,
        });

        // Don't retry on client errors (4xx)
        if (
          error.response?.status &&
          error.response.status >= 400 &&
          error.response.status < 500
        ) {
          break;
        }

        // Wait before retrying (except on last attempt)
        if (attempt < config.retryAttempts) {
          await new Promise((resolve) =>
            setTimeout(resolve, config.retryDelay * (attempt + 1))
          );
        }
      }
    }

    // Call error handler if provided
    if (config.onError) {
      config.onError(lastError);
    }

    // Return fallback data if available
    if (config.fallbackData) {
      logger.warn("api", "All retry attempts failed, returning fallback data");
      return config.fallbackData;
    }

    // If no fallback data, return null instead of throwing
    logger.error("api", "API call failed and no fallback data available");
    return null;
  }

  static createMockResponse<T>(data: T): T {
    return data;
  }
}

// Initialize on module load
NetworkFallback.init();

export default NetworkFallback;

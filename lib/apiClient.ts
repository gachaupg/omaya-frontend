/**
 * apiClient.ts – Enhanced API client with retry logic and logging
 */
import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosError,
  AxiosResponse,
} from "axios";
import { storage } from "../features/auth/utils/storage";
import { API_BASE_URL } from "@/config/api";
import { logger } from "./utils/logger";
import ApiHealthChecker from "./utils/apiHealthChecker";

if (!API_BASE_URL) {
  throw new Error(
    "NEXT_PUBLIC_BASE_URL is not defined in environment variables"
  );
}

interface ApiClientConfig {
  timeout: number;
  retries: number;
  retryDelay: number;
  retryCondition: (error: AxiosError) => boolean;
}

const DEFAULT_CONFIG: ApiClientConfig = {
  timeout: 30000, // 30 seconds for financial operations
  retries: 3,
  retryDelay: 1000,
  retryCondition: (error: AxiosError) => {
    // Retry on network errors and 5xx server errors
    return (
      !error.response ||
      (error.response.status >= 500 && error.response.status < 600)
    );
  },
};

const ENDPOINT_SPECIFIC_CONFIG: Record<string, Partial<ApiClientConfig>> = {
  "/wallet/wallets/": { timeout: 15000, retries: 2 },
  "/trading_engine/p2p/deposits/": { timeout: 60000, retries: 1 }, // File uploads
  "/trading_engine/deposits/": { timeout: 60000, retries: 1 }, // Exchange deposits
  "/trading_engine/p2p/orders/": { timeout: 45000, retries: 2 },
  "/trading_engine/p2p/trades/": { timeout: 45000, retries: 1 }, // Critical operations
  "/api/auth/login/": { timeout: 10000, retries: 1 }, // Faster login
  "/api/auth/register/": { timeout: 10000, retries: 1 }, // Faster registration
  "/api/kyc/status/": { timeout: 15000, retries: 2 }, // KYC status check
  "/api/kyc/verify/": { timeout: 30000, retries: 1 }, // KYC verification
  // Device session endpoints – keep under 15s overall to align with GlobalSession creation window
  "/api/devices/create/": { timeout: 12000, retries: 0 },
  "/api/device-sessions/": { timeout: 12000, retries: 0 },
};

const generateRequestId = (): string => {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Request deduplication tracking
const pendingRequests = new Map<string, Promise<any>>();

/**
 * Generate a unique key for request deduplication
 */
const generateRequestKey = (config: AxiosRequestConfig): string => {
  const method = config.method || 'get';
  const url = config.url || '';
  const params = config.params || {};
  // Don't include data in key to avoid issues with large payloads
  return `${method}-${url}-${JSON.stringify(params)}`;
};

// Helper to get CSRF token from cookies
const getCsrfToken = (): string | null => {
  if (typeof document === 'undefined') return null;
  const cookies = document.cookie.split(';');
  const csrfCookie = cookies.find(cookie => cookie.trim().startsWith('csrftoken='));
  return csrfCookie ? csrfCookie.split('=')[1] : null;
};

const createAxiosInstance = (config: ApiClientConfig = DEFAULT_CONFIG): AxiosInstance => {
  const instance = axios.create({
    baseURL: API_BASE_URL,
    timeout: config.timeout,
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "X-Requested-With": "XMLHttpRequest",
      "X-CSRFToken": getCsrfToken() || '',
    },
    withCredentials: true, // Enable sending cookies with requests
  });

  // Request interceptor with timeout override and CSRF token
  instance.interceptors.request.use((requestConfig) => {
    const endpoint = requestConfig.url || "";
    const endpointConfig = ENDPOINT_SPECIFIC_CONFIG[endpoint];
    
    // Add CSRF token to all non-GET requests
    if (requestConfig.method && requestConfig.method.toLowerCase() !== 'get') {
      requestConfig.headers = requestConfig.headers || {};
      requestConfig.headers['X-CSRFToken'] = getCsrfToken() || '';
    }

    if (endpointConfig) {
      requestConfig.timeout = endpointConfig.timeout || config.timeout;
    }

    logger.debug("api", "API Request", {
      method: requestConfig.method,
      url: requestConfig.url,
      timeout: requestConfig.timeout,
    });

    return requestConfig;
  });

  return instance;
};

const addAuthInterceptor = (instance: AxiosInstance): AxiosInstance => {
  instance.interceptors.request.use(
    (config) => {
      const profile = storage.getProfile();
      if (profile?.tokens?.access) {
        config.headers.Authorization = `Bearer ${profile.tokens.access}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );
  return instance;
};

const addRefreshTokenInterceptor = (instance: AxiosInstance): AxiosInstance => {
  instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config;
      const profile = storage.getProfile();

      if (
        error.response?.status === 401 &&
        profile?.tokens?.refresh &&
        originalRequest &&
        !(originalRequest as any)._retry
      ) {
        (originalRequest as any)._retry = true;
        try {
          // Use mutex-protected refresh from tokenRefresh utility
          // This ensures only one refresh happens even with concurrent 401s
          const { refreshAccessToken } = await import("./utils/tokenRefresh");
          const newAccessToken = await refreshAccessToken();

          if (!newAccessToken) {
            throw new Error("Token refresh returned null");
          }

          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return instance(originalRequest);
        } catch (refreshError) {
          // Mutex already handled cleanup (storage.removeProfile, redirect)
          // Just reject to stop the request
          return Promise.reject(refreshError);
        }
      }
      return Promise.reject(error);
    }
  );
  return instance;
};

// Enhanced retry logic
const addRetryInterceptor = (
  instance: AxiosInstance,
  config: ApiClientConfig
): AxiosInstance => {
  instance.interceptors.response.use(
    (response) => {
      // Record successful API call
      if (response.config.url) {
        ApiHealthChecker.recordSuccess(response.config.url);
      }
      return response;
    },
    async (error: AxiosError) => {
      const originalRequest = error.config as any;

      // Record API failure
      if (originalRequest?.url) {
        ApiHealthChecker.recordFailure(originalRequest.url, error);
      }

      if (!originalRequest || originalRequest._retryCount >= config.retries) {
        return Promise.reject(error);
      }

      if (config.retryCondition(error)) {
        originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;

        logger.warn("api", "Retrying API request", {
          url: originalRequest.url,
          attempt: originalRequest._retryCount,
          error: error.message,
        });

        // Wait before retrying
        await new Promise((resolve) =>
          setTimeout(resolve, config.retryDelay * originalRequest._retryCount)
        );

        return instance(originalRequest);
      }

      return Promise.reject(error);
    }
  );

  return instance;
};

/**
 * Add request deduplication to prevent identical concurrent requests
 * Only deduplicates GET requests for safety
 */
const addDeduplicationInterceptor = (
  instance: AxiosInstance
): AxiosInstance => {
  // Wrap the request method to track pending requests
  const originalRequest = instance.request.bind(instance);

  instance.request = function <T = any>(
    config: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    const method = config.method?.toLowerCase() || "get";

    // Only deduplicate GET requests (safe, idempotent)
    if (method === "get") {
      const key = generateRequestKey(config);

      // Check if an identical request is already pending
      if (pendingRequests.has(key)) {
        logger.debug("api", "Deduplicating GET request", {
          url: config.url,
          key,
        });
        return pendingRequests.get(key)!;
      }

      // Store the promise for this request
      const requestPromise = originalRequest(config)
        .then((response: AxiosResponse<T>) => {
          pendingRequests.delete(key);
          return response;
        })
        .catch((error: any) => {
          pendingRequests.delete(key);
          throw error;
        });

      pendingRequests.set(key, requestPromise);
      return requestPromise;
    }

    // For non-GET requests, proceed normally
    return originalRequest(config);
  } as any;

  return instance;
};

const createApiClient = (): AxiosInstance => {
  const instance = createAxiosInstance();
  const withAuth = addAuthInterceptor(instance);
  const withRefresh = addRefreshTokenInterceptor(withAuth);
  const withRetry = addRetryInterceptor(withRefresh, DEFAULT_CONFIG);
  const withDedup = addDeduplicationInterceptor(withRetry);
  return withDedup;
};

const apiClient = createApiClient();

export const get = <T>(
  url: string,
  config?: AxiosRequestConfig
): Promise<AxiosResponse<T>> => {
  return apiClient.get<T>(url, config);
};

export const post = <T>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<AxiosResponse<T>> => {
  return apiClient.post<T>(url, data, config);
};

export const put = <T>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<AxiosResponse<T>> => {
  return apiClient.put<T>(url, data, config);
};

export const patch = <T>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<AxiosResponse<T>> => {
  return apiClient.patch<T>(url, data, config);
};

export const del = <T>(
  url: string,
  config?: AxiosRequestConfig
): Promise<AxiosResponse<T>> => {
  return apiClient.delete<T>(url, config);
};

export { apiClient, AxiosError, type AxiosRequestConfig };

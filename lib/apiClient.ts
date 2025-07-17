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
  "/trading_engine/p2p/deposit/": { timeout: 60000, retries: 1 }, // File uploads
  "/trading_engine/p2p/orders/": { timeout: 45000, retries: 2 },
  "/trading_engine/p2p/trades/": { timeout: 45000, retries: 1 }, // Critical operations
  "/api/auth/login/": { timeout: 10000, retries: 1 }, // Faster login
  "/api/auth/register/": { timeout: 10000, retries: 1 }, // Faster registration
};

const generateRequestId = (): string => {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const createAxiosInstance = (
  config: ApiClientConfig = DEFAULT_CONFIG
): AxiosInstance => {
  const instance = axios.create({
    baseURL: API_BASE_URL,
    timeout: config.timeout,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });

  // Request interceptor with timeout override
  instance.interceptors.request.use((requestConfig) => {
    const endpoint = requestConfig.url || "";
    const endpointConfig = ENDPOINT_SPECIFIC_CONFIG[endpoint];

    if (endpointConfig) {
      requestConfig.timeout = endpointConfig.timeout || config.timeout;
    }

    logger.debug("API Request", {
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
          const response = await axios.post(
            `${API_BASE_URL}/api/token/refresh/`,
            {
              refresh: profile.tokens.refresh,
            }
          );

          const newAccessToken = response.data.access;
          storage.setProfile({
            ...profile,
            tokens: {
              ...profile.tokens,
              access: newAccessToken,
            },
          });

          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return instance(originalRequest);
        } catch (refreshError) {
          storage.removeProfile();
          window.location.href = "/auth/login";
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

        logger.warn("Retrying API request", {
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

const createApiClient = (): AxiosInstance => {
  const instance = createAxiosInstance();
  const withAuth = addAuthInterceptor(instance);
  const withRefresh = addRefreshTokenInterceptor(withAuth);
  const withRetry = addRetryInterceptor(withRefresh, DEFAULT_CONFIG);
  return withRetry;
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

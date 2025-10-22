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
import { cookieUtils } from "./utils/cookieUtils";

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
  retries: 2, // Reduced from 3 to 2 to prevent excessive retries
  retryDelay: 1000,
  retryCondition: (error: AxiosError) => {
    // Only retry on network errors and 5xx server errors
    // Don't retry on 4xx client errors
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
  "/payments/admin/payment-details/": { timeout: 10000, retries: 1 }, // Reduce retries for payment details
  "/payments/admin/wallet-list/": { timeout: 10000, retries: 1 }, // Reduce retries for wallet list
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

// Global flag to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (error?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  
  failedQueue = [];
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
        if (isRefreshing) {
          // If already refreshing, queue this request
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return instance(originalRequest);
          }).catch(err => {
            return Promise.reject(err);
          });
        }

        (originalRequest as any)._retry = true;
        isRefreshing = true;

        try {
          const response = await axios.post(
            `${API_BASE_URL}/api/token/refresh/`,
            {
              refresh: profile.tokens.refresh,
            }
          );

          const newAccessToken = response.data.access;
          const newRefreshToken = response.data.refresh || profile.tokens.refresh;
          
          // Update storage with new tokens
          const updatedProfile = {
            ...profile,
            tokens: {
              access: newAccessToken,
              refresh: newRefreshToken,
            },
          };
          storage.setProfile(updatedProfile);

          // Update localStorage access token
          if (typeof window !== 'undefined') {
            localStorage.setItem('access_token', newAccessToken);
          }

          // Update cookie
          cookieUtils.setCookie("access_token", newAccessToken, {
            maxAge: 86400,
            secure: true,
            sameSite: 'strict'
          });

          // Process queued requests
          processQueue(null, newAccessToken);

          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return instance(originalRequest);
        } catch (refreshError) {
          // Clear all auth data
          storage.removeProfile();
          if (typeof window !== 'undefined') {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user');
            sessionStorage.clear();
          }
          cookieUtils.removeCookie("access_token");
          
          // Process queued requests with error
          processQueue(refreshError, null);
          
          // Redirect to login if not on public pages
          if (typeof window !== 'undefined') {
            const currentPath = window.location.pathname;
            const isPublicPage = currentPath === '/' || 
                                  currentPath.startsWith('/auth/') ||
                                  currentPath.includes('/about') ||
                                  currentPath.includes('/contact');
            
            if (!isPublicPage) {
              console.log('🔒 Token refresh failed, redirecting to login...');
              window.location.href = "/auth/login";
            }
          }
          
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }
      
      // For 401 errors without refresh token (unauthenticated users on home page)
      // Silently reject without showing error
      if (error.response?.status === 401 && !profile?.tokens?.refresh) {
        // Completely silent - no logs, no messages
        return Promise.reject({ 
          ...error, 
          message: '',
          suppressed: true 
        });
      }
      
      return Promise.reject(error);
    }
  );
  return instance;
};

// Enhanced retry logic with strict limits
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

      // Initialize retry count if not set
      if (!originalRequest._retryCount) {
        originalRequest._retryCount = 0;
      }

      // Get endpoint-specific retry limit (hard cap at 3 retries max)
      const endpoint = originalRequest?.url || "";
      const endpointConfig = ENDPOINT_SPECIFIC_CONFIG[endpoint];
      const maxRetries = Math.min(endpointConfig?.retries ?? config.retries, 3); // HARD CAP: Never exceed 3 retries

      // STRICT LIMIT: Stop at max retries for this endpoint
      if (!originalRequest || originalRequest._retryCount >= maxRetries) {
        console.warn(`🚫 Max retries (${maxRetries}) reached for ${endpoint} - STOPPING`);
        return Promise.reject(error);
      }

      // Emergency brake: If somehow retry count exceeds 3, force stop
      if (originalRequest._retryCount >= 3) {
        console.error(`🛑 EMERGENCY STOP: Retry count exceeded safety limit for ${endpoint}`);
        return Promise.reject(error);
      }

      // Don't retry on client errors (4xx) - only network/server errors
      if (error.response?.status && error.response.status >= 400 && error.response.status < 500) {
        console.log(`⚠️ Client error (${error.response.status}) - not retrying ${endpoint}`);
        return Promise.reject(error);
      }

      // Only retry on network errors or 5xx errors
      if (config.retryCondition(error)) {
        originalRequest._retryCount = originalRequest._retryCount + 1;

        console.log(`🔄 Retry ${originalRequest._retryCount}/${maxRetries} for ${endpoint}`);

        // Exponential backoff: 1s, 2s, 4s
        const backoffDelay = config.retryDelay * Math.pow(2, originalRequest._retryCount - 1);
        await new Promise((resolve) => setTimeout(resolve, backoffDelay));

        // Make the retry request
        try {
          return await instance(originalRequest);
        } catch (retryError) {
          // If this retry also fails, let it propagate
          return Promise.reject(retryError);
        }
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

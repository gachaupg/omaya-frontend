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
  timeout: 20000, // 20s default so slow API doesn’t hang the app; critical ops use ENDPOINT_SPECIFIC_CONFIG
  retries: 2, // Total attempts (initial + retries)
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
  "/api/kyc/status/": { timeout: 10000, retries: 1 }, // KYC status – fail fast so UI doesn’t hang
  "/api/kyc/verify/": { timeout: 30000, retries: 1 }, // KYC verification
  // Device session endpoints – keep under 15s overall to align with GlobalSession creation window
  "/api/devices/create/": { timeout: 12000, retries: 0 },
  "/api/device-sessions/": { timeout: 12000, retries: 0 },
  // ChangeNOW create - no retries (400 = amount too small, fail fast)
  "/api/changenow/create/": { timeout: 30000, retries: 0 },
  // User payment details – avoid hanging when API is slow; allow navigation
  "/payments/user-payment-details": { timeout: 15000, retries: 1 },
  // Swap/asset selection – fail fast so user can click elsewhere
  "/api/changenow/estimate": { timeout: 15000, retries: 1 },
  "/api/changenow/public/estimate": { timeout: 15000, retries: 1 },
  "/api/changenow/supported-tokens": { timeout: 180000, retries: 1 },
};

const MAX_LOG_JSON_LEN = 8000;
const SENSITIVE_REQUEST_KEYS = new Set([
  "password",
  "current_password",
  "new_password",
  "confirm_password",
  "otp",
  "refresh",
  "access",
  "access_token",
  "refresh_token",
  "token",
  "authorization",
]);

/** Shallow + nested redaction for logging only */
function redactForLog(value: unknown, depth = 0): unknown {
  if (depth > 8) return "[…]";
  if (value == null) return value;
  if (typeof value !== "object") return value;
  if (value instanceof FormData) return "[FormData]";
  if (Array.isArray(value)) {
    return value.slice(0, 50).map((v) => redactForLog(v, depth + 1));
  }
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (SENSITIVE_REQUEST_KEYS.has(k.toLowerCase())) {
      out[k] = "[REDACTED]";
    } else if (v && typeof v === "object") {
      out[k] = redactForLog(v, depth + 1) as unknown;
    } else {
      out[k] = v;
    }
  }
  return out;
}

function stringifyForLog(value: unknown): string {
  try {
    const s =
      typeof value === "string" ? value : JSON.stringify(redactForLog(value));
    if (s.length <= MAX_LOG_JSON_LEN) return s;
    return `${s.slice(0, MAX_LOG_JSON_LEN)}…[truncated ${s.length - MAX_LOG_JSON_LEN} chars]`;
  } catch {
    return "[unserializable]";
  }
}

function buildFullUrl(config: AxiosRequestConfig): string {
  const base = config.baseURL || "";
  const path = config.url || "";
  if (path.startsWith("http")) return path;
  return `${base}${path}`;
}

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
    
    // For FormData, remove Content-Type so browser sets multipart/form-data with boundary
    // (otherwise default application/json causes file uploads to fail - server receives {} for files)
    if (requestConfig.data instanceof FormData) {
      requestConfig.headers = requestConfig.headers || {};
      const h = requestConfig.headers as Record<string, unknown>;
      if (typeof (h as any).delete === 'function') {
        (h as any).delete('Content-Type');
        (h as any).delete('content-type');
      } else {
        delete h['Content-Type'];
        delete h['content-type'];
      }
    }
    
    // Add CSRF token to all non-GET requests
    if (requestConfig.method && requestConfig.method.toLowerCase() !== 'get') {
      requestConfig.headers = requestConfig.headers || {};
      requestConfig.headers['X-CSRFToken'] = getCsrfToken() || '';
    }

    // Match by prefix so paths with query params still get the right timeout
    const endpointConfig = Object.entries(ENDPOINT_SPECIFIC_CONFIG).find(
      ([path]) => endpoint.includes(path) || endpoint.startsWith(path)
    )?.[1];
    if (endpointConfig) {
      requestConfig.timeout = endpointConfig.timeout || config.timeout;
    }

    (requestConfig as any).__requestStartedAt = Date.now();

    logger.debug("api", {
      type: "request",
      method: String(requestConfig.method || "get").toUpperCase(),
      url: buildFullUrl(requestConfig),
      params: requestConfig.params,
      data:
        requestConfig.data instanceof FormData
          ? "[FormData]"
          : redactForLog(requestConfig.data),
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

      // Skip refresh logic for the refresh token endpoint itself
      if (originalRequest?.url?.includes('/api/token/refresh/')) {
        return Promise.reject(error);
      }

      // Only attempt refresh if:
      // 1. We got a 401 error
      // 2. We have a refresh token
      // 3. We have a valid request config
      // 4. We haven't already retried this request (prevent infinite loops)
      // 5. This is not the refresh token endpoint itself
      if (
        error.response?.status === 401 &&
        profile?.tokens?.refresh &&
        originalRequest &&
        !(originalRequest as any)._retry &&
        !originalRequest?.url?.includes('/api/token/refresh/')
      ) {
        (originalRequest as any)._retry = true;
        try {
          logger.info("api", "401 Unauthorized detected, attempting token refresh", {
            url: originalRequest.url,
          });

          // Use mutex-protected refresh from tokenRefresh utility
          // This ensures only one refresh happens even with concurrent 401s
          const { refreshAccessToken } = await import("./utils/tokenRefresh");
          const newAccessToken = await refreshAccessToken();

          if (!newAccessToken) {
            logger.error("api", "Token refresh returned null, redirecting to login");
            throw new Error("Token refresh returned null");
          }

          // Verify the token was actually updated in storage
          // Double-check and force update if needed
          let updatedProfile = storage.getProfile();
          if (!updatedProfile?.tokens?.access || updatedProfile.tokens.access !== newAccessToken) {
            logger.warn("api", "Token not properly updated in storage, forcing update now");
            storage.setProfile({
              ...(updatedProfile || profile),
              tokens: {
                access: newAccessToken,
                refresh: updatedProfile?.tokens?.refresh || profile.tokens.refresh,
              },
            });
            // Re-read to verify
            updatedProfile = storage.getProfile();
          }

          // Ensure headers object exists
          if (!originalRequest.headers) {
            originalRequest.headers = {} as any;
          }

          // Use the new token directly (we know it's valid since refreshAccessToken returned it)
          // Also verify it's in storage
          const finalToken = updatedProfile?.tokens?.access || newAccessToken;
          if (!finalToken) {
            logger.error("api", "No token available after refresh, cannot retry");
            throw new Error("No token available after refresh");
          }

          // Set the authorization header explicitly
          originalRequest.headers.Authorization = `Bearer ${finalToken}`;

          // Also ensure the request config is clean for retry
          delete (originalRequest as any).__retryCount;

          logger.info("api", "Token refreshed successfully, retrying original request", {
            url: originalRequest.url,
            hasToken: !!finalToken,
            tokenLength: finalToken.length,
          });

          // Retry the original request with the new token
          // The request interceptor will run and add the token from storage (which should match)
          return instance(originalRequest);
        } catch (refreshError) {
          logger.error("api", "Token refresh failed", refreshError);
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

      const endpoint = originalRequest?.url || "";
      const endpointConfig = Object.entries(ENDPOINT_SPECIFIC_CONFIG).find(
        ([path]) => endpoint.includes(path) || endpoint.startsWith(path)
      )?.[1];
      const maxAttempts = endpointConfig?.retries ?? config.retries;
      const maxAdditionalRetries = Math.max(0, maxAttempts - 1);

      if (!originalRequest || (originalRequest._retryCount || 0) >= maxAdditionalRetries) {
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

/** Logs successful and failed HTTP responses when `api` logging is enabled. */
const addHttpTraceInterceptor = (instance: AxiosInstance): AxiosInstance => {
  instance.interceptors.response.use(
    (response) => {
      const cfg = response.config;
      const started = (cfg as any).__requestStartedAt as number | undefined;
      const durationMs =
        typeof started === "number" ? Date.now() - started : undefined;
      logger.debug("api", {
        type: "response",
        method: String(cfg.method || "get").toUpperCase(),
        url: buildFullUrl(cfg),
        status: response.status,
        durationMs,
        data: stringifyForLog(response.data),
      });
      return response;
    },
    (error: AxiosError) => {
      const cfg = error.config;
      const started = (cfg as any)?.__requestStartedAt as number | undefined;
      const durationMs =
        typeof started === "number" ? Date.now() - started : undefined;
      logger.debug("api", {
        type: "response_error",
        method: String(cfg?.method || "get").toUpperCase(),
        url: cfg ? buildFullUrl(cfg) : undefined,
        status: error.response?.status,
        durationMs,
        data:
          error.response?.data !== undefined
            ? stringifyForLog(error.response.data)
            : undefined,
        message: error.message,
      });
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
  const withDedup = addDeduplicationInterceptor(withRetry);
  return addHttpTraceInterceptor(withDedup);
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

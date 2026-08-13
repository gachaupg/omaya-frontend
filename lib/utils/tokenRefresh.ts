/**
 * tokenRefresh.ts - Token refresh utility with Redux integration and mutex protection
 */
import axios from "axios";
import { API_BASE_URL } from "@/config/api";
import { storage } from "@/features/auth/utils/storage";
import {
  clearStoredAuthCredentials,
  authHardRedirect,
  persistRefreshedTokens,
} from "./authSession";
import { logger } from "./logger";
import { tokenRefreshMutex } from "./tokenRefreshMutex";

// Store reference will be set by the application
let storeDispatch: any = null;
let refreshTokensAction: any = null;

/**
 * Initialize the token refresh utility with Redux store
 * Call this once in your app initialization
 */
export const initializeTokenRefresh = (dispatch: any, refreshAction: any) => {
  storeDispatch = dispatch;
  refreshTokensAction = refreshAction;
  logger.info("auth", "Token refresh utility initialized");
};

/**
 * Refresh the access token using the refresh token
 * Uses mutex to prevent race conditions from concurrent refresh attempts
 */
export const refreshAccessToken = async (): Promise<string | null> => {
  // Use mutex to ensure only one refresh happens at a time
  return tokenRefreshMutex.acquireRefresh(async () => {
    try {
      const profile = storage.getProfile();

      if (!profile?.tokens?.refresh) {
        logger.warn("auth", "No refresh token available");
        return null;
      }

      logger.info("auth", "Attempting to refresh access token");

      const response = await axios.post(
        `${API_BASE_URL}/api/token/refresh/`,
        {
          refresh: profile.tokens.refresh,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const { access, refresh: newRefresh } = response.data;

      if (!access) {
        throw new Error("Refresh response missing access token");
      }

      if (!newRefresh) {
        logger.warn(
          "auth",
          "Refresh response missing refresh token; keeping previous refresh (rotation may fail on next refresh)"
        );
      }

      const refreshToken = newRefresh || profile.tokens.refresh;

      logger.info("auth", "Access token refreshed successfully", {
        refreshRotated: Boolean(newRefresh && newRefresh !== profile.tokens.refresh),
      });

      persistRefreshedTokens({ access, refresh: refreshToken });

      // Dispatch Redux action if available
      if (storeDispatch && refreshTokensAction) {
        storeDispatch(
          refreshTokensAction({
            access,
            refresh: refreshToken,
          })
        );
      }

      // Broadcast token refresh to other tabs
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("tokenRefreshed", {
            detail: { access, refresh: refreshToken },
          })
        );
      }

      return access;
    } catch (error: any) {
      logger.error("auth", "Token refresh failed", error);

      const detail =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        error?.message ||
        "";
      const isBlacklisted =
        typeof detail === "string" &&
        detail.toLowerCase().includes("blacklist");

      // Check if it's a 401 (refresh token expired) or other error
      if (error?.response?.status === 401 || isBlacklisted) {
        logger.warn(
          "auth",
          isBlacklisted
            ? "Refresh token blacklisted, user needs to login again"
            : "Refresh token expired or invalid, user needs to login again"
        );
      }

      // Clear invalid tokens (including loose localStorage keys checkAuth would re-hydrate)
      storage.removeProfile();
      clearStoredAuthCredentials();

      if (
        typeof window !== "undefined" &&
        !window.location.pathname.includes("/auth/login")
      ) {
        setTimeout(() => {
          authHardRedirect("/auth/login");
        }, 100);
      }

      return null;
    }
  });
};

/**
 * Check if token is expired or about to expire
 */
export const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const expirationTime = payload.exp * 1000; // Convert to milliseconds
    const currentTime = Date.now();
    const timeUntilExpiry = expirationTime - currentTime;

    // Consider token expired if it expires in less than 2 minutes (reduced from 5 to prevent premature refresh)
    return timeUntilExpiry < 2 * 60 * 1000;
  } catch (error) {
    logger.error("auth", "Error checking token expiration", error);
    return true; // Treat as expired if we can't parse it
  }
};

/**
 * Proactively refresh token if it's about to expire
 */
export const proactiveTokenRefresh = async (): Promise<void> => {
  const profile = storage.getProfile();

  if (!profile?.tokens?.access) {
    return;
  }

  if (isTokenExpired(profile.tokens.access)) {
    logger.info(
      "auth",
      "Token is expired or about to expire, refreshing proactively"
    );
    await refreshAccessToken();
  }
};

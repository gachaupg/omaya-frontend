/**
 * tokenRefresh.ts - Token refresh utility with Redux integration
 */
import axios from "axios";
import { API_BASE_URL } from "@/config/api";
import { storage } from "@/features/auth/utils/storage";
import { cookieUtils } from "./cookieUtils";
import { logger } from "./logger";

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
};

/**
 * Refresh the access token using the refresh token
 */
export const refreshAccessToken = async (): Promise<string | null> => {
  try {
    const profile = storage.getProfile();
    
    if (!profile?.tokens?.refresh) {
      return null;
    }

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

    const { access, refresh } = response.data;

    // Update storage
    const updatedProfile = {
      ...profile,
      tokens: {
        access,
        refresh: refresh || profile.tokens.refresh, // Use new refresh token if provided
      },
    };
    
    storage.setProfile(updatedProfile);

    // Update cookie
    cookieUtils.setCookie("access_token", access, {
      maxAge: 86400,
      secure: true,
      sameSite: 'strict'
    });

    // Dispatch Redux action if available
    if (storeDispatch && refreshTokensAction) {
      storeDispatch(refreshTokensAction({ 
        access, 
        refresh: refresh || undefined 
      }));
    }

    return access;
  } catch (error: any) {
    // Clear invalid tokens
    storage.removeProfile();
    cookieUtils.removeCookie("access_token");
    
    // Redirect to login
    if (typeof window !== 'undefined') {
      window.location.href = "/auth/login";
    }
    
    return null;
  }
};

/**
 * Check if token is expired or about to expire
 */
export const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expirationTime = payload.exp * 1000; // Convert to milliseconds
    const currentTime = Date.now();
    const timeUntilExpiry = expirationTime - currentTime;
    
    // Consider token expired if it expires in less than 5 minutes
    return timeUntilExpiry < 5 * 60 * 1000;
  } catch (error) {
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
    await refreshAccessToken();
  }
};



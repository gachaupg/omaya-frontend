/**
 * useTokenRefresh - Hook to ensure token is fresh before making API calls
 */
import { useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/rootReducer";
import {
  proactiveTokenRefresh,
  isTokenExpired,
} from "@/lib/utils/tokenRefresh";
import { logout } from "@/features/auth/slices/authSlice";

export const useTokenRefresh = () => {
  const dispatch = useDispatch();
  const { tokens, isAuthenticated } = useSelector(
    (state: RootState) => state.auth
  );

  /**
   * Refresh token if needed before making an API call
   */
  const ensureTokenFresh = useCallback(async () => {
    if (!isAuthenticated || !tokens?.access) {
      return false;
    }

    try {
      if (isTokenExpired(tokens.access)) {
        await proactiveTokenRefresh();
      }
      return true;
    } catch (error) {
      console.error("Token refresh failed:", error);
      dispatch(logout());
      return false;
    }
  }, [isAuthenticated, tokens, dispatch]);

  /**
   * Check token on mount and set up periodic checks
   */
  useEffect(() => {
    if (!isAuthenticated || !tokens?.access) {
      return;
    }

    // Check immediately on mount
    proactiveTokenRefresh().catch(console.error);

    // Set up periodic checks (every 5 minutes - increased from 2 to reduce conflicts with interceptor)
    // The mutex will handle coordination if both mechanisms trigger simultaneously
    const interval = setInterval(
      () => {
        if (isAuthenticated && tokens?.access) {
          proactiveTokenRefresh().catch(console.error);
        }
      },
      5 * 60 * 1000
    );

    return () => clearInterval(interval);
  }, [isAuthenticated, tokens?.access]);

  return { ensureTokenFresh };
};

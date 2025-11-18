/**
 * crossTabSync.ts - Synchronize authentication state across browser tabs
 *
 * This prevents the issue where:
 * - Tab A refreshes the token
 * - Tab B doesn't know and continues using old token
 * - Tab B gets logged out
 */

import { storage } from "@/features/auth/utils/storage";
import { store } from "@/store";
import { initializeAuth, logout } from "@/features/auth/slices/authSlice";
import { logger } from "./logger";

/**
 * Initialize cross-tab synchronization listeners
 * Call this once during app initialization
 */
export const initializeCrossTabSync = () => {
  if (typeof window === "undefined") {
    logger.warn("auth", "Cross-tab sync: Not in browser environment, skipping");
    return;
  }

  logger.info("auth", "Initializing cross-tab synchronization");

  // Listen for storage changes from other tabs (native browser event)
  window.addEventListener("storage", (event) => {
    // Only handle changes to the profile key
    if (event.key === "profile") {
      if (event.newValue) {
        // Profile updated in another tab (token refresh or login)
        logger.info(
          "auth",
          "[CrossTabSync] Profile updated in another tab, syncing..."
        );
        setTimeout(() => store.dispatch(initializeAuth()), 0);
      } else if (event.oldValue && !event.newValue) {
        // Profile cleared in another tab (logout)
        logger.info("auth", "[CrossTabSync] Logout detected in another tab");
        setTimeout(() => store.dispatch(logout()), 0);
      }
    }
  });

  // Listen for custom token refresh events (dispatched by tokenRefresh.ts)
  window.addEventListener("tokenRefreshed", ((event: CustomEvent) => {
    const { access, refresh } = event.detail;
    logger.info("auth", "[CrossTabSync] Token refreshed in another tab", {
      hasAccess: !!access,
      hasRefresh: !!refresh,
    });

    // Refresh our Redux state with the new tokens
    setTimeout(() => store.dispatch(initializeAuth()), 0);
  }) as EventListener);

  // Listen for custom logout events
  window.addEventListener("logoutTriggered", (() => {
    logger.info("auth", "[CrossTabSync] Logout triggered in another tab");
    setTimeout(() => store.dispatch(logout()), 0);
  }) as EventListener);

  logger.info("auth", "Cross-tab synchronization initialized successfully");
};

/**
 * Broadcast logout to other tabs
 * Call this when user explicitly logs out
 */
export const broadcastLogout = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("logoutTriggered"));
  }
};

/**
 * Broadcast login to other tabs
 * Call this after successful login
 */
export const broadcastLogin = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("loginSuccessful"));
  }
};

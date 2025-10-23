/**
 * tokenRefreshMutex.ts - Ensures only one token refresh happens at a time
 * Prevents race conditions when multiple API calls or tabs attempt to refresh simultaneously
 */

class TokenRefreshMutex {
  private isRefreshing = false;
  private refreshPromise: Promise<string | null> | null = null;
  private subscribers: Array<(token: string | null) => void> = [];

  /**
   * Acquire the mutex to perform a token refresh
   * If a refresh is already in progress, wait for it to complete
   */
  async acquireRefresh(
    refreshFn: () => Promise<string | null>
  ): Promise<string | null> {
    // If already refreshing, wait for that refresh to complete
    if (this.isRefreshing && this.refreshPromise) {
      console.log("[TokenMutex] Refresh in progress, waiting...");
      return this.refreshPromise;
    }

    // Start new refresh
    this.isRefreshing = true;
    this.refreshPromise = this.executeRefresh(refreshFn);

    try {
      const result = await this.refreshPromise;
      return result;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  private async executeRefresh(
    refreshFn: () => Promise<string | null>
  ): Promise<string | null> {
    try {
      console.log("[TokenMutex] Executing token refresh");
      const newToken = await refreshFn();
      console.log("[TokenMutex] Token refresh successful");

      // Notify all subscribers
      this.notifySubscribers(newToken);

      return newToken;
    } catch (error) {
      console.error("[TokenMutex] Token refresh failed", error);
      this.notifySubscribers(null);
      throw error;
    }
  }

  private notifySubscribers(token: string | null) {
    this.subscribers.forEach((callback) => callback(token));
    this.subscribers = [];
  }

  /**
   * Subscribe to be notified when the current refresh completes
   * Useful for queued requests waiting for a new token
   */
  waitForRefresh(callback: (token: string | null) => void) {
    if (this.isRefreshing && this.refreshPromise) {
      this.subscribers.push(callback);
    }
  }

  /**
   * Check if a refresh is currently in progress
   */
  isCurrentlyRefreshing(): boolean {
    return this.isRefreshing;
  }
}

// Singleton instance
export const tokenRefreshMutex = new TokenRefreshMutex();

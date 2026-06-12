/**
 * apiHealthChecker.ts - API endpoint health monitoring
 * Monitors endpoint failures and provides health status
 */
import { logger } from "./logger";
import { API_BASE_URL } from "@/config/api";

interface EndpointHealth {
  endpoint: string;
  status: "healthy" | "degraded" | "failed";
  lastChecked: number;
  failureCount: number;
  lastError?: string;
}

export class ApiHealthChecker {
  private static endpoints: Map<string, EndpointHealth> = new Map();
  private static readonly MAX_FAILURES = 3;
  private static readonly HEALTH_CHECK_INTERVAL = 30000; // 30 seconds

  static init() {
    // Initialize common endpoints
    const commonEndpoints = [
      "api/wallet/wallets/",
      "/trading_engine/p2p/orders/",
      "/trading_engine/all-transactions/",
      "/administration/admin/changenow-tokens/",
      "/administration/admin/fronted-all-asset-network-range/",
    ];

    commonEndpoints.forEach((endpoint) => {
      this.endpoints.set(endpoint, {
        endpoint,
        status: "healthy",
        lastChecked: Date.now(),
        failureCount: 0,
      });
    });

    // Start periodic health checks
    this.startHealthChecks();
  }

  static recordFailure(endpoint: string, error: any) {
    const health = this.endpoints.get(endpoint) || {
      endpoint,
      status: "healthy",
      lastChecked: Date.now(),
      failureCount: 0,
    };

    health.failureCount++;
    health.lastError = error.message || "Unknown error";
    health.lastChecked = Date.now();

    // Update status based on failure count
    if (health.failureCount >= this.MAX_FAILURES) {
      health.status = "failed";
    } else if (health.failureCount > 1) {
      health.status = "degraded";
    }

    this.endpoints.set(endpoint, health);

   
  }

  static recordSuccess(endpoint: string) {
    const health = this.endpoints.get(endpoint);
    if (health) {
      health.status = "healthy";
      health.failureCount = 0;
      health.lastChecked = Date.now();
      delete health.lastError;

      this.endpoints.set(endpoint, health);

      logger.info("api", `API endpoint recovered`, {
        endpoint,
        status: "healthy",
      });
    }
  }

  static getEndpointStatus(
    endpoint: string
  ): "healthy" | "degraded" | "failed" {
    const health = this.endpoints.get(endpoint);
    return health?.status || "healthy";
  }

  static isEndpointHealthy(endpoint: string): boolean {
    return this.getEndpointStatus(endpoint) === "healthy";
  }

  static getHealthSummary(): Record<string, EndpointHealth> {
    const summary: Record<string, EndpointHealth> = {};
    this.endpoints.forEach((health, endpoint) => {
      summary[endpoint] = { ...health };
    });
    return summary;
  }

  static getFailedEndpoints(): string[] {
    const failed: string[] = [];
    this.endpoints.forEach((health, endpoint) => {
      if (health.status === "failed") {
        failed.push(endpoint);
      }
    });
    return failed;
  }

  private static async checkEndpointHealth(endpoint: string): Promise<boolean> {
    try {
      // Only check if user is authenticated
      if (typeof window === 'undefined') return true;
      
      const profile = localStorage.getItem('profile'); // Correct key
      if (!profile) {
        // No authentication, skip health checks
        return true;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const parsedProfile = JSON.parse(profile);
      const accessToken = parsedProfile?.tokens?.access;

      if (!accessToken) {
        return true; // Skip if no token
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "HEAD",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`, // Add auth header
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      logger.debug("api", `Health check failed for ${endpoint}:`, error);
      return false;
    }
  }

  private static async startHealthChecks() {
    setInterval(async () => {
      // Only run health checks if user is authenticated
      if (typeof window === 'undefined') return;
      
      const profile = localStorage.getItem('profile'); // Correct key
      if (!profile) {
        // No authentication, skip health checks
        return;
      }

      const failedEndpoints = this.getFailedEndpoints();

      // Only check failed endpoints to avoid spam
      for (const endpoint of failedEndpoints) {
        const isHealthy = await this.checkEndpointHealth(endpoint);

        if (isHealthy) {
          this.recordSuccess(endpoint);
          logger.info("api", `Endpoint ${endpoint} is back online`);
        } else {
          logger.debug("api", `Endpoint ${endpoint} still failing`);
        }
      }
    }, this.HEALTH_CHECK_INTERVAL);
  }

  static createHealthReport(): {
    healthy: number;
    degraded: number;
    failed: number;
    totalEndpoints: number;
  } {
    let healthy = 0;
    let degraded = 0;
    let failed = 0;

    this.endpoints.forEach((health) => {
      switch (health.status) {
        case "healthy":
          healthy++;
          break;
        case "degraded":
          degraded++;
          break;
        case "failed":
          failed++;
          break;
      }
    });

    return {
      healthy,
      degraded,
      failed,
      totalEndpoints: this.endpoints.size,
    };
  }
}

// Initialize on module load
ApiHealthChecker.init();

export default ApiHealthChecker;

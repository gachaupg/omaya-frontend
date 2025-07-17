/**
 * debugHelper.ts - Development debugging utilities
 * Provides console logging for API health and network status
 */
import ApiHealthChecker from "./apiHealthChecker";
import CircuitBreaker from "./circuitBreaker";

export class DebugHelper {
  static init() {
    if (
      typeof window !== "undefined" &&
      process.env.NODE_ENV === "development"
    ) {
      // Make debug functions available globally
      (window as any).debugAPI = {
        health: () => {
          const report = ApiHealthChecker.createHealthReport();
          const summary = ApiHealthChecker.getHealthSummary();

          console.group("🔍 API Health Report");
          console.log("📊 Summary:", report);
          console.log("📋 Detailed Status:", summary);
          console.log(
            "❌ Failed Endpoints:",
            ApiHealthChecker.getFailedEndpoints()
          );
          console.groupEnd();

          return { report, summary };
        },

        clearHealth: () => {
          console.log("🧹 Clearing API health data...");
          // This would need to be implemented in ApiHealthChecker
        },

        testEndpoint: async (endpoint: string) => {
          console.log(`🧪 Testing endpoint: ${endpoint}`);
          const status = ApiHealthChecker.getEndpointStatus(endpoint);
          console.log(`📡 Current status: ${status}`);
          return status;
        },

        circuitBreaker: () => {
          const circuits = CircuitBreaker.getAllCircuits();

          console.group("⚡ Circuit Breaker Status");
          Object.entries(circuits).forEach(([endpoint, state]) => {
            const stateEmoji =
              state.state === "CLOSED"
                ? "✅"
                : state.state === "OPEN"
                ? "🔴"
                : "🟡";
            console.log(
              `${stateEmoji} ${endpoint}: ${state.state} (failures: ${state.failureCount})`
            );

            if (state.state === "OPEN") {
              const timeLeft = Math.max(0, state.nextAttemptTime - Date.now());
              console.log(
                `   ⏰ Next attempt in: ${Math.round(timeLeft / 1000)}s`
              );
            }
          });
          console.groupEnd();

          return circuits;
        },

        resetCircuit: (endpoint: string) => {
          console.log(`🔄 Resetting circuit breaker for: ${endpoint}`);
          CircuitBreaker.resetCircuit(endpoint);
          return `Circuit breaker reset for ${endpoint}`;
        },
      };

      console.log("🚀 Debug utilities loaded:");
      console.log("  📊 window.debugAPI.health() - Check API health status");
      console.log(
        "  ⚡ window.debugAPI.circuitBreaker() - Check circuit breaker status"
      );
      console.log(
        "  🔄 window.debugAPI.resetCircuit(endpoint) - Reset circuit breaker for endpoint"
      );
    }
  }

  static logNetworkError(endpoint: string, error: any) {
    if (process.env.NODE_ENV === "development") {
      console.group(`🔥 Network Error: ${endpoint}`);
      console.error("Error details:", error);
      console.log("Error type:", error.constructor.name);
      console.log("Error code:", error.code);
      console.log("Response status:", error.response?.status);
      console.log("Response data:", error.response?.data);
      console.groupEnd();
    }
  }

  static logApiSuccess(endpoint: string, responseTime?: number) {
    if (process.env.NODE_ENV === "development") {
      console.log(
        `✅ API Success: ${endpoint}${
          responseTime ? ` (${responseTime}ms)` : ""
        }`
      );
    }
  }
}

// Initialize on module load
DebugHelper.init();

export default DebugHelper;

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

        
                    return { report, summary };
        },

        clearHealth: () => {
                    // This would need to be implemented in ApiHealthChecker
        },

        testEndpoint: async (endpoint: string) => {
          const status = ApiHealthChecker.getEndpointStatus(endpoint);
          return status;
        },

        circuitBreaker: () => {
          const circuits = CircuitBreaker.getAllCircuits();

        
          Object.entries(circuits).forEach(([endpoint, state]) => {
            const stateEmoji =
              state.state === "CLOSED"
                ? "✅"
                : state.state === "OPEN"
                ? "🔴"
                : "🟡";
          

            if (state.state === "OPEN") {
              const timeLeft = Math.max(0, state.nextAttemptTime - Date.now());
            
            }
          });
                    return circuits;
        },

        resetCircuit: (endpoint: string) => {
          CircuitBreaker.resetCircuit(endpoint);
          return `Circuit breaker reset for ${endpoint}`;
        },
      };

     
     
    }
  }

  static logNetworkError(endpoint: string, error: any) {
  }

  static logApiSuccess(endpoint: string, responseTime?: number) {
  }
}

// Initialize on module load
DebugHelper.init();

export default DebugHelper;

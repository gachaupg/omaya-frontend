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

        
          console.groupEnd();

          return { report, summary };
        },

        clearHealth: () => {
          console.log("Clearing API health data...");
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
          console.groupEnd();

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
    if (process.env.NODE_ENV === "development") {
    
    }
  }

  static logApiSuccess(endpoint: string, responseTime?: number) {
    if (process.env.NODE_ENV === "development") {
    
    }
  }
}

// Initialize on module load
DebugHelper.init();

export default DebugHelper;

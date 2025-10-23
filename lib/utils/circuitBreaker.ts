/**
 * circuitBreaker.ts - Circuit breaker pattern to prevent infinite API retries
 * Stops making requests to failing endpoints for a period of time
 */
import { logger } from "./logger";

interface CircuitBreakerState {
  endpoint: string;
  state: "CLOSED" | "OPEN" | "HALF_OPEN";
  failureCount: number;
  lastFailureTime: number;
  nextAttemptTime: number;
}

export class CircuitBreaker {
  private static circuits: Map<string, CircuitBreakerState> = new Map();
  private static readonly FAILURE_THRESHOLD = 3;
  private static readonly RECOVERY_TIMEOUT = 30000; // 30 seconds
  private static readonly HALF_OPEN_MAX_CALLS = 1;

  static isCallAllowed(endpoint: string): boolean {
    const circuit = this.getCircuit(endpoint);

    switch (circuit.state) {
      case "CLOSED":
        return true;

      case "OPEN":
        if (Date.now() >= circuit.nextAttemptTime) {
          circuit.state = "HALF_OPEN";
          logger.info(
            "api",
            `Circuit breaker moving to HALF_OPEN for ${endpoint}`
          );
          return true;
        }
        return false;

      case "HALF_OPEN":
        return true;

      default:
        return false;
    }
  }

  static onSuccess(endpoint: string): void {
    const circuit = this.getCircuit(endpoint);

    if (circuit.state === "HALF_OPEN") {
      circuit.state = "CLOSED";
      circuit.failureCount = 0;
      logger.info(
        "api",
        `Circuit breaker CLOSED for ${endpoint} - service recovered`
      );
    }

    circuit.failureCount = 0;
    this.circuits.set(endpoint, circuit);
  }

  static onFailure(endpoint: string, error: any): void {
    const circuit = this.getCircuit(endpoint);
    circuit.failureCount++;
    circuit.lastFailureTime = Date.now();

    // Check if we should open the circuit
    if (circuit.failureCount >= this.FAILURE_THRESHOLD) {
      circuit.state = "OPEN";
      circuit.nextAttemptTime = Date.now() + this.RECOVERY_TIMEOUT;

      logger.warn(
        "api",
        `Circuit breaker OPEN for ${endpoint} - too many failures`,
        {
          failureCount: circuit.failureCount,
          nextAttemptTime: new Date(circuit.nextAttemptTime).toISOString(),
          error: error.message,
        }
      );
    }

    this.circuits.set(endpoint, circuit);
  }

  static getCircuitState(endpoint: string): "CLOSED" | "OPEN" | "HALF_OPEN" {
    return this.getCircuit(endpoint).state;
  }

  static resetCircuit(endpoint: string): void {
    const circuit = this.getCircuit(endpoint);
    circuit.state = "CLOSED";
    circuit.failureCount = 0;
    circuit.lastFailureTime = 0;
    circuit.nextAttemptTime = 0;

    this.circuits.set(endpoint, circuit);
    logger.info("api", `Circuit breaker manually reset for ${endpoint}`);
  }

  static getAllCircuits(): Record<string, CircuitBreakerState> {
    const result: Record<string, CircuitBreakerState> = {};
    this.circuits.forEach((state, endpoint) => {
      result[endpoint] = { ...state };
    });
    return result;
  }

  private static getCircuit(endpoint: string): CircuitBreakerState {
    if (!this.circuits.has(endpoint)) {
      this.circuits.set(endpoint, {
        endpoint,
        state: "CLOSED",
        failureCount: 0,
        lastFailureTime: 0,
        nextAttemptTime: 0,
      });
    }

    return this.circuits.get(endpoint)!;
  }

  // Clean up old circuits periodically
  static cleanup(): void {
    const now = Date.now();
    const CLEANUP_THRESHOLD = 10 * 60 * 1000; // 10 minutes

    this.circuits.forEach((circuit, endpoint) => {
      if (
        circuit.state === "CLOSED" &&
        circuit.failureCount === 0 &&
        now - circuit.lastFailureTime > CLEANUP_THRESHOLD
      ) {
        this.circuits.delete(endpoint);
      }
    });
  }
}

// Initialize cleanup interval
if (typeof window !== "undefined") {
  setInterval(
    () => {
      CircuitBreaker.cleanup();
    },
    5 * 60 * 1000
  ); // Every 5 minutes
}

export default CircuitBreaker;

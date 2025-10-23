/**
 * logger.ts - Configurable logging system for production/development
 *
 * This provides a centralized logging system that can be:
 * - Turned on/off via environment variables
 * - Configured per feature/module
 * - Optimized for production (no overhead when disabled)
 * - Easy to maintain and debug
 */

// Environment-based configuration
const isDevelopment = process.env.NODE_ENV === "development";
const isProduction = process.env.NODE_ENV === "production";

// Feature-based logging control
const LOGGING_CONFIG = {
  // Core features
  auth: isDevelopment || process.env.NEXT_PUBLIC_LOG_AUTH === "true",
  navigation:
    isDevelopment || process.env.NEXT_PUBLIC_LOG_NAVIGATION === "true",
  api: isDevelopment || process.env.NEXT_PUBLIC_LOG_API === "true",

  // Feature modules
  p2p: isDevelopment || process.env.NEXT_PUBLIC_LOG_P2P === "true",
  exchange: isDevelopment || process.env.NEXT_PUBLIC_LOG_EXCHANGE === "true",
  swap: isDevelopment || process.env.NEXT_PUBLIC_LOG_SWAP === "true",
  dashboard: isDevelopment || process.env.NEXT_PUBLIC_LOG_DASHBOARD === "true",

  // Performance monitoring
  performance:
    isDevelopment || process.env.NEXT_PUBLIC_LOG_PERFORMANCE === "true",
  websocket: isDevelopment || process.env.NEXT_PUBLIC_LOG_WEBSOCKET === "true",

  // Debug modes
  redux: isDevelopment || process.env.NEXT_PUBLIC_LOG_REDUX === "true",
  errors: true, // Always log errors
  warnings: true, // Always log warnings
};

// Log levels
type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  module: string;
  message: string;
  data?: any;
  timestamp: string;
}

class Logger {
  private isEnabled(module: string): boolean {
    return LOGGING_CONFIG[module as keyof typeof LOGGING_CONFIG] || false;
  }

  private formatMessage(
    level: LogLevel,
    module: string,
    message: any,
    data?: any
  ): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}] [${module.toUpperCase()}]`;

    // Handle non-string messages
    const messageStr =
      typeof message === "string" ? message : JSON.stringify(message);

    if (data) {
      return `${prefix} ${messageStr} | Data: ${JSON.stringify(data, null, 2)}`;
    }

    return `${prefix} ${messageStr}`;
  }

  private log(level: LogLevel, module: string, message: any, data?: any): void {
    // Skip if module logging is disabled
    if (!this.isEnabled(module)) {
      return;
    }

    // Skip in production unless explicitly enabled
    if (isProduction && !this.isEnabled(module)) {
      return;
    }

    const formattedMessage = this.formatMessage(level, module, message, data);

    switch (level) {
      case "debug":
        console.debug(formattedMessage);
        break;
      case "info":
        console.info(formattedMessage);
        break;
      case "warn":
        console.warn(formattedMessage);
        break;
      case "error":
        console.error(formattedMessage);
        break;
    }
  }

  // Public API methods
  debug(module: string, message: any, ...args: any[]): void {
    this.log("debug", module, message, args.length > 0 ? args : undefined);
  }

  info(module: string, message: any, ...args: any[]): void {
    this.log("info", module, message, args.length > 0 ? args : undefined);
  }

  warn(module: string, message: any, ...args: any[]): void {
    this.log("warn", module, message, args.length > 0 ? args : undefined);
  }

  error(module: string, message: any, ...args: any[]): void {
    this.log("error", module, message, args.length > 0 ? args : undefined);
  }

  // Performance logging
  performance(
    module: string,
    operation: string,
    startTime: number,
    data?: any
  ): void {
    const duration = Date.now() - startTime;
    this.log(
      "info",
      "performance",
      `${operation} completed in ${duration}ms`,
      data
    );
  }

  // API logging
  api(
    module: string,
    method: string,
    url: string,
    status?: number,
    duration?: number
  ): void {
    const message = `${method} ${url}${status ? ` - ${status}` : ""}${duration ? ` (${duration}ms)` : ""}`;
    this.log("info", "api", message);
  }

  // Redux logging
  redux(module: string, action: string, state?: any): void {
    this.log("debug", "redux", `Action: ${action}`, state);
  }

  // Navigation logging
  navigation(
    module: string,
    from: string,
    to: string,
    duration?: number
  ): void {
    const message = `Navigation: ${from} → ${to}${duration ? ` (${duration}ms)` : ""}`;
    this.log("info", "navigation", message);
  }
}

// Create singleton instance
export const logger = new Logger();

// Convenience exports for common modules
export const authLogger = {
  debug: (message: any, ...args: any[]) =>
    logger.debug("auth", message, ...args),
  info: (message: any, ...args: any[]) => logger.info("auth", message, ...args),
  warn: (message: any, ...args: any[]) => logger.warn("auth", message, ...args),
  error: (message: any, ...args: any[]) =>
    logger.error("auth", message, ...args),
};

export const p2pLogger = {
  debug: (message: any, ...args: any[]) =>
    logger.debug("p2p", message, ...args),
  info: (message: any, ...args: any[]) => logger.info("p2p", message, ...args),
  warn: (message: any, ...args: any[]) => logger.warn("p2p", message, ...args),
  error: (message: any, ...args: any[]) =>
    logger.error("p2p", message, ...args),
};

export const apiLogger = {
  debug: (message: any, ...args: any[]) =>
    logger.debug("api", message, ...args),
  info: (message: any, ...args: any[]) => logger.info("api", message, ...args),
  warn: (message: any, ...args: any[]) => logger.warn("api", message, ...args),
  error: (message: any, ...args: any[]) =>
    logger.error("api", message, ...args),
};

export const performanceLogger = {
  start: (module: string, operation: string): number => {
    logger.debug("performance", `Starting ${operation}`, { module });
    return Date.now();
  },

  end: (
    module: string,
    operation: string,
    startTime: number,
    data?: any
  ): void => {
    logger.performance(module, operation, startTime, data);
  },

  measure: async <T>(
    module: string,
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> => {
    const startTime = performanceLogger.start(module, operation);
    try {
      const result = await fn();
      performanceLogger.end(module, operation, startTime);
      return result;
    } catch (error) {
      performanceLogger.end(module, `${operation} (ERROR)`, startTime, {
        error,
      });
      throw error;
    }
  },
};

// Environment variable documentation
export const LOGGING_ENV_VARS = {
  // Enable all logging in development
  NODE_ENV: "development",

  // Feature-specific logging (set to 'true' to enable in production)
  NEXT_PUBLIC_LOG_AUTH: "true",
  NEXT_PUBLIC_LOG_NAVIGATION: "true",
  NEXT_PUBLIC_LOG_API: "true",
  NEXT_PUBLIC_LOG_P2P: "true",
  NEXT_PUBLIC_LOG_EXCHANGE: "true",
  NEXT_PUBLIC_LOG_SWAP: "true",
  NEXT_PUBLIC_LOG_DASHBOARD: "true",
  NEXT_PUBLIC_LOG_PERFORMANCE: "true",
  NEXT_PUBLIC_LOG_WEBSOCKET: "true",
  NEXT_PUBLIC_LOG_REDUX: "true",
};

export default logger;

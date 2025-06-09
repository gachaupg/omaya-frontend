/**
 * Simple logger utility for API client
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogMessage {
  level: LogLevel;
  message: string;
  data?: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === "development";

  private formatMessage(logMessage: LogMessage): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] ${logMessage.level.toUpperCase()}: ${
      logMessage.message
    }`;
  }

  private log(level: LogLevel, message: string, data?: any) {
    const logMessage: LogMessage = { level, message, data };

    if (this.isDevelopment) {
      const formattedMessage = this.formatMessage(logMessage);
      switch (level) {
        case "debug":
          console.debug(formattedMessage, data || "");
          break;
        case "info":
          console.info(formattedMessage, data || "");
          break;
        case "warn":
          console.warn(formattedMessage, data || "");
          break;
        case "error":
          console.error(formattedMessage, data || "");
          break;
      }
    }
    // In production, you might want to send logs to a logging service
  }

  debug(message: string, data?: any) {
    this.log("debug", message, data);
  }

  info(message: string, data?: any) {
    this.log("info", message, data);
  }

  warn(message: string, data?: any) {
    this.log("warn", message, data);
  }

  error(message: string, data?: any) {
    this.log("error", message, data);
  }
}

export const logger = new Logger();

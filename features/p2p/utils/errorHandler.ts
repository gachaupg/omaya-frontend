import { AxiosError } from "axios";

export class P2PError extends Error {
  constructor(
    message: string,
    public code?: string,
    public status?: number,
    public details?: any
  ) {
    super(message);
    this.name = "P2PError";
  }
}

export const handleP2PError = (error: unknown): P2PError => {
  if (error instanceof AxiosError) {
    // Handle API errors
    const status = error.response?.status;
    const data = error.response?.data;

    switch (status) {
      case 400:
        return new P2PError(
          data?.message || "Invalid request data",
          "INVALID_REQUEST",
          status,
          data
        );
      case 401:
        return new P2PError("Authentication required", "UNAUTHORIZED", status);
      case 403:
        return new P2PError("Insufficient permissions", "FORBIDDEN", status);
      case 404:
        return new P2PError("Transaction not found", "NOT_FOUND", status);
      case 413:
        return new P2PError("File size too large", "FILE_TOO_LARGE", status);
      case 422:
        return new P2PError(
          data?.message || "Invalid transaction data",
          "VALIDATION_ERROR",
          status,
          data
        );
      case 429:
        return new P2PError("Too many requests", "RATE_LIMIT", status);
      case 500:
        return new P2PError("Internal server error", "SERVER_ERROR", status);
      default:
        return new P2PError(
          error.message || "An unexpected error occurred",
          "UNKNOWN_ERROR",
          status
        );
    }
  }

  // Handle non-API errors
  if (error instanceof Error) {
    return new P2PError(error.message, "UNKNOWN_ERROR");
  }

  // Handle unknown errors
  return new P2PError("An unexpected error occurred", "UNKNOWN_ERROR");
};

export const isP2PError = (error: unknown): error is P2PError => {
  return error instanceof P2PError;
};

export const getErrorMessage = (error: unknown): string => {
  if (isP2PError(error)) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "An unexpected error occurred";
};

/** User-visible P2P deposit/withdraw submit failure line. */
export function extractP2pSubmitApiError(error: unknown, fallback: string): string {
  const err = error as {
    response?: { data?: unknown };
    message?: string;
  };
  const data = err?.response?.data;

  if (typeof data === "string" && data.trim()) {
    return data.trim();
  }

  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    const msg = record.error ?? record.message ?? record.detail;
    if (typeof msg === "string" && msg.trim()) {
      return msg.trim();
    }
    if (Array.isArray(msg) && typeof msg[0] === "string") {
      return msg[0];
    }
  }

  const raw = String(err?.message || "").trim();
  if (
    raw &&
    !/request failed with status code \d+/i.test(raw) &&
    !/status code \d+/i.test(raw)
  ) {
    return raw;
  }

  return fallback;
}

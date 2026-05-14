import { AxiosError } from "axios";
import { showToast } from "./toast";

/**
 * Reads a human-readable message from typical API JSON bodies, e.g.
 * `{ "error": "Trade is not awaiting acceptance." }`,
 * `{ "message": "..." }`, DRF `detail`, nested `error.message`, or `non_field_errors`.
 */
export function extractMessageFromResponseData(data: unknown): string | null {
  if (data == null || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;

  const err = d.error;
  if (typeof err === "string" && err.trim()) {
    return err.trim();
  }
  if (err && typeof err === "object") {
    const eo = err as Record<string, unknown>;
    if (typeof eo.message === "string" && eo.message.trim()) {
      return eo.message.trim();
    }
    if (typeof eo.detail === "string" && eo.detail.trim()) {
      return eo.detail.trim();
    }
  }

  if (typeof d.message === "string" && d.message.trim()) {
    return d.message.trim();
  }

  if (typeof d.detail === "string" && d.detail.trim()) {
    return d.detail.trim();
  }

  if (Array.isArray(d.non_field_errors) && d.non_field_errors.length > 0) {
    const first = d.non_field_errors[0];
    if (typeof first === "string" && first.trim()) return first.trim();
  }

  return null;
}

/** Best-effort user-facing string for any thrown API/network error. */
export function getMessageFromApiError(error: unknown): string {
  if (error instanceof AxiosError) {
    if (!error.response) {
      return "Network error - please check your connection.";
    }
    const fromBody = extractMessageFromResponseData(error.response.data);
    if (fromBody) return fromBody;
    const status = error.response.status;
    if (status === 400) return "The server could not process this request.";
    if (status === 403) return "You do not have permission to do that.";
    if (status === 404) return "That resource was not found.";
    if (status >= 500) return "Server error - please try again later.";
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Something went wrong. Please try again.";
}

// Callback type for auth-related actions
type AuthCallback = () => void;

// Default auth callback that can be set by the app
let authCallback: AuthCallback = () => {
  window.location.href = "/auth/login";
};

// Flag to suppress 401 errors (useful for home page)
let suppress401Errors = false;

// Function to set the auth callback
export const setAuthCallback = (callback: AuthCallback) => {
  authCallback = callback;
};

// Function to suppress 401 errors globally
export const setSuppress401Errors = (suppress: boolean) => {
  suppress401Errors = suppress;
};

export const handleApiError = (error: unknown, options?: { suppress401?: boolean }) => {
  const shouldSuppress401 = options?.suppress401 || suppress401Errors;
  
  if (error instanceof AxiosError) {
    // Handle network errors
    if (!error.response) {
      if (!shouldSuppress401) {
        showToast.error("Network Error", "Please check your connection");
      }
      throw new Error("Network error - please check your connection");
    }

    // Handle API errors
    const status = error.response.status;
    const data = error.response.data;
    const bodyMessage = extractMessageFromResponseData(data);

    switch (status) {
      case 400:
        if (!shouldSuppress401) {
          showToast.error(
            "Request could not be completed",
            bodyMessage || "Invalid request."
          );
        }
        throw new Error(bodyMessage || "Bad request");
      case 401:
        // Silently suppress 401 errors if flag is set
        if (shouldSuppress401) {
          return;
        }
        authCallback();
        return;
      case 403:
        if (!shouldSuppress401) {
          showToast.error("Forbidden", "You don't have permission");
        }
        throw new Error("Forbidden - you don't have permission");
      case 404:
        if (!shouldSuppress401) {
          showToast.error("Not Found", "Resource not found");
        }
        throw new Error("Resource not found");
      case 500:
        if (!shouldSuppress401) {
          showToast.error("Server Error", "Please try again later");
        }
        throw new Error("Server error - please try again later");
      default:
        if (!shouldSuppress401) {
          showToast.error(
            "Something went wrong",
            bodyMessage || "An error occurred."
          );
        }
        throw new Error(bodyMessage || "An error occurred");
    }
  }

  // Handle non-Axios errors
  if (!shouldSuppress401) {
    showToast.error(
      "Error",
      error instanceof Error ? error.message : "An unexpected error occurred"
    );
  }
  throw error;
};

export const handleAuthError = handleApiError;
export const handleP2PError = handleApiError;

// Safe variant: does not throw. Returns a normalized error message string.
export const handleApiErrorSafe = (error: unknown, options?: { suppress401?: boolean }): string => {
  const shouldSuppress401 = options?.suppress401 || suppress401Errors;
  try {
    if (error instanceof AxiosError) {
      if (!error.response) {
        if (!shouldSuppress401) {
          showToast.error("Network Error", "Please check your connection");
        }
        return "Network error - please check your connection";
      }

      const status = error.response.status;
      const data: any = error.response.data || {};
      const bodyMessage = extractMessageFromResponseData(data);
      switch (status) {
        case 400:
          if (!shouldSuppress401) {
            showToast.error(
              "Request could not be completed",
              bodyMessage || "Invalid request."
            );
          }
          return bodyMessage || "Bad request";
        case 401:
          if (shouldSuppress401) return "Unauthorized";
          authCallback();
          return "Unauthorized";
        case 403:
          if (!shouldSuppress401) {
            showToast.error("Forbidden", "You don't have permission");
          }
          return "Forbidden - you don't have permission";
        case 404:
          if (!shouldSuppress401) {
            showToast.error("Not Found", "Resource not found");
          }
          return "Resource not found";
        case 500:
          if (!shouldSuppress401) {
            showToast.error("Server Error", "Please try again later");
          }
          return "Server error - please try again later";
        default:
          if (!shouldSuppress401) {
            showToast.error(
              "Something went wrong",
              bodyMessage || "An error occurred."
            );
          }
          return bodyMessage || "An error occurred";
      }
    }
    if (!shouldSuppress401) {
      showToast.error("Error", error instanceof Error ? error.message : "An unexpected error occurred");
    }
    return error instanceof Error ? error.message : "Unexpected error";
  } catch (e) {
    return "Unexpected error";
  }
};

export const handleP2PErrorSafe = handleApiErrorSafe;

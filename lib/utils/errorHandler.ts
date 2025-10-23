import { AxiosError } from "axios";
import { showToast } from "./toast";

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

    switch (status) {
      case 400:
        if (!shouldSuppress401) {
          showToast.error(
            "Error Trying to Make The Request",
            data.message || data.error || "Invalid request"
          );
        }
        throw new Error(data.message || data.error || "Bad request");
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
          showToast.error("Error", data.message || "An error occurred");
        }
        throw new Error(data.message || "An error occurred");
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

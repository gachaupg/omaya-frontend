import { useState, useCallback } from "react";
import { handleApiError } from "@/lib/utils/errorHandler";

interface ApiState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
}

interface UseApiOptions {
  maxRetries?: number;
  retryDelay?: number;
}

export function useApi<T>(
  apiCall: () => Promise<T>,
  options: UseApiOptions = {}
) {
  const { maxRetries = 2, retryDelay = 1000 } = options; // Total attempts
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    isLoading: false,
    error: null,
  });

  const execute = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    const maxAttempts = Math.max(1, maxRetries);
    let attempt = 1;

    while (attempt <= maxAttempts) {
      try {
        const data = await apiCall();
        setState({ data, isLoading: false, error: null });
        return data;
      } catch (error) {
        if (attempt === maxAttempts) {
          try {
            handleApiError(error);
          } catch (handledError) {
            const errorObj =
              handledError instanceof Error
                ? handledError
                : new Error("An error occurred");
            setState((prev) => ({
              ...prev,
              isLoading: false,
              error: errorObj,
            }));
            throw errorObj;
          }
        }
        attempt++;
        await new Promise((resolve) =>
          setTimeout(resolve, retryDelay * (attempt - 1))
        );
      }
    }
  }, [apiCall, maxRetries, retryDelay]);

  return {
    ...state,
    execute,
  };
}

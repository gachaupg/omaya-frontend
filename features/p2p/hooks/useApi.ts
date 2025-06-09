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
  const { maxRetries = 3, retryDelay = 1000 } = options;
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    isLoading: false,
    error: null,
  });

  const execute = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    let retries = 0;

    while (retries <= maxRetries) {
      try {
        const data = await apiCall();
        setState({ data, isLoading: false, error: null });
        return data;
      } catch (error) {
        if (retries === maxRetries) {
          const handledError = handleApiError(error);
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: handledError,
          }));
          throw handledError;
        }
        retries++;
        await new Promise((resolve) =>
          setTimeout(resolve, retryDelay * retries)
        );
      }
    }
  }, [apiCall, maxRetries, retryDelay]);

  return {
    ...state,
    execute,
  };
}

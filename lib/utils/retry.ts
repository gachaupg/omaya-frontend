import { AxiosError } from "axios";

interface RetryConfig {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
}

const defaultConfig: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffFactor: 2,
};

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const shouldRetry = (error: any): boolean => {
  // Do not retry for "amount too small" - ChangeNOW 400 Bad Request
  if (error?.message === "Amount you entered is too small") return false;
  if (error?.skipRetry === true) return false;
  return (
    !error?.response || // Network error
    (error.response.status >= 500 && error.response.status < 600) // Server error
  );
};

export const withRetry = async <T>(
  fn: () => Promise<T>,
  config: RetryConfig = {}
): Promise<T> => {
  const finalConfig = { ...defaultConfig, ...config };
  let lastError: Error | null = null;
  let delay = finalConfig.initialDelay!;

  for (let attempt = 0; attempt <= finalConfig.maxRetries!; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (
        !shouldRetry(error as AxiosError) ||
        attempt === finalConfig.maxRetries
      ) {
        throw error;
      }

      // Wait before retrying
      await sleep(delay);

      // Increase delay for next attempt
      delay = Math.min(
        delay * finalConfig.backoffFactor!,
        finalConfig.maxDelay!
      );
    }
  }

  throw lastError;
};

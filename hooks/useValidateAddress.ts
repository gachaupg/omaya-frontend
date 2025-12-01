/**
 * React hook for real-time address validation
 * Validates addresses as the user types with debouncing
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { validateAddress, ValidationResult } from "@/utils/validateAddress";

export interface UseValidateAddressOptions {
  /**
   * Currency code (e.g., 'btc', 'eth', 'usdt')
   */
  currency?: string;
  /**
   * Debounce delay in milliseconds (default: 500ms)
   */
  debounceMs?: number;
  /**
   * Minimum address length before validation (default: 10)
   */
  minLength?: number;
  /**
   * Whether to validate empty addresses (default: false)
   */
  validateEmpty?: boolean;
}

export interface UseValidateAddressReturn {
  /**
   * Validation result
   */
  result: ValidationResult | null;
  /**
   * Whether validation is in progress
   */
  isValidating: boolean;
  /**
   * Validation error message
   */
  error: string | null;
  /**
   * Manually trigger validation
   */
  validate: (address: string, currency?: string) => Promise<void>;
  /**
   * Reset validation state
   */
  reset: () => void;
}

/**
 * Hook for validating cryptocurrency addresses in real-time
 * 
 * @example
 * ```tsx
 * const { result, isValidating, error, validate } = useValidateAddress({
 *   currency: 'btc',
 *   debounceMs: 500,
 * });
 * 
 * <input 
 *   onChange={(e) => validate(e.target.value)}
 * />
 * {isValidating && <span>Validating...</span>}
 * {result && !result.isValid && <span>{result.message || 'Invalid address'}</span>}
 * ```
 */
export function useValidateAddress(
  options: UseValidateAddressOptions = {}
): UseValidateAddressReturn {
  const {
    currency: defaultCurrency,
    debounceMs = 500,
    minLength = 10,
    validateEmpty = false,
  } = options;

  const [result, setResult] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const validate = useCallback(
    async (address: string, currency?: string) => {
      const addressTrimmed = address.trim();
      const currencyToUse = currency || defaultCurrency;

      // Clear previous debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Cancel previous request if any
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Reset state for empty addresses
      if (!addressTrimmed) {
        if (!validateEmpty) {
          setResult(null);
          setIsValidating(false);
          setError(null);
          return;
        }
      }

      // Basic length check before API call
      if (addressTrimmed.length > 0 && addressTrimmed.length < minLength) {
        setResult({
          isValid: false,
          message: "Address seems too short",
          isActivated: null,
        });
        setIsValidating(false);
        setError(null);
        return;
      }

      // Check if currency is provided
      if (!currencyToUse) {
        setResult({
          isValid: false,
          message: "Please select a currency first",
          isActivated: null,
        });
        setIsValidating(false);
        setError(null);
        return;
      }

      // Set validating state immediately for better UX
      setIsValidating(true);
      setError(null);

      // Debounce the API call
      debounceTimerRef.current = setTimeout(async () => {
        try {
          // Create new abort controller for this request
          abortControllerRef.current = new AbortController();

          const validationResult = await validateAddress(
            currencyToUse,
            addressTrimmed
          );

          // Check if request was aborted
          if (abortControllerRef.current?.signal.aborted) {
            return;
          }

          setResult(validationResult);
          setError(validationResult.error || null);
        } catch (err: any) {
          // Check if request was aborted
          if (abortControllerRef.current?.signal.aborted) {
            return;
          }

          const errorMessage =
            err?.message || "Failed to validate address. Please try again.";
          setError(errorMessage);
          setResult({
            isValid: false,
            message: errorMessage,
            isActivated: null,
            error: errorMessage,
          });
        } finally {
          setIsValidating(false);
          abortControllerRef.current = null;
        }
      }, debounceMs);
    },
    [defaultCurrency, debounceMs, minLength, validateEmpty]
  );

  const reset = useCallback(() => {
    // Clear debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    // Cancel ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setResult(null);
    setIsValidating(false);
    setError(null);
  }, []);

  return {
    result,
    isValidating,
    error,
    validate,
    reset,
  };
}








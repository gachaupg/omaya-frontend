import React, { useState, useEffect, useCallback } from "react";

import { logger } from "@/lib/utils/logger";
import { useValidateAddress } from "@/hooks/useValidateAddress";

interface WalletAddressStepProps {
  walletAddress: string;
  onWalletAddressChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBack: () => void;
  onNext: () => void;
  fromAsset: any;
  toAsset: any;
  isLoading?: boolean;
}

const strongBorder =
  "border-[1.5px] border-gray-200 dark:border-[#35353E]";

const WalletAddressStep: React.FC<WalletAddressStepProps> = ({
  walletAddress,
  onWalletAddressChange,
  onBack,
  onNext,
  fromAsset,
  toAsset,
  isLoading = false,
}) => {
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);

  // Get currency from toAsset (the asset we're receiving)
  const getCurrencyFromAsset = useCallback((asset: any): string | undefined => {
    if (!asset) return undefined;

    // Try different properties in order of preference
    if (asset.ticker) {
      return asset.ticker.toUpperCase();
    } else if (asset.symbol) {
      // Handle special case for USDT Tether
      return asset.symbol === "USDT Tether" ? "USDT" : asset.symbol.toUpperCase();
    } else if (asset.name) {
      return asset.name.toUpperCase();
    }

    return undefined;
  }, []);

  const currentCurrency = getCurrencyFromAsset(toAsset);

  // Address validation hook - only API validation, no manual checks
  const {
    result: addressValidationResult,
    isValidating: isAddressValidating,
    error: addressValidationError,
    validate: validateAddress,
    reset: resetAddressValidation,
  } = useValidateAddress({
    currency: currentCurrency,
    debounceMs: 500,
    minLength: 0, // No manual length validation, let API handle it
    validateEmpty: false,
  });

  // Update wallet error based on API validation result only
  useEffect(() => {
    if (walletAddress.trim() === "") {
      setWalletError(null);
      return;
    }

    if (isAddressValidating) {
      // Don't show error while validating
      return;
    }

    // Only use API validation results
    if (addressValidationResult) {
      if (!addressValidationResult.isValid) {
        setWalletError(
          addressValidationResult.message ||
          addressValidationResult.error ||
          "Invalid address"
        );
      } else {
        setWalletError(null);
      }
    } else if (addressValidationError) {
      setWalletError(addressValidationError);
    }
  }, [
    addressValidationResult,
    addressValidationError,
    isAddressValidating,
    walletAddress,
  ]);

  // Reset validation when asset changes
  useEffect(() => {
    if (walletAddress.trim() && currentCurrency) {
      resetAddressValidation();
      validateAddress(walletAddress, currentCurrency);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCurrency]); // Only run when currency changes

  // Auto-validate on mount if wallet address is already present
  useEffect(() => {
    if (walletAddress.trim() && currentCurrency) {
      validateAddress(walletAddress, currentCurrency);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      // Create a synthetic event to update the wallet address
      const syntheticEvent = {
        target: { value: text },
      } as React.ChangeEvent<HTMLInputElement>;
      onWalletAddressChange(syntheticEvent);
      // Trigger validation after pasting
      if (text.trim() && currentCurrency) {
        validateAddress(text, currentCurrency);
      } else {
        resetAddressValidation();
      }
    } catch (err) {
      logger.error("swap", "Failed to read clipboard:", err);
    }
  };

  const handleNext = async () => {
    if (!hasAcceptedTerms) {
      // Show error or prevent proceeding
      return;
    }

    await onNext();
  };

  const trimmedWalletAddress = walletAddress.trim();
  const hasWalletInput = trimmedWalletAddress.length > 0;
  // Only block based on API validation results, no manual checks
  const shouldBlockForInvalidAddress =
    hasWalletInput &&
    !!addressValidationResult &&
    !addressValidationResult.isValid;
  const shouldBlockWhileValidating =
    hasWalletInput && isAddressValidating;
  const isSubmitDisabled =
    !hasAcceptedTerms ||
    !hasWalletInput ||
    isLoading ||
    !!walletError ||
    shouldBlockForInvalidAddress ||
    shouldBlockWhileValidating;

  return (
    <div className="w-full flex flex-col gap-2 sm:gap-4">
      <div className="mb-1 sm:mb-2 text-base sm:text-lg md:text-xl font-bold text-[#788099]">
        <span className="text-[#7e7e8f]">2-</span> Your Wallet Address
      </div>
      <div className="w-full">
        {/* Combined Wallet Address and Terms Card */}
        <div className={`bg-white dark:bg-[var(--card-color)] ${strongBorder} rounded-2xl p-3 sm:p-4 md:p-6 lg:p-8 w-full text-gray-900 dark:text-white`}>
          <div className="flex flex-col gap-3 sm:gap-4 md:gap-6">
            {/* Wallet Address Input Section */}
            <div className="flex flex-col gap-3 sm:gap-4">
              {/* Wallet/Account Address Label */}
              <div className="text-xs sm:text-sm font-medium text-[#788099]  dark:text-[#788099]">
                Wallet/Account Address
              </div>

              {/* Input Field with Paste Button */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                <div className="flex-1 relative">
                  <div className={`flex items-center bg-white dark:bg-[var(--card-color)] ${strongBorder} rounded-2xl px-2 sm:px-3 md:px-4 py-2 sm:py-3 min-h-[48px]`}>
                    {/* Wallet Icon */}
                    <svg
                      className="w-5 h-5 text-[#1D8751] mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                      />
                    </svg>

                    {/* Input Field */}
                    <input
                      type="text"
                      value={walletAddress}
                      onChange={(e) => {
                        onWalletAddressChange(e);
                        setWalletError(null); // Clear error immediately for better UX
                        // Validate address in real-time using the validation hook
                        if (e.target.value.trim() === "") {
                          resetAddressValidation();
                          setWalletError(null);
                        } else {
                          // Trigger validation as user types
                          validateAddress(e.target.value, currentCurrency);
                        }
                      }}
                      className={`flex-1 bg-transparent outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-[#7e7e8f] text-sm sm:text-base ${
                        walletError ? "text-red-500" : ""
                      }`}
                      placeholder={`Paste your ${toAsset?.name || toAsset?.symbol || ""} address here`}
                      disabled={isLoading}
                    />
                    {/* Validation status indicator - show based on API validation only */}
                    {walletAddress.trim() && (
                      <div className="absolute right-12 top-1/2 -translate-y-1/2 flex items-center">
                        {isAddressValidating ? (
                          <div className="w-4 h-4 border-2 border-[#1D8751] border-t-transparent rounded-full animate-spin"></div>
                        ) : addressValidationResult?.isValid ? (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-[#1D8751]">
                            <path
                              d="M9 12l2 2 4-4"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                          </svg>
                        ) : walletError ? (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-[#E23D3A]">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                            <path
                              d="M12 8v4M12 16h.01"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                            />
                          </svg>
                        ) : null}
                      </div>
                    )}

                    {/* Bookmark Icon */}
                    <svg
                      className="w-4 h-4 text-gray-400 dark:text-[#7e7e8f] ml-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                      />
                    </svg>
                  </div>
                </div>

                {/* Paste Button */}
                <button
                  onClick={handlePaste}
                  disabled={isLoading}
                  className="bg-[#1D8751] hover:bg-[#166b3e] disabled:bg-gray-500 disabled:cursor-not-allowed text-white px-4 sm:px-5 py-3 rounded-xl flex items-center justify-center gap-2 transition-colors min-h-[48px] w-full sm:w-auto"
                >
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5 text-white flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  <span className="text-xs sm:text-sm font-medium">Paste</span>
                </button>
              </div>
              
              {/* Validation messages - based on API validation only */}
              {walletAddress.trim() && (
                <div className="mt-2">
                  {isAddressValidating && (
                    <p className="text-[#1D8751] text-sm font-medium flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-[#1D8751] border-t-transparent rounded-full animate-spin"></div>
                      Validating address...
                    </p>
                  )}
                  {!isAddressValidating && walletError && (
                    <p className="text-red-500 text-sm font-medium flex items-center gap-2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                        <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                      {walletError}
                    </p>
                  )}
                  {!isAddressValidating && !walletError && addressValidationResult?.isValid && (
                    <p className="text-[#1D8751] text-sm font-medium flex items-center gap-2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                      </svg>
                      Valid address ✓
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Terms and Conditions Section */}
            <div className="flex flex-col gap-4">
              {/* Terms Header */}
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-[#1D8751]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3 className="text-gray-900 dark:text-[#788099] font-medium text-sm sm:text-base">
                  Terms and Conditions Summary
                </h3>
              </div>

              {/* Terms Box */}
              <div className={`bg-gray-50 dark:bg-[var(--card-color)] ${strongBorder} rounded-xl p-4 sm:p-5`}>
                <div className="space-y-2 sm:space-y-3">
                  {/* Term 1 */}
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="w-2 h-2 bg-[#1D8751] rounded-full mt-1.5 sm:mt-2 flex-shrink-0"></div>
                    <p className="text-xs sm:text-sm text-gray-900 dark:text-white">
                      Please send the money from your own account Only
                    </p>
                  </div>

                  {/* Term 2 */}
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="w-2 h-2 bg-[#1D8751] rounded-full mt-1.5 sm:mt-2 flex-shrink-0"></div>
                    <p className="text-xs sm:text-sm text-gray-900 dark:text-white">
                      Put transaction ID in the description field of the bank
                    </p>
                  </div>

                  {/* Term 3 */}
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="w-2 h-2 bg-[#1D8751] rounded-full mt-1.5 sm:mt-2 flex-shrink-0"></div>
                    <p className="text-xs sm:text-sm text-gray-900 dark:text-white">
                      Please note, If you do not follow above conditions, we
                      will reject your transaction and send you back your money.
                    </p>
                  </div>
                </div>
              </div>

              {/* Terms Acceptance Checkbox */}
              <div className="flex items-start gap-2 sm:gap-3">
                <input
                  type="checkbox"
                  id="accept-terms"
                  checked={hasAcceptedTerms}
                  onChange={(e) => setHasAcceptedTerms(e.target.checked)}
                  disabled={isLoading}
                  className="w-4 h-4 sm:w-5 sm:h-5 accent-[#1D8751] text-[#1D8751] bg-white dark:bg-[var(--card-color)] border-gray-300 dark:border-[#39394a] rounded focus:ring-[#1D8751] focus:ring-2 disabled:opacity-50 flex-shrink-0 cursor-pointer"
                />
                <label
                  htmlFor="accept-terms"
                  className="text-xs sm:text-sm text-[#1D8751] leading-relaxed cursor-pointer"
                >
                  <span className="text-gray-900 dark:text-white font-medium">
                    I have read and agreed to Omaya Exchange{" "}
                  </span>
                  <a
                    href="/legal/terms-of-service"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#1D8751] underline font-medium"
                  >
                    Terms of Use
                  </a>{" "}
                  
                  <a
                    href="/legal/privacy-policy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#1D8751] underline font-medium"
                  >
                    Privacy Policy
                  </a>
                  ,{" "}
                  <a
                    href="/legal/payment-policy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#1D8751] underline font-medium"
                  >
                    Payment Policies
                  </a>
                  ,{" "}
                  <span className="text-[#1D8751] font-medium">AML</span>,{" "}
                  <span className="text-[#1D8751] font-medium">
                    Risk Disclosure Statement
                  </span>
                  
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex mt-4 sm:mt-6">
          <button
            onClick={handleNext}
            disabled={isSubmitDisabled}
            className="flex-1 bg-[#1D8751] hover:bg-[#166b3e] disabled:bg-gray-500 disabled:cursor-not-allowed text-white px-4 sm:px-6 py-3 sm:py-3 rounded-3xl font-semibold text-sm sm:text-base transition-colors flex items-center justify-center gap-2 min-h-[48px]"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Processing...</span>
              </>
            ) : (
              "Submit"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WalletAddressStep;

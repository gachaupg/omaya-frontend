import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";

import { logger } from "@/lib/utils/logger";
import { useValidateAddress } from "@/hooks/useValidateAddress";
import { useBookmarkedAddresses } from "@/features/express/hooks/useBookmarkedAddresses";
import { BookmarkDropdown } from "@/features/express/components/forms/BookmarkDropdown";
import { useTheme } from "@/context/theme";

interface WalletAddressStepProps {
  walletAddress: string;
  onWalletAddressChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBack: () => void;
  onNext: () => void;
  fromAsset: any;
  toAsset: any;
  isLoading?: boolean;
  hasAcceptedTerms?: boolean;
  onHasAcceptedTermsChange?: (checked: boolean) => void;
  onBeforeLegalNavigate?: () => void;
  createSwapError?: string | null;
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
  hasAcceptedTerms: hasAcceptedTermsProp,
  onHasAcceptedTermsChange,
  onBeforeLegalNavigate,
  createSwapError,
}) => {
  const { isDark } = useTheme();
  const [internalHasAcceptedTerms, setInternalHasAcceptedTerms] = useState(false);
  const hasAcceptedTerms = hasAcceptedTermsProp ?? internalHasAcceptedTerms;
  const setHasAcceptedTerms = (checked: boolean) => {
    setInternalHasAcceptedTerms(checked);
    onHasAcceptedTermsChange?.(checked);
  };
  const [walletError, setWalletError] = useState<string | null>(null);
  const [expandedTerms, setExpandedTerms] = useState(false);
  const [bookmarkOpen, setBookmarkOpen] = useState(false);
  const bookmarkAnchorRef = useRef<HTMLSpanElement>(null);
  const errorBannerRef = useRef<HTMLParagraphElement>(null);

  // Helpers to derive currency/network from the target asset (needed before hooks below)
  const getCurrencyFromAsset = useCallback((asset: any): string | undefined => {
    if (!asset) return undefined;

    if (asset.ticker) {
      return asset.ticker.toUpperCase();
    } else if (asset.symbol) {
      return asset.symbol === "USDT Tether" ? "USDT" : asset.symbol.toUpperCase();
    } else if (asset.name) {
      return asset.name.toUpperCase();
    }

    return undefined;
  }, []);

  const getNetworkFromAsset = useCallback((asset: any): string | undefined => {
    if (!asset) return undefined;
    return asset.network || undefined;
  }, []);

  const currentCurrency = getCurrencyFromAsset(toAsset);
  const currentNetwork = getNetworkFromAsset(toAsset);

  const {
    bookmarks,
    loading: bookmarksLoading,
    saving: bookmarkSaving,
    fetchBookmarks,
    saveBookmark,
  } = useBookmarkedAddresses(currentCurrency, currentNetwork || undefined);

  // Address validation hook - only API validation, no manual checks
  const {
    result: addressValidationResult,
    isValidating: isAddressValidating,
    error: addressValidationError,
    validate: validateAddress,
    reset: resetAddressValidation,
  } = useValidateAddress({
    currency: currentCurrency,
    network: currentNetwork,
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

  // Scroll error into view when it appears
  useEffect(() => {
    if (walletError && errorBannerRef.current) {
      errorBannerRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [walletError]);

  // Reset validation when asset changes
  useEffect(() => {
    if (walletAddress.trim() && currentCurrency) {
      resetAddressValidation();
      validateAddress(walletAddress, currentCurrency, currentNetwork);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCurrency, currentNetwork]); // Only run when currency or network changes

  // Auto-validate on mount if wallet address is already present
  useEffect(() => {
    if (walletAddress.trim() && currentCurrency) {
      validateAddress(walletAddress, currentCurrency, currentNetwork);
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
        validateAddress(text, currentCurrency, currentNetwork);
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
<h2 className="mb-1 sm:mb-2 text-base sm:text-lg md:text-xl font-bold text-gray-900 dark:text-[#788099]">
  Your Wallet Address
</h2>

      <div className="w-full">
        {/* Combined Wallet Address and Terms Card */}
        <div className={`bg-white dark:bg-[var(--card-color)] ${strongBorder} rounded-2xl p-3 sm:p-3 md:p-4 lg:p-5 w-full text-gray-900 dark:text-white`}>
          <div className="flex flex-col gap-2 sm:gap-3 md:gap-4">
            {/* Wallet Address Input Section */}
            <div className="flex flex-col gap-2">
              {/* Wallet/Account Address Label */}
              <div className="text-xs sm:text-sm font-medium text-[#788099]  dark:text-[#788099]">
                Wallet/Account Address
              </div>

              {/* Input Field with Paste Button */}
              <div className={`flex items-center bg-white dark:bg-(--card-color) ${strongBorder} rounded-2xl px-2 sm:px-3 md:px-4 py-2 sm:py-3 min-h-12 gap-2`}>
                <div className="flex-1 relative min-w-0">
                  <div className="flex items-center">
                    {/* Wallet Icon */}
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5 text-[#1D8751] mr-2 sm:mr-3 shrink-0"
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
                        if (e.target.value.trim() === "") {
                          resetAddressValidation();
                          setWalletError(null);
                        } else {
                          validateAddress(e.target.value, currentCurrency, currentNetwork);
                        }
                      }}
                      className={`flex-1 bg-transparent outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-[#7e7e8f] text-xs sm:text-sm md:text-base min-w-0 pr-2 sm:pr-1 ${walletError ? "text-red-500" : ""
                        }`}
                      placeholder={`Paste ${toAsset?.name || toAsset?.symbol || ""} address`}
                      disabled={isLoading}
                    />

                    {/* Bookmark icon - clickable to load from bookmarks */}
                    <span
                      ref={bookmarkAnchorRef}
                      className="relative ml-auto shrink-0 text-[#1D8751] cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={async () => {
                        if (bookmarkOpen) {
                          setBookmarkOpen(false);
                          return;
                        }
                        setBookmarkOpen(true);
                        await fetchBookmarks();
                      }}
                      title="Load from bookmarks"
                    >
                      <svg
                        className="w-3 h-3 sm:w-4 sm:h-4"
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
                      <BookmarkDropdown
                        isOpen={bookmarkOpen}
                        onClose={() => setBookmarkOpen(false)}
                        bookmarks={bookmarks}
                        loading={bookmarksLoading}
                        saving={bookmarkSaving}
                        currentAddress={walletAddress}
                        asset={currentCurrency}
                        network={currentNetwork}
                        onSelect={(addr) => {
                          const syntheticEvent = {
                            target: { value: addr },
                          } as React.ChangeEvent<HTMLInputElement>;
                          onWalletAddressChange(syntheticEvent);
                          if (addr.trim() && currentCurrency) {
                            validateAddress(addr, currentCurrency, currentNetwork);
                          } else {
                            resetAddressValidation();
                          }
                        }}
                        onSaveCurrent={async () => {
                          try {
                            if (!walletAddress.trim() || !currentCurrency) return;
                            await saveBookmark({
                              address: walletAddress.trim(),
                              label: `My ${currentCurrency} wallet`,
                              network: currentNetwork || "",
                              asset: currentCurrency,
                            });
                          } catch { /* handled by hook */ }
                        }}
                        anchorRef={bookmarkAnchorRef}
                        isDark={isDark}
                        saveDisabled={isAddressValidating || !(addressValidationResult?.isValid)}
                      />
                    </span>
                  </div>
                </div>

                {/* Paste Button */}
                <button
                  onClick={handlePaste}
                  disabled={isLoading}
                  title="Paste"
                  className="bg-[#1D8751] hover:bg-[#166b3e] disabled:bg-gray-500 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded-xl flex items-center justify-center gap-2 transition-colors flex-shrink-0 whitespace-nowrap"
                >
                  <svg
                    className="w-4 h-4 text-white shrink-0"
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
                </button>
              </div>

              {/* Error - just below Wallet/Account Address input */}
              {walletError && (
                <p ref={errorBannerRef} className="mt-1 mb-0 text-red-500 text-xs sm:text-sm font-medium flex items-center gap-2 break-all">
                  <svg
                    className="w-4 h-4 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{walletError}</span>
                </p>
              )}

              {/* Validation messages - based on API validation only */}
              {walletAddress.trim() && (
                <div className="mt-1">
                  {isAddressValidating && (
                    <p className="text-[#1D8751] text-sm font-medium flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-[#1D8751] border-t-transparent rounded-full animate-spin"></div>
                      Validating address...
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

            {/* Save to bookmarks - visible under wallet input */}
            {walletAddress.trim() &&
              !isAddressValidating &&
              addressValidationResult?.isValid && (
              <button
                type="button"
                onClick={async () => {
                  if (!walletAddress.trim() || !currentCurrency) return;
                  await saveBookmark({
                    address: walletAddress.trim(),
                    label: `My ${currentCurrency} wallet`,
                    network: currentNetwork || "",
                    asset: currentCurrency,
                  });
                }}
                disabled={bookmarkSaving}
                className="flex items-center gap-2 text-[#1D8751] hover:text-[#166b3e] font-medium text-xs sm:text-sm transition-colors disabled:opacity-70"
              >
                {bookmarkSaving ? (
                  <span className="w-4 h-4 border-2 border-[#1D8751] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
                {bookmarkSaving ? "Saving to bookmarks..." : "Save to bookmarks"}
              </button>
            )}

            {/* Important Crypto Warning Banner */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/50 rounded-xl p-2 sm:p-3">
              <div className="flex items-start gap-2">
                <span className="text-yellow-600 dark:text-yellow-500 mt-0.5 flex-shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </span>
                <p className="text-xs sm:text-sm text-yellow-800 dark:text-yellow-200 font-medium">
                  <span className="font-bold">Important:</span> Please send only <span className="font-bold text-yellow-900 dark:text-yellow-100">{toAsset?.symbol || toAsset?.name || 'the selected asset'}</span> on <span className="font-bold text-yellow-900 dark:text-yellow-100">{currentNetwork || 'the selected network'}</span>. Any other Crypto or Network will be <span className="font-bold">lost Permanently</span>.
                </p>
              </div>
            </div>

            {/* Terms and Conditions Section */}
            <div className="flex flex-col gap-3">
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
                <h3 className="text-gray-900 dark:text-white font-medium text-sm sm:text-base">
                  Terms & Conditions
                </h3>
              </div>

              {/* Terms Box - Collapsible */}
              <div className={`bg-gray-50 dark:bg-[var(--card-color)] ${strongBorder} rounded-xl overflow-hidden transition-all duration-300`}>
                {/* Terms Section - All Visible */}
                <div className="p-3 sm:p-4">
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <span className="text-[#1D8751] font-bold text-sm sm:text-base flex-shrink-0">1.</span>
                      <p className="text-xs sm:text-sm text-gray-900 dark:text-white">
                        <span className="font-semibold">Send from your own wallet only:</span> You must send the crypto asset from a wallet that you personally own and control. Third-party or intermediary wallets are not allowed.
                      </p>
                    </div>

                    <div className="flex items-start gap-2 sm:gap-3">
                      <span className="text-[#1D8751] font-bold text-sm sm:text-base flex-shrink-0">2.</span>
                      <p className="text-xs sm:text-sm text-gray-900 dark:text-white">
                        <span className="font-semibold">Send the correct asset and network:</span> You must send {toAsset?.name || toAsset?.symbol || 'the asset'} on the {currentNetwork || 'selected network'} only. Sending any other asset or using a different network will result in PERMANENT LOSS of funds.
                      </p>
                    </div>

                    <div className="flex items-start gap-2 sm:gap-3">
                      <span className="text-[#1D8751] font-bold text-sm sm:text-base flex-shrink-0">3.</span>
                      <p className="text-xs sm:text-sm text-gray-900 dark:text-white">
                        <span className="font-semibold">Provide the correct receiving address:</span> You must enter the correct receiving wallet address for {toAsset?.name || toAsset?.symbol || 'the asset'} on {currentNetwork || 'the selected network'}. Putting any other asset or using a different network will result in PERMANENT LOSS of funds.
                      </p>
                    </div>
                  </div>

                </div>

                {/* Additional Terms - Collapsible */}
                {expandedTerms && (
                  <div className="px-3 sm:px-4 py-2 sm:py-3 space-y-3 sm:space-y-4 border-t border-gray-200 dark:border-[#35353E]">
                    {/* Term 4 */}
                    <div className="flex items-start gap-2 sm:gap-3">
                      <span className="text-[#1D8751] font-bold text-sm sm:text-base flex-shrink-0">4.</span>
                      <div className="flex-1">
                        <p className="text-xs sm:text-sm text-gray-900 dark:text-white font-semibold mb-2">
                          Irreversible transactions & user responsibility:
                        </p>
                        <p className="text-xs sm:text-sm text-gray-900 dark:text-white mb-2">
                          Blockchain transactions are irreversible. If you send:
                        </p>
                        <ul className="text-xs sm:text-sm text-gray-900 dark:text-white space-y-1 ml-3">
                          <li>• the wrong crypto asset,</li>
                          <li>• the wrong network, or</li>
                          <li>• an incorrect receiving address,</li>
                        </ul>
                        <p className="text-xs sm:text-sm text-gray-900 dark:text-white mt-2">
                          the funds will be permanently lost, and we will not be able to recover or assist in any way.
                        </p>
                      </div>
                    </div>

                    {/* Term 5 */}
                    <div className="flex items-start gap-2 sm:gap-3">
                      <span className="text-[#1D8751] font-bold text-sm sm:text-base flex-shrink-0">5.</span>
                      <div className="flex-1">
                        <p className="text-xs sm:text-sm text-gray-900 dark:text-white font-semibold mb-2">
                          Acceptance of terms:
                        </p>
                        <p className="text-xs sm:text-sm text-gray-900 dark:text-white">
                          Before sending any funds, you must confirm that you have read and accepted:
                        </p>
                        <ul className="text-xs sm:text-sm text-gray-900 dark:text-white space-y-1.5 ml-3 mt-2">
                          <li>• all the terms and conditions listed above, and</li>
                          <li>• our full <Link href="/legal/terms-of-service" rel="noopener noreferrer" className="text-[#1D8751] underline font-medium hover:text-[#166b3e]" onClick={onBeforeLegalNavigate}>Terms of Service</Link></li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Show More / Show Less Button */}
              <button
                type="button"
                onClick={() => setExpandedTerms(!expandedTerms)}
                className="mt-2 sm:mt-3 text-[#1D8751] hover:text-[#166b3e] font-semibold text-xs sm:text-sm flex items-center gap-1.5 transition-colors"
              >
                {expandedTerms ? (
                  <>
                    <span>Show Less</span>
                    <svg className="w-4 h-4 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </>
                ) : (
                  <>
                    <span>Show More</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </>
                )}
              </button>

              {/* Terms Acceptance Checkbox */}
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="accept-terms"
                  checked={hasAcceptedTerms}
                  onChange={(e) => setHasAcceptedTerms(e.target.checked)}
                  disabled={isLoading}
                  className="w-4 h-4 sm:w-5 sm:h-5 accent-[#1D8751] text-[#1D8751] bg-white dark:bg-[var(--card-color)] border-gray-300 dark:border-[#39394a] rounded disabled:opacity-50 shrink-0 cursor-pointer"
                />
                <label
                  htmlFor="accept-terms"
                  className="text-xs sm:text-sm text-gray-900 dark:text-white leading-relaxed cursor-pointer"
                >
                  <span className="font-medium">
                    I have read and agreed to Omaya Exchange{" "}
                  </span>
                  <Link
                    href="/legal/terms-of-service"
                    rel="noopener noreferrer"
                    className="text-[#1D8751] underline font-medium hover:text-[#166b3e]"
                    onClick={(e) => {
                      e.stopPropagation();
                      onBeforeLegalNavigate?.();
                    }}
                  >
                    Terms of Use
                  </Link>{" "}
                  <Link
                    href="/legal/privacy-policy"
                    rel="noopener noreferrer"
                    className="text-[#1D8751] underline font-medium hover:text-[#166b3e]"
                    onClick={(e) => {
                      e.stopPropagation();
                      onBeforeLegalNavigate?.();
                    }}
                  >
                    Privacy Policy
                  </Link>
                  ,{" "}
                  <Link
                    href="/legal/payment-policy"
                    rel="noopener noreferrer"
                    className="text-[#1D8751] underline font-medium hover:text-[#166b3e]"
                    onClick={(e) => {
                      e.stopPropagation();
                      onBeforeLegalNavigate?.();
                    }}
                  >
                    Payment Policies
                  </Link>
                  ,{" "}
                  <Link
                    href="/legal/aml-policy"
                    rel="noopener noreferrer"
                    className="text-[#1D8751] font-medium underline hover:text-[#166b3e]"
                    onClick={(e) => {
                      e.stopPropagation();
                      onBeforeLegalNavigate?.();
                    }}
                  >
                    AML
                  </Link>
                  ,{" "}
                  <Link
                    href="/legal/risk-disclosure-statement"
                    rel="noopener noreferrer"
                    className="text-[#1D8751] font-medium underline hover:text-[#166b3e]"
                    onClick={(e) => {
                      e.stopPropagation();
                      onBeforeLegalNavigate?.();
                    }}
                  >
                    Risk Disclosure Statement
                  </Link>

                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Create swap error - amount too small (ChangeNOW 400 / Failed to create transaction) */}
        {createSwapError &&
          (createSwapError === "Amount you entered is too small" ||
            (createSwapError.toLowerCase().includes("failed to create transaction") &&
              (createSwapError.includes("400") || createSwapError.toLowerCase().includes("changenow")))) && (
          <div className="mt-3 mb-2 bg-red-500/10 border border-red-500/30 rounded-xl p-2 sm:p-3 flex items-start gap-2">
            <span className="text-red-500 text-xs font-bold flex-shrink-0">!</span>
            <p className="text-red-600 dark:text-red-400 text-xs sm:text-sm">
              Amount is too small
            </p>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex mt-3 sm:mt-4">
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

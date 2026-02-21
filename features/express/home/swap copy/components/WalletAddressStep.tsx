import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useTheme } from "@/context/theme";
import { logger } from "@/lib/utils/logger";
import { useValidateAddress } from "@/hooks/useValidateAddress";
import { SupportedAsset } from "../types";
import { useBookmarkedAddresses } from "@/features/express/hooks/useBookmarkedAddresses";
import { BookmarkDropdown } from "@/features/express/components/forms/BookmarkDropdown";

interface WalletAddressStepProps {
  walletAddress: string;
  onWalletAddressChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBack: () => void;
  onNext: () => void;
  fromAsset: SupportedAsset | null;
  toAsset: SupportedAsset | null;
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
  const { isDark } = useTheme();
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [expandedTerms, setExpandedTerms] = useState(false);
  const [bookmarkOpen, setBookmarkOpen] = useState(false);
  const bookmarkAnchorRef = useRef<HTMLSpanElement>(null);

  const getCurrencyFromAsset = useCallback((asset: SupportedAsset | null): string | undefined => {
    if (!asset) return undefined;
    if (asset.ticker) return asset.ticker.toUpperCase();
    if (asset.symbol) return asset.symbol === "USDT Tether" ? "USDT" : asset.symbol.toUpperCase();
    if (asset.name) return asset.name.toUpperCase();
    return undefined;
  }, []);

  const getNetworkFromAsset = useCallback((asset: SupportedAsset | null): string | undefined => {
    if (!asset) return undefined;
    return asset.network || undefined;
  }, []);

  const receiveAssetName = toAsset?.name || toAsset?.symbol || toAsset?.ticker || "the selected asset";
  const currentCurrency = getCurrencyFromAsset(toAsset);
  const sendAssetName = fromAsset?.name || fromAsset?.symbol || fromAsset?.ticker || "the selected asset";
  const sendNetwork = fromAsset?.network || "the selected network";
  const currentNetwork = getNetworkFromAsset(toAsset);

  const {
    bookmarks,
    loading: bookmarksLoading,
    saving: bookmarkSaving,
    fetchBookmarks,
    saveBookmark,
  } = useBookmarkedAddresses(currentCurrency, currentNetwork || undefined);

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
    minLength: 0,
    validateEmpty: false,
  });

  useEffect(() => {
    if (walletAddress.trim() === "") {
      setWalletError(null);
      return;
    }
    if (isAddressValidating) return;
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

  useEffect(() => {
    if (walletAddress.trim() && currentCurrency) {
      resetAddressValidation();
      validateAddress(walletAddress, currentCurrency, currentNetwork);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCurrency, currentNetwork]);

  useEffect(() => {
    if (walletAddress.trim() && currentCurrency) {
      validateAddress(walletAddress, currentCurrency, currentNetwork);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const syntheticEvent = {
        target: { value: text },
      } as React.ChangeEvent<HTMLInputElement>;
      onWalletAddressChange(syntheticEvent);
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
    if (!hasAcceptedTerms) return;
    await onNext();
  };

  const trimmedWalletAddress = walletAddress.trim();
  const hasWalletInput = trimmedWalletAddress.length > 0;
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
    <div className="w-full flex flex-col px-1 sm:px-0">
      <h2 className="text-lg sm:text-xl font-bold mb-2 text-[#788099] inline-flex items-center gap-2">
        Paste {receiveAssetName} address
      </h2>
      <div className="w-full mx-auto">
        {/* Combined Wallet Address and Terms Card */}
        <div className={`flex flex-col rounded-2xl p-3 sm:p-5 shadow-lg w-full ${
          isDark ? "bg-[#0F0F17] border border-accent" : "bg-white border border-[#E2E8F0]"
        } text-[#35353e] dark:text-[#788099]`}>
          <div className="flex flex-col gap-4 sm:gap-6">
            {/* Wallet Address Input Section */}
            <div className="flex flex-col gap-2 sm:gap-4">
              <label className="block text-sm sm:text-[17px] text-[#7e7e8f] mb-1 sm:mb-2 font-semibold">
                Wallet/Account Address
              </label>
              <div className={`flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-2 rounded-xl sm:rounded-2xl px-3 sm:px-4 py-3 sm:py-2 mb-2 sm:mb-4 ${
                isDark 
                  ? "bg-[#2a2a33] border-2 border-[#4a4a55] sm:border sm:border-[#39394a] sm:bg-transparent" 
                  : "bg-[#f5f7fa] border-2 border-[#d1d5db] sm:border sm:border-[#39394a] sm:bg-transparent"
              }`}>
                <div className={`flex items-center flex-1 min-w-0 rounded-lg px-2 py-2 sm:p-0 ${
                  isDark 
                    ? "bg-[#1D1D23] border border-[#5a5a66] sm:border-0 sm:bg-transparent" 
                    : "bg-white border border-[#c4c9d4] sm:border-0 sm:bg-transparent"
                }`}>
                  <span className="mr-2 text-[#1D8751] shrink-0">
                    <svg width="20" height="20" className="sm:w-[22px] sm:h-[22px]" fill="none" viewBox="0 0 24 24">
                      <path
                        d="M7 17v2a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"
                        stroke="#1D8751"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <rect
                        x="3"
                        y="3"
                        width="12"
                        height="12"
                        rx="2"
                        stroke="#1D8751"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <input
                    type="text"
                    value={walletAddress}
                    onChange={(e) => {
                      onWalletAddressChange(e);
                      setWalletError(null);
                      if (e.target.value.trim() === "") {
                        resetAddressValidation();
                        setWalletError(null);
                      } else {
                        validateAddress(e.target.value, currentCurrency, currentNetwork);
                      }
                    }}
                    placeholder={`Paste ${currentCurrency || receiveAssetName} address`}
                    className={`flex-1 min-w-0 bg-transparent border-none outline-none text-[#35353e] dark:text-[#788099] placeholder-[#788099] text-xs sm:text-base ${walletError ? "text-red-500" : ""}`}
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
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
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
                        const syntheticEvent = { target: { value: addr } } as React.ChangeEvent<HTMLInputElement>;
                        onWalletAddressChange(syntheticEvent);
                        if (addr.trim() && currentCurrency) {
                          validateAddress(addr, currentCurrency, currentNetwork);
                        } else {
                          resetAddressValidation();
                        }
                      }}
                      onSaveCurrent={async () => {
                        if (!walletAddress.trim() || !currentCurrency) return;
                        await saveBookmark({
                          address: walletAddress.trim(),
                          label: `My ${currentCurrency} wallet`,
                          network: currentNetwork || "",
                          asset: currentCurrency,
                        });
                      }}
                      anchorRef={bookmarkAnchorRef}
                      isDark={isDark}
                    />
                  </span>
                </div>
                <button
                  onClick={handlePaste}
                  disabled={isLoading}
                  className={`flex items-center justify-center gap-1 border text-[#1D8751] rounded-full px-3 sm:px-4 py-2 sm:py-1 lg:ml-2 font-semibold text-sm sm:text-base hover:bg-[#1D8751] hover:text-white transition-colors shrink-0 w-full lg:w-auto ${
                    isDark ? "bg-[#1D1D23] border-[#1D8751]" : "bg-transparent border-[#1D8751]"
                  }`}
                >
                  <svg width="16" height="16" className="sm:w-[18px] sm:h-[18px]" fill="none" viewBox="0 0 24 24">
                    <path
                      d="M19 21H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4l2-2h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Paste
                </button>
              </div>
              {walletError && (
                <p className="mt-2 text-red-500 text-xs sm:text-sm font-medium flex items-center gap-2 break-all">
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{walletError}</span>
                </p>
              )}
              {walletAddress.trim() && (
                <div className="mt-2">
                  {isAddressValidating && (
                    <p className="text-[#1D8751] text-sm font-medium flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-[#1D8751] border-t-transparent rounded-full animate-spin" />
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

            {/* Important Crypto Warning Banner */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/50 rounded-xl p-3 sm:p-4">
              <div className="flex items-start gap-2 sm:gap-3">
                <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-xs sm:text-sm text-yellow-800 dark:text-yellow-200 font-medium">
                  <span className="font-bold">Important:</span> Please send only <span className="font-bold text-yellow-900 dark:text-yellow-100">{sendAssetName}</span> on <span className="font-bold text-yellow-900 dark:text-yellow-100">{sendNetwork}</span>. Any other Crypto or Network will be <span className="font-bold">lost Permanently</span>.
                </p>
              </div>
            </div>

            {/* Terms and Conditions Section */}
            <div className="flex flex-col gap-4">
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
                <h3 className={`font-medium text-sm sm:text-base ${isDark ? "text-white" : "text-gray-900"}`}>
                  Terms & Conditions
                </h3>
              </div>

              {/* Terms Box - Collapsible */}
              <div className={`${isDark ? "bg-[#1D1D23]" : "bg-gray-50"} ${strongBorder} rounded-xl overflow-hidden transition-all duration-300`}>
                <div className="p-4 sm:p-5">
                  <div className={`space-y-2 sm:space-y-3 ${expandedTerms ? "" : "line-clamp-3"}`}>
                    <div className="flex items-start gap-2 sm:gap-3">
                      <span className="text-[#1D8751] font-bold text-sm sm:text-base shrink-0">1.</span>
                      <p className={`text-xs sm:text-sm ${isDark ? "text-[#788099]" : "text-gray-900"}`}>
                        <span className="font-semibold">Send from your own wallet only:</span> You must send the crypto asset from a wallet that you personally own and control. Third-party or intermediary wallets are not allowed.
                      </p>
                    </div>
                    <div className="flex items-start gap-2 sm:gap-3">
                      <span className="text-[#1D8751] font-bold text-sm sm:text-base shrink-0">2.</span>
                      <p className={`text-xs sm:text-sm ${isDark ? "text-[#788099]" : "text-gray-900"}`}>
                        <span className="font-semibold">Send the correct asset and network:</span> You must send {sendAssetName} on the {sendNetwork} only. Sending any other asset or using a different network will result in PERMANENT LOSS of funds.
                      </p>
                    </div>
                    <div className="flex items-start gap-2 sm:gap-3">
                      <span className="text-[#1D8751] font-bold text-sm sm:text-base shrink-0">3.</span>
                      <p className={`text-xs sm:text-sm ${isDark ? "text-[#788099]" : "text-gray-900"}`}>
                        <span className="font-semibold">Provide the correct receiving address:</span> You must enter the correct receiving wallet address for {sendAssetName} on {sendNetwork}. Putting any other asset or using a different network will result in PERMANENT LOSS of funds.
                      </p>
                    </div>
                  </div>
                </div>

                {expandedTerms && (
                  <div className={`px-4 sm:px-5 pb-4 sm:pb-5 space-y-4 sm:space-y-5`}>
                    <div className="flex items-start gap-2 sm:gap-3">
                      <span className="text-[#1D8751] font-bold text-sm sm:text-base shrink-0">4.</span>
                      <div className="flex-1">
                        <p className={`text-xs sm:text-sm font-semibold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>
                          Irreversible transactions & user responsibility:
                        </p>
                        <p className={`text-xs sm:text-sm mb-2 ${isDark ? "text-[#788099]" : "text-gray-900"}`}>
                          Blockchain transactions are irreversible. If you send:
                        </p>
                        <ul className={`text-xs sm:text-sm space-y-1 ml-3 ${isDark ? "text-[#788099]" : "text-gray-900"}`}>
                          <li>• the wrong crypto asset,</li>
                          <li>• the wrong network, or</li>
                          <li>• an incorrect receiving address,</li>
                        </ul>
                        <p className={`text-xs sm:text-sm mt-2 ${isDark ? "text-[#788099]" : "text-gray-900"}`}>
                          the funds will be permanently lost, and we will not be able to recover or assist in any way.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 sm:gap-3">
                      <span className="text-[#1D8751] font-bold text-sm sm:text-base shrink-0">5.</span>
                      <div className="flex-1">
                        <p className={`text-xs sm:text-sm font-semibold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>
                          Acceptance of terms:
                        </p>
                        <p className={`text-xs sm:text-sm ${isDark ? "text-[#788099]" : "text-gray-900"}`}>
                          Before sending any funds, you must confirm that you have read and accepted:
                        </p>
                        <ul className={`text-xs sm:text-sm space-y-1.5 ml-3 mt-2 ${isDark ? "text-[#788099]" : "text-gray-900"}`}>
                          <li>• all the terms and conditions listed above, and</li>
                          <li>• our full <Link href="/legal/terms-of-service" target="_blank" rel="noopener noreferrer" className="text-[#1D8751] underline font-medium hover:text-[#166b3e]">Terms of Service</Link></li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
                 <button
                    onClick={() => setExpandedTerms(!expandedTerms)}
                    className="mb-3 sm:mb-4 mx-11 text-[#1D8751] hover:text-[#166b3e] font-semibold text-xs sm:text-sm flex items-center gap-1.5 transition-colors"
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
              </div>

              {/* Terms Acceptance Checkbox */}
              <label
                className={`flex items-start gap-3 cursor-pointer select-none mt-2 p-3 rounded-xl border ${
                  isDark
                    ? "border-accent hover:bg-[#1a1a22]"
                    : "border-[#E2E8F0] hover:bg-[#f8fafc]"
                } transition-colors`}
              >
                <input
                  type="checkbox"
                  checked={hasAcceptedTerms}
                  onChange={(e) => setHasAcceptedTerms(e.target.checked)}
                  disabled={isLoading}
                  className="mt-0.5 w-4 h-4 sm:w-5 sm:h-5 rounded border-2 border-[#1D8751] text-[#1D8751] focus:ring-[#1D8751] focus:ring-offset-0 cursor-pointer"
                />
                <span className={`text-xs sm:text-sm ${isDark ? "text-[#788099]" : "text-[#475569]"}`}>
                  I have read and agreed to Omaya Exchange{" "}
                  <Link href="/legal/terms-of-service" target="_blank" rel="noopener noreferrer" className="text-[#1D8751] underline font-medium hover:text-[#166b3e]">
                    Terms of Use
                  </Link>
                  ,{" "}
                  <Link href="/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-[#1D8751] underline font-medium hover:text-[#166b3e]">
                    Privacy Policy
                  </Link>
                  ,{" "}
                  <Link href="/legal/payment-policy" target="_blank" rel="noopener noreferrer" className="text-[#1D8751] underline font-medium hover:text-[#166b3e]">
                    Payment Policies
                  </Link>
                  ,{" "}
                  <Link href="/legal/aml-policy" target="_blank" rel="noopener noreferrer" className="text-[#1D8751] font-medium underline hover:text-[#166b3e]">
                    AML
                  </Link>
                  ,{" "}
                  <Link href="/legal/risk-disclosure-statement" target="_blank" rel="noopener noreferrer" className="text-[#1D8751] font-medium underline hover:text-[#166b3e]">
                    Risk Disclosure Statement
                  </Link>
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex flex-col gap-3 w-full px-0 sm:px-2 mt-3 sm:mt-4">
          <button
            onClick={handleNext}
            disabled={isSubmitDisabled}
            className={`w-full text-sm sm:text-base font-medium py-2.5 sm:py-2 rounded-2xl flex items-center justify-center gap-2 transition-colors text-white ${
              isLoading || !hasWalletInput || !hasAcceptedTerms
                ? "bg-gray-500 cursor-not-allowed"
                : "bg-[#1D8751] hover:bg-[#166b3e]"
            }`}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-[#35353e] dark:border-accent"></div>
                <span className="text-sm sm:text-base">Processing...</span>
              </div>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <span className="text-sm sm:text-base font-medium text-white">Swap</span>
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WalletAddressStep;

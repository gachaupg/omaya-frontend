import React, { useState } from "react";

import { logger } from "@/lib/utils/logger";

interface WalletAddressStepProps {
  walletAddress: string;
  onWalletAddressChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBack: () => void;
  onNext: () => void;
  fromAsset: any;
  toAsset: any;
  isLoading?: boolean;
}

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

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      // Create a synthetic event to update the wallet address
      const syntheticEvent = {
        target: { value: text },
      } as React.ChangeEvent<HTMLInputElement>;
      onWalletAddressChange(syntheticEvent);
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

  return (
    <div className="w-full flex flex-col px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      <div className="mb-2 text-base sm:text-lg md:text-xl font-bold text-[#788099]">
        <span className="text-[#7e7e8f]">2-</span> Your Wallet Address
      </div>
      <div className="w-full mx-auto">
        {/* Combined Wallet Address and Terms Card */}
        <div className="bg-transparent dark:bg-transparent border border-gray-200 dark:border-[#35353E] rounded-2xl p-5 sm:p-6 lg:p-8 shadow-lg w-full text-gray-900 dark:text-white">
          <div className="flex flex-col gap-4 sm:gap-6">
            {/* Wallet Address Input Section */}
            <div className="flex flex-col gap-3 sm:gap-4">
              {/* Wallet/Account Address Label */}
              <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                Wallet/Account Address
              </div>

              {/* Input Field with Paste Button */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                <div className="flex-1 relative">
                  <div className="flex items-center bg-white dark:bg-[#1D1D23] border border-gray-300 dark:border-[#39394a] rounded-2xl px-3 sm:px-4 py-3 min-h-[48px]">
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
                      onChange={onWalletAddressChange}
                      className="flex-1 bg-transparent outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-[#7e7e8f] text-sm sm:text-base"
                      placeholder={`Paste your ${toAsset?.name || toAsset?.symbol || ""} address here`}
                      disabled={isLoading}
                    />

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
                <h3 className="text-gray-900 dark:text-white font-medium text-sm sm:text-base">
                  Terms and Conditions Summary
                </h3>
              </div>

              {/* Terms Box */}
              <div className="bg-gray-50 dark:bg-[#23232b] border border-[#1D8751] dark:border-[#1D8751] rounded-xl p-4 sm:p-5">
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
                  className="w-4 h-4 sm:w-5 sm:h-5 text-[#1D8751] bg-white dark:bg-[#1D1D23] border-gray-300 dark:border-[#39394a] rounded focus:ring-[#1D8751] focus:ring-2 disabled:opacity-50 flex-shrink-0"
                />
                <label
                  htmlFor="accept-terms"
                  className="text-xs sm:text-sm text-[#1D8751] leading-relaxed"
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
                  (
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
                  )
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex mt-4 sm:mt-6">
          <button
            onClick={handleNext}
            disabled={!hasAcceptedTerms || !walletAddress.trim() || isLoading}
            className="flex-1 bg-[#1D8751] hover:bg-[#166b3e] disabled:bg-gray-500 disabled:cursor-not-allowed text-white px-4 sm:px-6 py-3 sm:py-3 rounded-2xl font-semibold text-sm sm:text-base transition-colors flex items-center justify-center gap-2 min-h-[48px]"
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

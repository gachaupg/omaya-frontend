import React, { useState } from "react";

interface WalletAddressStepProps {
  walletAddress: string;
  onWalletAddressChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  walletValidationError: string;
  onBack: () => void;
  onNext: () => void;
  fromAsset: any;
  isLoading?: boolean;
}

const WalletAddressStep: React.FC<WalletAddressStepProps> = ({
  walletAddress,
  onWalletAddressChange,
  walletValidationError,
  onBack,
  onNext,
  fromAsset,
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
      console.error("Failed to read clipboard:", err);
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
    <div className="mb-8">
      <div className="mb-2 text-base font-semibold">3- Your Wallet Address</div>

      {/* Combined Wallet Address and Terms Card */}
      <div className="bg-[#1D1D23] border-2 border-[#35353E] rounded-xl p-5">
        <div className="flex flex-col gap-6">
          {/* Wallet Address Input Section */}
          <div className="flex flex-col gap-4">
            {/* Wallet/Account Address Label */}
            <div className="text-sm font-medium dark:text-white text-[#0D0D0D]">
              Wallet/Account Address
            </div>

            {/* Input Field with Paste Button */}
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <div className="flex items-center dark:bg-[#181820] bg-white border dark:border-[#35353E] border-gray-300 rounded-lg px-3 py-3">
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
                    className="flex-1 bg-transparent outline-none dark:text-white text-[#0D0D0D] dark:placeholder-[#8C8CA1] placeholder-gray-500"
                    placeholder="Paste here your Crypto address"
                    disabled={isLoading}
                  />

                  {/* Bookmark Icon */}
                  <svg
                    className="w-4 h-4 dark:text-[#8C8CA1] text-[#788099] ml-2"
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
                className="dark:bg-[#35353E] bg-gray-300 hover:dark:bg-[#40404A] hover:bg-gray-400 disabled:dark:bg-[#35353E] disabled:bg-gray-300 disabled:cursor-not-allowed dark:text-white text-[#0D0D0D] px-4 py-3 rounded-lg flex items-center gap-2 transition-colors"
              >
                <svg
                  className="w-4 h-4 text-[#1D8751]"
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
                <span className="text-sm font-medium">Paste</span>
              </button>
            </div>

            {/* Validation Error */}
            {walletValidationError && (
              <div className="text-red-500 text-xs mt-1">
                {walletValidationError}
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
              <h3 className="dark:text-white text-[#0D0D0D] font-medium">
                Terms and Conditions Summary
              </h3>
            </div>

            {/* Terms Box */}
            <div className="dark:bg-[#181820] bg-white border border-[#1D8751] rounded-lg p-4">
              <div className="space-y-3">
                {/* Term 1 */}
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-[#1D8751] rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm dark:text-white text-[#0D0D0D]">
                    Please send the money from your own account Only
                  </p>
                </div>

                {/* Term 2 */}
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-[#1D8751] rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm dark:text-white text-[#0D0D0D]">
                    Put transaction ID in the description field of the bank
                  </p>
                </div>

                {/* Term 3 */}
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-[#1D8751] rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm dark:text-white text-[#0D0D0D]">
                    Please note, If you do not follow above conditions, we will
                    reject your transaction and send you back your money.
                  </p>
                </div>
              </div>
            </div>

            {/* Terms Acceptance Checkbox */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="accept-terms"
                checked={hasAcceptedTerms}
                onChange={(e) => setHasAcceptedTerms(e.target.checked)}
                disabled={isLoading}
                className="w-4 h-4 text-[#1D8751] dark:bg-[#181820] bg-white dark:border-[#35353E] border-gray-300 rounded focus:ring-[#1D8751] focus:ring-2 disabled:opacity-50"
              />
              <label
                htmlFor="accept-terms"
                className="text-sm dark:text-white text-[#0D0D0D]"
              >
                I accept the terms and conditions
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex mt-6">
        <button
          onClick={handleNext}
          disabled={!hasAcceptedTerms || !walletAddress.trim() || isLoading}
          className="flex-1 bg-[#1D8751] hover:bg-[#16663d] disabled:dark:bg-[#35353E] disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-[24px] font-semibold transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Processing...</span>
            </>
          ) : (
            "Continue"
          )}
        </button>
      </div>
    </div>
  );
};

export default WalletAddressStep;

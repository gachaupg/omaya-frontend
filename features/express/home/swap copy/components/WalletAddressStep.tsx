import React from "react";
import { useTheme } from "@/context/theme";
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
  const { isDark } = useTheme();

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
    await onNext();
  };

  return (
    <div className="w-full flex flex-col">
      <h2 className="text-xl font-bold mb-2 text-[#788099] inline-flex items-center gap-2">
        <span className="text-[#7e7e8f] dark:text-[#788099]">2-</span> Wallet Address
      </h2>
      <div className="w-full mx-auto">
        {/* Combined Wallet Address and Terms Card */}
        <div className={`flex flex-col rounded-2xl p-5 shadow-lg w-full ${
          isDark ? "bg-[#1D1D23] border-2 border-[#35353E]" : "bg-white border-2 border-[#E2E8F0]"
        } text-[#35353e] dark:text-[#788099]`}>
          <div className="flex flex-col gap-4 sm:gap-6">
            {/* Wallet Address Input Section */}
            <div className="flex flex-col gap-3 sm:gap-4">
              {/* Wallet/Account Address Label */}
              <label className="block text-[17px] text-[#7e7e8f] mb-2 font-semibold">
                Wallet/Account Address
              </label>
              {/* Input group */}
              <div className={`flex items-center rounded-2xl px-4 py-2 mb-4 ${
                isDark ? "bg-transparent border border-[#39394a]" : "bg-transparent border border-[#39394a]"
              }`}>
                {/* Left icon */}
                <span className="mr-2 text-[#1D8751]">
                  <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
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
                  onChange={onWalletAddressChange}
                  placeholder="Paste here your Crypto address"
                  className={`flex-1 bg-transparent border-none outline-none text-[#35353e] dark:text-[#788099] placeholder-[#788099] text-base`}
                  disabled={isLoading}
                />
                {/* Bookmark icon */}
                <span className="mx-2 text-[#788099] cursor-pointer">
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                    <path
                      d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"
                      stroke="#788099"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                {/* Paste button */}
                <button
                  onClick={handlePaste}
                  disabled={isLoading}
                  className={`flex items-center gap-1 border text-[#1D8751] rounded-full px-4 py-1 ml-2 font-semibold text-base hover:bg-[#1D8751] hover:text-white transition-colors ${
                    isDark ? "bg-[#1D1D23] border-[#1D8751]" : "bg-transparent border-[#1D8751]"
                  }`}
                >
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
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
            </div>

            {/* Terms and Conditions Summary */}
            <div className="flex items-center mb-2">
              <span className="mr-2 text-[#1D8751]">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="#1D8751"
                    strokeWidth="2"
                  />
                  <line
                    x1="12"
                    y1="8"
                    x2="12"
                    y2="12"
                    stroke="#1D8751"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <circle cx="12" cy="16" r="1" fill="#1D8751" />
                </svg>
              </span>
              <span className={`text-base font-semibold ${isDark ? "text-[#788099]" : "text-[#475569]"}`}>
                Terms and Conditions Summary
              </span>
            </div>
            <div
              className={`border border-[#1D8751] rounded-xl p-4 ${
                isDark ? "bg-[#1D1D23]" : "bg-[#F8FAFF]"
              }`}
            >
              <ul className="list-none space-y-2">
                <li className="flex items-start">
                  <span className="w-3 h-3 mt-1 rounded-full bg-[#1D8751] inline-block mr-3"></span>
                  <span className={`${isDark ? "text-[#788099]" : "text-[#475569]"} text-sm`}>
                    Please send the money from your own account Only
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="w-3 h-3 mt-1 rounded-full bg-[#1D8751] inline-block mr-3"></span>
                  <span className={`${isDark ? "text-[#788099]" : "text-[#475569]"} text-sm`}>
                    Put transaction ID in the description field of the bank
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="w-3 h-3 mt-1 rounded-full bg-[#1D8751] inline-block mr-3"></span>
                  <span className={`${isDark ? "text-[#788099]" : "text-[#475569]"} text-sm`}>
                    Please note, If you do not follow above conditions, we will
                    reject your transaction and send you back your money.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex flex-col gap-3 w-full px-2 mt-4">
          <button
            onClick={handleNext}
            disabled={!walletAddress.trim() || isLoading}
            className={`w-full text-base font-medium py-2 rounded-2xl flex items-center justify-center gap-2 transition-colors text-white ${
              isLoading || !walletAddress.trim()
                ? "bg-gray-500 cursor-not-allowed"
                : "bg-[#1D8751] hover:bg-[#166b3e]"
            }`}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#35353e] dark:border-[#35353E]"></div>
                <span>Processing...</span>
              </div>
            ) : (
              <span className="flex items-center justify-center">
                <img
                  className="mt-2"
                  src="https://res.cloudinary.com/pitz/image/upload/v1752244135/Group_5_gkxzdz.png"
                  alt=""
                />
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WalletAddressStep;

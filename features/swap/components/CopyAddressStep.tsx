import React from "react";
import { SwapResponse } from "./types";

interface CopyAddressStepProps {
  swapResponse: SwapResponse | null;
  copyMessage: string;
  onCopyAddress: () => void;
  onBack: () => void;
  onNext: () => void;
}

const CopyAddressStep: React.FC<CopyAddressStepProps> = ({
  swapResponse,
  copyMessage,
  onCopyAddress,
  onBack,
  onNext,
}) => {
  if (!swapResponse?.payinAddress) return null;

  return (
    <div className="mb-8">
      <div className="mb-2 text-base font-semibold">2- Copy Address</div>
      <div className="bg-[#23232b] border border-[#35353E] rounded-xl p-5 mb-2">
        <div className="flex flex-col gap-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">Send Payment To</h3>
            <p className="text-sm text-[#8C8CA1] mb-4">
              Please copy the address below and send your payment to complete
              the swap
            </p>
          </div>
          <div className="text-xs text-[#8C8CA1] mb-2">Payment Address:</div>
          <div className="flex items-center gap-2">
            <div className="bg-[#181820] w-full border border-[#1D8751] rounded-[18px] p-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={swapResponse.payinAddress}
                  readOnly
                  className="flex-1 bg-transparent text-[#1D8751] font-mono text-sm outline-none"
                />
                <button
                  className="bg-[#1D8751] hover:bg-[#16663d] p-2 rounded-lg text-white transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
                  onClick={onCopyAddress}
                  title="Copy Address"
                >
                  {copyMessage ? (
                    <span className="text-xs font-medium">{copyMessage}</span>
                  ) : (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
        <div className="flex mt-6 gap-5 justify-between">
        <button
          className="bg-[#35353E] w-full hover:bg-[#45454E] text-white px-6 py-2 rounded-[24px] font-semibold transition"
          onClick={onBack}
        >
          Back
        </button>
        <button
          className="bg-[#1D8751] w-full hover:bg-[#16663d] text-white px-6 py-2 rounded-[24px] font-semibold transition"
          onClick={onNext}
        >
          I've Sent Payment
        </button>
      </div>
      </div>

      {/* Navigation buttons */}
     
    </div>
  );
};

export default CopyAddressStep;

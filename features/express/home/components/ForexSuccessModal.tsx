"use client";
import React from "react";

interface ForexSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionType: "deposit" | "withdrawal";
  fromCurrency: string;
  fromAmount: string;
  toCurrency: string;
  toAmount: string;
  exchangeRate: string;
}

export default function ForexSuccessModal({
  isOpen,
  onClose,
  transactionType,
  fromCurrency,
  fromAmount,
  toCurrency,
  toAmount,
  exchangeRate,
}: ForexSuccessModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white/95 dark:bg-[#1D1D23]/95 backdrop-blur-md rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-[#D1D2D4FF] dark:border-[#35353E] animate-[fadeIn_0.2s_ease-out]">
        {/* Success Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-[#1D8751] bg-opacity-10 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-[#1D8751]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-center text-[#35353e] dark:text-[#ffffff] mb-2">
          {transactionType === "deposit" ? "Forex Deposit Successful!" : "Forex Withdrawal Successful!"}
        </h2>

        {/* Subtitle */}
        <p className="text-center text-sm text-[#788099] mb-5">
          Your forex {transactionType} has been submitted successfully
        </p>

        {/* Transaction Details */}
        {fromAmount && toAmount && (
          <div className="bg-[#F5F6F7] dark:bg-[#18181D] rounded-xl p-4 mb-5">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#788099]">From</span>
                <span className="text-sm text-[#35353e] dark:text-[#ffffff] font-semibold">
                  {fromAmount} {fromCurrency}
                </span>
              </div>
              <div className="h-px bg-[#D1D2D4FF] dark:bg-[#35353E]"></div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#788099]">To</span>
                <span className="text-sm text-[#1D8751] font-bold">
                  {toAmount} {toCurrency}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full bg-[#1D8751] hover:bg-[#166b3e] text-white font-semibold py-3 rounded-xl transition-all duration-200 hover:shadow-lg"
        >
          Ok
        </button>
      </div>
    </div>
  );
}


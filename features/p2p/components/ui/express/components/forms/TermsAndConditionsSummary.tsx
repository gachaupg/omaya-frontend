"use client";

import React, { useState } from "react";
import Link from "next/link";

const strongBorder =
  "border-[1.5px] border-gray-200 dark:border-[#35353E]";

interface TermsAndConditionsSummaryProps {
  /** Asset name for display (e.g. "USDT") */
  asset?: string;
  /** Account name for display (e.g. "Sahaal Golis") - used for deposit */
  accountName?: string;
  /** Variant: deposit (send to account) or withdrawal (receive to your account) */
  variant?: "deposit" | "withdrawal";
  /** Provider name for withdrawal (e.g. bank name) */
  providerName?: string;
  /** Account number for withdrawal */
  accountNumber?: string;
  className?: string;
  /** Called before navigating to legal pages - use to save form state for restore on back */
  onBeforeLegalNavigate?: () => void;
}

/**
 * Terms and Conditions Summary - same UI and alignment as swap WalletAddressStep.
 * Used in both P2P and Express deposit and withdrawal forms.
 */
export const TermsAndConditionsSummary = ({
  asset = "USDT",
  accountName = "Sahaal Golis",
  variant = "deposit",
  providerName,
  accountNumber,
  className = "",
  onBeforeLegalNavigate,
}: TermsAndConditionsSummaryProps) => {
  const [expandedTerms, setExpandedTerms] = useState(false);

  const isWithdrawal = variant === "withdrawal";

  return (
    <div className={`w-full flex flex-col gap-4 ${className}`}>
      {/* Terms Header - same as swap */}
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

      {/* Terms Box - Collapsible, same as swap */}
      <div
        className={`bg-gray-50 dark:bg-[var(--card-color)] ${strongBorder} rounded-xl overflow-hidden transition-all duration-300`}
      >
        {/* Summary Section - Always Visible */}
        <div className="p-4 sm:p-5">
          <div
            className={`space-y-2 sm:space-y-3 ${expandedTerms ? "" : "line-clamp-3"}`}
          >
            <div className="flex items-start gap-2 sm:gap-3">
              <span className="text-[#1D8751] font-bold text-sm sm:text-base flex-shrink-0">
                1.
              </span>
              <p className="text-xs sm:text-sm text-gray-900 dark:text-white">
                {isWithdrawal ? (
                  <>
                    <span className="font-semibold">Your receiving account:</span>{" "}
                    We will send money to your{" "}
                    <span className="font-semibold text-[#1D8751]">{providerName || accountName || "the selected provider"}</span>{" "}
                    account{" "}
                    <span className="font-semibold text-[#1D8751]">{accountNumber || "—"}</span>{" "}
                    for withdrawal of{" "}
                    <span className="font-semibold text-[#1D8751]">{asset}</span>.
                    Please ensure this is your own account.
                  </>
                ) : (
                  <>
                    <span className="font-semibold">Send from your own account only:</span>{" "}
                    Please send money from your own account only to {accountName} account — for Asset {asset}.
                  </>
                )}
              </p>
            </div>

            <div className="flex items-start gap-2 sm:gap-3">
              <span className="text-[#1D8751] font-bold text-sm sm:text-base flex-shrink-0">
                2.
              </span>
              <p className="text-xs sm:text-sm text-gray-900 dark:text-white">
                <span className="font-semibold">Put transaction ID in the description field:</span>{" "}
                {isWithdrawal ? "You must put the transaction ID in the description/memo field of the bank." : "Put transaction ID in the description field of the bank."}
              </p>
            </div>

            <div className="flex items-start gap-2 sm:gap-3">
              <span className="text-[#1D8751] font-bold text-sm sm:text-base flex-shrink-0">
                3.
              </span>
              <p className="text-xs sm:text-sm text-gray-900 dark:text-white">
                <span className="font-semibold">Non-compliance:</span>{" "}
                Please note, if you do not follow the above conditions, we will reject your transaction and send you back your money.
              </p>
            </div>
          </div>

          {/* Show More/Less Button - same as swap */}
          <button
            type="button"
            onClick={() => setExpandedTerms(!expandedTerms)}
            className="mt-3 sm:mt-4 text-[#1D8751] hover:text-[#166b3e] font-semibold text-xs sm:text-sm flex items-center gap-1.5 transition-colors"
          >
            {expandedTerms ? (
              <>
                <span>Show Less</span>
                <svg
                  className="w-4 h-4 transform rotate-180"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 14l-7 7m0 0l-7-7m7 7V3"
                  />
                </svg>
              </>
            ) : (
              <>
                <span>Show More</span>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 14l-7 7m0 0l-7-7m7 7V3"
                  />
                </svg>
              </>
            )}
          </button>
        </div>

        {/* Expanded Content - same as swap */}
        {expandedTerms && (
          <div className="border-t border-gray-200 dark:border-[#35353E] px-4 sm:px-5 py-4 sm:py-5 space-y-4 sm:space-y-5">
            <div className="flex items-start gap-2 sm:gap-3">
              <span className="text-[#1D8751] font-bold text-sm sm:text-base flex-shrink-0">
                4.
              </span>
              <div className="flex-1">
                <p className="text-xs sm:text-sm text-gray-900 dark:text-white font-semibold mb-2">
                  Irreversible transactions & user responsibility:
                </p>
                <p className="text-xs sm:text-sm text-gray-900 dark:text-white mb-2">
                  Bank and crypto transactions can be irreversible. If you send the wrong amount, to the wrong account, or do not follow the instructions above, we may reject your transaction and return your funds, but delays may apply.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2 sm:gap-3">
              <span className="text-[#1D8751] font-bold text-sm sm:text-base flex-shrink-0">
                5.
              </span>
              <div className="flex-1">
                <p className="text-xs sm:text-sm text-gray-900 dark:text-white font-semibold mb-2">
                  Acceptance of terms:
                </p>
                <p className="text-xs sm:text-sm text-gray-900 dark:text-white">
                  Before sending any funds, you must confirm that you have read and accepted all the terms and conditions listed above, and our full{" "}
                  <Link
                    href="/legal/terms-of-service"
                    rel="noopener noreferrer"
                    className="text-[#1D8751] underline font-medium hover:text-[#166b3e]"
                    onClick={(e) => {
                      e.stopPropagation();
                      onBeforeLegalNavigate?.();
                    }}
                  >
                    Terms of Service
                  </Link>
                  .
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

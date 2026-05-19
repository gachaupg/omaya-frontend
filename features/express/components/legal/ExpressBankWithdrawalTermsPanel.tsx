"use client";

import React from "react";

type Variant = "dashboard" | "default";

export interface ExpressBankWithdrawalTermsPanelProps {
  expandedTerms: boolean;
  setExpandedTerms: (next: boolean) => void;
  variant: Variant;
  isDark?: boolean;
  providerName?: string;
  accountNumber?: string;
  asset?: string;
}

export function ExpressBankWithdrawalTermsPanel({
  expandedTerms,
  setExpandedTerms,
  variant,
  isDark,
  providerName = "the selected provider",
  accountNumber = "—",
  asset = "crypto",
}: ExpressBankWithdrawalTermsPanelProps) {
  const itemClass =
    variant === "dashboard"
      ? `text-xs sm:text-sm ${isDark ? "text-[#788099]" : "text-[#475569]"}`
      : "text-xs sm:text-sm text-[#35353e] dark:text-[#788099]";

  const titleClass =
    variant === "dashboard"
      ? `font-medium text-sm sm:text-base ${isDark ? "text-white" : "text-gray-900"}`
      : "font-medium text-sm sm:text-base text-[#35353e] dark:text-white";

  const outerClass =
    variant === "dashboard"
      ? `border border-[#1D8751] rounded-xl overflow-hidden transition-all duration-300 ${isDark ? "bg-[#1D1D23]" : "bg-[#F8FAFF]"}`
      : "dark:bg-[#1D1D23] border border-[#1D8751] rounded-xl overflow-hidden transition-all duration-300";

  const assetLabel = asset?.toString().trim() || "crypto";

  return (
    <>
      <div className="flex items-center gap-2 mb-2">
        <svg className="w-5 h-5 text-[#1D8751]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h3 className={titleClass}>Terms & Conditions</h3>
      </div>
      <div className={outerClass}>
        <div className="p-4">
          <div
            className={`space-y-2 sm:space-y-3 ${expandedTerms ? "" : "line-clamp-3"}`}
          >
            <div className="flex items-start gap-2 sm:gap-3">
              <span className="text-[#1D8751] font-bold text-sm sm:text-base flex-shrink-0">
                1.
              </span>
              <p className={itemClass}>
                <span className="font-semibold">Your receiving account:</span> We will send money
                to your{" "}
                <span className="font-semibold text-[#1D8751]">{providerName}</span> account{" "}
                <span className="font-semibold text-[#1D8751]">{accountNumber}</span> for withdrawal
                of <span className="font-semibold text-[#1D8751]">{assetLabel}</span>. Please
                ensure this is your own account.
              </p>
            </div>
            <div className="flex items-start gap-2 sm:gap-3">
              <span className="text-[#1D8751] font-bold text-sm sm:text-base flex-shrink-0">
                2.
              </span>
              <p className={itemClass}>
                <span className="font-semibold">Put transaction ID in the description field:</span>{" "}
                You must put the transaction ID in the description/memo field of the bank.
              </p>
            </div>
            <div className="flex items-start gap-2 sm:gap-3">
              <span className="text-[#1D8751] font-bold text-sm sm:text-base flex-shrink-0">
                3.
              </span>
              <p className={itemClass}>
                <span className="font-semibold">Non-compliance:</span> Please note, if you do not
                follow the above conditions, we may reject your transaction and return your funds,
                but delays may apply.
              </p>
            </div>
          </div>
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
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      </div>
    </>
  );
}

/** Resolve display values for express bank withdrawal terms. */
export function resolveExpressBankWithdrawalTermsFields(options: {
  paymentDetail?: {
    provider_name?: string;
    payment_provider_name?: string;
    account_number?: string;
    payment_details?: Array<{ account_number?: string; mobile_number?: string }>;
  } | null;
  providerData?: { provider_name?: string; provider?: string } | null;
  payBank?: string;
  asset?: { ticker?: string; symbol?: string; name?: string } | null;
}) {
  const detail = options.paymentDetail;
  const providerName =
    detail?.provider_name ||
    detail?.payment_provider_name ||
    options.providerData?.provider_name ||
    options.providerData?.provider ||
    options.payBank ||
    "the selected provider";
  const accountNumber =
    detail?.account_number ||
    detail?.payment_details?.[0]?.account_number ||
    detail?.payment_details?.[0]?.mobile_number ||
    "—";
  const asset =
    options.asset?.ticker ||
    options.asset?.symbol ||
    options.asset?.name ||
    "crypto";

  return { providerName, accountNumber, asset };
}

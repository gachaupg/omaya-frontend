"use client";

import React from "react";
import {
  getPaymentRejectionReason,
  getPaymentStatusBannerLines,
  getPaymentStatusBannerStyle,
  getPaymentStatusBannerTitle,
  normalizePaymentStatus,
  PaymentBannerAccount,
  shouldShowPaymentStatusBanner,
} from "@/features/express/utils/paymentAccountStatus";

type PaymentAccountStatusBannerProps = {
  account?: PaymentBannerAccount | null;
  className?: string;
};

const PaymentAccountStatusBanner: React.FC<PaymentAccountStatusBannerProps> = ({
  account,
  className = "",
}) => {
  if (!shouldShowPaymentStatusBanner(account)) {
    return null;
  }

  const status = normalizePaymentStatus(account?.status);
  const rejectionReason = getPaymentRejectionReason(account);
  const bannerStyle = getPaymentStatusBannerStyle(status);
  const bannerLines = getPaymentStatusBannerLines(status, rejectionReason);

  return (
    <div
      className={`flex items-start gap-3 rounded-2xl border p-3 sm:p-4 ${bannerStyle.container} ${className}`}
    >
      <svg
        className={`mt-0.5 h-5 w-5 flex-shrink-0 ${bannerStyle.accent}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${bannerStyle.accent}`}>
          {getPaymentStatusBannerTitle(status)}
        </p>
        <p className={`mt-1 text-xs ${bannerStyle.body}`}>
          Your account
          {account?.account_name ? ` "${account.account_name}"` : ""}
          {account?.account_number || account?.wallet_address
            ? ` (${account.account_number || account.wallet_address})`
            : ""}{" "}
          {bannerLines.beforeLink}
          <a
            href="/contactUs"
            className="font-semibold text-[#1D8751] underline transition-colors hover:text-[#17693f]"
          >
            contact support
          </a>{" "}
          {bannerLines.afterLink}
        </p>
      </div>
    </div>
  );
};

export default PaymentAccountStatusBanner;

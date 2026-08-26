"use client";

import React from "react";
import Link from "next/link";

type ExpressSubmitAlertBannerProps = {
  title: string;
  message: string;
  className?: string;
  showSupportLink?: boolean;
};

/** Prominent alert shown directly above primary submit buttons (withdrawal, swap, rates). */
const ExpressSubmitAlertBanner: React.FC<ExpressSubmitAlertBannerProps> = ({
  title,
  message,
  className = "",
  showSupportLink = true,
}) => (
  <div
    className={`flex items-start gap-3 rounded-2xl border border-[#E23D3A]/40 bg-[#E23D3A]/10 p-3 sm:p-4 ${className}`}
    role="alert"
  >
    <svg
      className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#E23D3A]"
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
    <div className="min-w-0 flex-1">
      <p className="text-sm font-semibold text-[#E23D3A]">{title}</p>
      <p className="mt-1 text-xs whitespace-pre-line break-words text-[#E23D3A]/90 sm:text-sm">
        {message}
        {showSupportLink ? (
          <>
            {" "}
            <Link
              href="/contactUs"
              className="font-semibold text-[#1D8751] underline transition-colors hover:text-[#17693f]"
            >
              Contact support
            </Link>
            .
          </>
        ) : null}
      </p>
    </div>
  </div>
);

export default ExpressSubmitAlertBanner;

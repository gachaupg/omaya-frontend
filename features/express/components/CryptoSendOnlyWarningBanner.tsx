"use client";

import React from "react";
import type { AssetLike } from "@/lib/utils/networkDisplay";
import { getCryptoSendOnlyWarningParts } from "@/lib/utils/cryptoSendWarning";

type CryptoSendOnlyWarningBannerProps = {
  asset?: AssetLike | null;
  network?: string | null;
  className?: string;
  showTemporaryAddressNotice?: boolean;
};

export function CryptoSendOnlyWarningBanner({
  asset,
  network,
  className = "",
  showTemporaryAddressNotice = false,
}: CryptoSendOnlyWarningBannerProps) {
  const { assetLabel, networkLabel, addressHeading, showNetwork } =
    getCryptoSendOnlyWarningParts(asset, network);

  return (
    <div
      className={`p-3 sm:p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/50 rounded-xl ${className}`}
    >
      <div className="flex items-start gap-2 sm:gap-3">
        <span className="text-yellow-600 dark:text-yellow-500 mt-0.5 flex-shrink-0">
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
            <path
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <p className="text-xs sm:text-sm text-yellow-800 dark:text-yellow-200 font-medium">
          <span className="font-bold">Important:</span> Please send only{" "}
          <span className="font-bold text-yellow-900 dark:text-yellow-100">
            {assetLabel}
          </span>
          {showNetwork ? (
            <>
              {" "}
              on the{" "}
              <span className="font-bold text-yellow-900 dark:text-yellow-100">
                {networkLabel}
              </span>{" "}
              network
            </>
          ) : null}{" "}
          to this{" "}
          <span className="font-bold text-yellow-900 dark:text-yellow-100">
            {addressHeading}
          </span>
          . Sending any other crypto or using the wrong network may result in{" "}
          <span className="font-bold">permanent loss of funds</span>.
          {showTemporaryAddressNotice ? (
            <>
              {" "}
              This wallet address is temporary and may change if you repeat the
              process. Always use the most recently generated address.
            </>
          ) : null}
        </p>
      </div>
    </div>
  );
}

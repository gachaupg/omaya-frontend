"use client";

import React from "react";
import CopyButton from "@/components/ui/CopyButton";
import {
  DEFAULT_PROVIDER_LOGO,
  formatAddressForDisplay,
  getBaseTickerForIcon,
  isAssetNetworkLabel,
} from "@/lib/utils/transactionFromTo";
import {
  getDefaultAssetIcon,
  getHighResAssetIcon,
} from "@/features/express/utils/imageHelpers";

type TransactionFromToCellProps = {
  label: string;
  copyValue?: string | null;
  iconUrl?: string | null;
};

function looksLikePaymentProviderLabel(label: string): boolean {
  const lower = label.toLowerCase();
  return (
    lower.includes("bank") ||
    lower.includes("wallet") ||
    lower.includes("provider") ||
    lower.includes("payment") ||
    lower.includes("m-pesa") ||
    lower.includes("mpesa") ||
    lower.includes("evc") ||
    lower.includes("zaad") ||
    lower.includes("sahal")
  );
}

export function TransactionFromToCell({
  label,
  copyValue,
  iconUrl,
}: TransactionFromToCellProps) {
  const trimmed = String(label ?? "").trim() || "—";
  const fullCopy = String(copyValue ?? "").trim();
  const showCopy = Boolean(fullCopy);
  const displayAsAsset =
    isAssetNetworkLabel(trimmed) || (!showCopy && !/^0x/i.test(trimmed) && !looksLikePaymentProviderLabel(trimmed) && /^[A-Z]{2,12}(\s|$)/i.test(trimmed));
  const displayAsPayment =
    !showCopy && !displayAsAsset && !/^0x/i.test(trimmed);

  const resolvedIconUrl = (() => {
    // Addresses: mono text + copy only (no bank/asset icon in this column).
    if (showCopy) return null;
    const explicit = String(iconUrl ?? "").trim();
    if (explicit) return explicit;
    if (displayAsAsset) {
      return getHighResAssetIcon({ ticker: getBaseTickerForIcon(trimmed) });
    }
    if (displayAsPayment) {
      return DEFAULT_PROVIDER_LOGO;
    }
    return null;
  })();

  const showIcon = Boolean(resolvedIconUrl);

  return (
    <div className="flex items-center gap-2 min-w-0 w-full max-w-[220px] sm:max-w-none">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {showIcon ? (
          <>
            <img
              src={resolvedIconUrl!}
              alt={trimmed}
              className="w-5 h-5 rounded-full shadow-sm flex-shrink-0 object-cover"
              onError={(e) => {
                const img = e.currentTarget;
                if (img.dataset.fallbackApplied === "1") {
                  img.style.display = "none";
                  return;
                }
                img.dataset.fallbackApplied = "1";
                if (displayAsAsset) {
                  img.src = getDefaultAssetIcon();
                } else {
                  img.src = DEFAULT_PROVIDER_LOGO;
                }
              }}
            />
            <span
              className={`${showCopy ? "font-mono" : "font-medium"} text-xs sm:text-sm text-gray-900 dark:text-white truncate`}
              title={fullCopy || trimmed}
            >
              {showCopy ? formatAddressForDisplay(fullCopy || trimmed) : trimmed}
            </span>
          </>
        ) : (
          <span
            className="font-mono text-xs sm:text-sm text-gray-900 dark:text-white truncate"
            title={fullCopy || trimmed}
          >
            {formatAddressForDisplay(fullCopy || trimmed)}
          </span>
        )}
      </div>
      <div className="w-7 h-7 shrink-0 flex items-center justify-center">
        {showCopy ? (
          <CopyButton
            value={fullCopy}
            className="text-gray-500 hover:text-gray-900 dark:text-[#A0A3BC] dark:hover:text-white"
            showInlineMessage={false}
          />
        ) : null}
      </div>
    </div>
  );
}

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

  subLabel?: string | null;

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

    lower.includes("sahal") ||

    lower.includes("salaam")

  );

}



export function TransactionFromToCell({

  label,

  subLabel,

  copyValue,

  iconUrl,

}: TransactionFromToCellProps) {

  const trimmed = String(label ?? "").trim() || "—";

  const secondary = String(subLabel ?? "").trim();

  const fullCopy = String(copyValue ?? "").trim();

  const showCopy = Boolean(fullCopy);

  const hasStackedLines = Boolean(secondary);



  const displayAsAsset =

    isAssetNetworkLabel(trimmed) ||

    (!showCopy &&

      !hasStackedLines &&

      !/^0x/i.test(trimmed) &&

      !looksLikePaymentProviderLabel(trimmed) &&

      /^[A-Z]{2,12}(\s|$|\()/i.test(trimmed));

  const displayAsPayment =

    !showCopy && !hasStackedLines && !displayAsAsset && !/^0x/i.test(trimmed);



  const resolvedIconUrl = (() => {

    if (!hasStackedLines && showCopy) return null;

    const explicit = String(iconUrl ?? "").trim();

    if (explicit) return explicit;

    if (displayAsAsset || (hasStackedLines && isAssetNetworkLabel(trimmed))) {

      return getHighResAssetIcon({ ticker: getBaseTickerForIcon(trimmed) });

    }

    if (displayAsPayment || (hasStackedLines && looksLikePaymentProviderLabel(trimmed))) {

      return DEFAULT_PROVIDER_LOGO;

    }

    if (hasStackedLines) {

      return getHighResAssetIcon({ ticker: getBaseTickerForIcon(trimmed) });

    }

    return null;

  })();



  const showIcon = Boolean(resolvedIconUrl);



  const primaryClass = hasStackedLines

    ? "font-medium text-xs sm:text-sm text-gray-900 dark:text-white leading-tight"

    : `${showCopy && !hasStackedLines ? "font-mono" : "font-medium"} text-xs sm:text-sm text-gray-900 dark:text-white truncate`;



  const secondaryClass =

    "font-mono text-[10px] sm:text-xs text-gray-500 dark:text-[#788099] truncate leading-tight";



  return (

    <div className="flex items-start gap-2 min-w-0 w-full max-w-[220px] sm:max-w-[280px]">

      <div className="flex items-start gap-2 min-w-0 flex-1">

        {showIcon ? (

          <img

            src={resolvedIconUrl!}

            alt={trimmed}

            className="w-5 h-5 rounded-full shadow-sm flex-shrink-0 object-cover mt-0.5"

            onError={(e) => {

              const img = e.currentTarget;

              if (img.dataset.fallbackApplied === "1") {

                img.style.display = "none";

                return;

              }

              img.dataset.fallbackApplied = "1";

              if (displayAsAsset || isAssetNetworkLabel(trimmed)) {

                img.src = getDefaultAssetIcon();

              } else {

                img.src = DEFAULT_PROVIDER_LOGO;

              }

            }}

          />

        ) : null}

        <div className="flex flex-col min-w-0 flex-1 gap-0.5">

          <span className={primaryClass} title={trimmed}>

            {trimmed}

          </span>

          {hasStackedLines ? (

            <span className={secondaryClass} title={fullCopy || secondary}>

              {secondary}

            </span>

          ) : showCopy && !showIcon ? (

            <span

              className="font-mono text-xs sm:text-sm text-gray-900 dark:text-white truncate"

              title={fullCopy}

            >

              {formatAddressForDisplay(fullCopy)}

            </span>

          ) : null}

        </div>

      </div>

      <div className="w-7 h-7 shrink-0 flex items-center justify-center mt-0.5">

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



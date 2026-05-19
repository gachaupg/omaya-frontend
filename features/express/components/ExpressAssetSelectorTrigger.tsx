"use client";

import React from "react";
import type { AssetLike } from "@/lib/utils/networkDisplay";
import { ASSET_ICON_BASE_CLASS } from "@/features/express/utils/imageHelpers";
import { SwapAssetOptionDisplay } from "@/features/swap/components/SwapAssetOptionDisplay";
import {
  SWAP_FIELD_TEXT,
  expressAssetTriggerClass,
} from "@/features/swap/components/swapFieldStyles";

export const EXPRESS_ASSET_ICON_FALLBACK = "/assets/image_7_jijlik.png";

export { expressAssetTriggerClass };

interface ExpressAssetSelectorTriggerProps {
  isDark: boolean;
  isOpen: boolean;
  onClick: () => void;
  asset: AssetLike | null;
  iconSrc: string;
  onIconError?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
  placeholder: string;
  className?: string;
  as?: "div" | "button";
  buttonType?: "button" | "submit";
}

export function ExpressAssetSelectorTrigger({
  isDark,
  isOpen,
  onClick,
  asset,
  iconSrc,
  onIconError,
  placeholder,
  className,
  as = "div",
  buttonType = "button",
}: ExpressAssetSelectorTriggerProps) {
  const triggerClass = className ?? expressAssetTriggerClass(isDark);

  const content = (
    <>
      <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
        {asset ? (
          <>
            <img
              src={iconSrc}
              alt={asset.name || asset.ticker || asset.symbol || "Asset"}
              className={`${ASSET_ICON_BASE_CLASS} w-5 h-5 rounded-full object-cover shrink-0`}
              onError={onIconError}
            />
            <SwapAssetOptionDisplay
              asset={asset}
              showSubtitle
              primaryClassName={`${SWAP_FIELD_TEXT} ${isDark ? "text-white font-semibold" : "text-[#1F2937] font-semibold"}`}
              subtitleClassName={`text-[10px] leading-tight ${isDark ? "text-[#788099]" : "text-[#64748B]"} truncate`}
            />
          </>
        ) : (
          <>
            <img
              src={EXPRESS_ASSET_ICON_FALLBACK}
              alt="asset icon"
              className={`${ASSET_ICON_BASE_CLASS} w-5 h-5 rounded-full shrink-0`}
            />
            <span
              className={`${SWAP_FIELD_TEXT} ${isDark ? "text-[#788099]" : "text-[#64748B]"}`}
            >
              {placeholder}
            </span>
          </>
        )}
      </div>
      <div className="ml-2 shrink-0">
        <svg
          className={`w-4 h-4 text-[#7e7e8f] transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
    </>
  );

  if (as === "button") {
    return (
      <button type={buttonType} onClick={onClick} className={triggerClass}>
        {content}
      </button>
    );
  }

  return (
    <div role="button" tabIndex={0} onClick={onClick} className={triggerClass}>
      {content}
    </div>
  );
}

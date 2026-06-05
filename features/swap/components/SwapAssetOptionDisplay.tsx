"use client";

import React from "react";
import { resolveAssetNetwork } from "@/lib/utils/assetSearch";
import {
  formatAssetSubtitle,
  getAssetPrimaryLabel,
  getNetworkDisplayName,
  shouldShowAssetNetworkBadge,
  type AssetLike,
} from "@/lib/utils/networkDisplay";
import { SWAP_FIELD_SUBTEXT, SWAP_FIELD_TEXT } from "./swapFieldStyles";

interface SwapAssetOptionDisplayProps {
  asset: AssetLike;
  showSubtitle?: boolean;
  primaryClassName?: string;
  subtitleClassName?: string;
  badgeClassName?: string;
}

export function SwapAssetOptionDisplay({
  asset,
  showSubtitle = true,
  primaryClassName,
  subtitleClassName,
  badgeClassName = "bg-[#1D8751] text-[#ffffff] dark:text-[#ffffff] text-[10px] font-normal px-1.5 py-0.5 rounded-full shrink-0",
}: SwapAssetOptionDisplayProps) {
  const networkLabel = getNetworkDisplayName(resolveAssetNetwork(asset));
  const primaryLabel = getAssetPrimaryLabel(asset);
  const subtitleLabel = formatAssetSubtitle(asset);
  const showNetworkBadge = shouldShowAssetNetworkBadge(asset);

  const primary =
    primaryClassName ??
    `${SWAP_FIELD_TEXT} font-semibold text-[#1F2937] dark:text-white`;
  const subtitle =
    subtitleClassName ??
    `${SWAP_FIELD_SUBTEXT} text-[#788099] dark:text-[#64748B] truncate`;

  return (
    <div className="flex flex-col min-w-0 text-left justify-center gap-0.5 leading-tight">
      <div className="flex items-center gap-1.5 min-w-0">
        <span className={`truncate ${primary}`}>{primaryLabel}</span>
        {showNetworkBadge ? (
          <span className={badgeClassName}>{networkLabel}</span>
        ) : null}
      </div>
      {showSubtitle && subtitleLabel ? (
        <span className={subtitle}>{subtitleLabel}</span>
      ) : null}
    </div>
  );
}

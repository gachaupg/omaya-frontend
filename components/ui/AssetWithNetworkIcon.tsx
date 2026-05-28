"use client";

import React from "react";
import {
  getDefaultAssetIcon,
  getHighResAssetIcon,
  type AssetLike,
} from "@/features/express/utils/imageHelpers";
import {
  resolveNetworkIconSrc,
  type NetworkIconAssetLike,
} from "@/lib/utils/networkIcons";

export interface AssetWithNetworkIconProps {
  asset: (AssetLike & NetworkIconAssetLike) | null | undefined;
  /** Main icon edge length in px (default 24). */
  size?: number;
  className?: string;
  assetIconSrc?: string;
  onAssetIconError?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
  showNetworkBadge?: boolean;
  alt?: string;
}

export function AssetWithNetworkIcon({
  asset,
  size = 24,
  className = "",
  assetIconSrc,
  onAssetIconError,
  showNetworkBadge = true,
  alt,
}: AssetWithNetworkIconProps) {
  const mainSrc =
    assetIconSrc ||
    (asset ? getHighResAssetIcon(asset, Math.max(size * 3, 72)) : getDefaultAssetIcon());
  const networkSrc =
    showNetworkBadge && asset ? resolveNetworkIconSrc(asset, 48) : undefined;

  const badgeSize = Math.max(10, Math.min(14, Math.round(size * 0.42)));
  const label =
    alt ||
    asset?.name ||
    asset?.ticker ||
    asset?.symbol ||
    "Asset";

  return (
    <div
      className={`relative shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src={mainSrc}
        alt={label}
        className="w-full h-full rounded-full object-cover"
        loading="lazy"
        decoding="async"
        onError={(e) => {
          if (onAssetIconError) {
            onAssetIconError(e);
            return;
          }
          const el = e.currentTarget;
          const fallback = getDefaultAssetIcon();
          if (!el.src.endsWith(fallback)) {
            el.onerror = null;
            el.src = fallback;
          }
        }}
      />
      {networkSrc ? (
        <img
          src={networkSrc}
          alt=""
          aria-hidden
          className="absolute bottom-0 right-0 rounded-full object-cover bg-white dark:bg-[var(--card-color)] border border-white dark:border-[var(--card-color)]"
          style={{ width: badgeSize, height: badgeSize }}
          loading="lazy"
          decoding="async"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      ) : null}
    </div>
  );
}

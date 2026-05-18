import type { SyntheticEvent } from "react";
import {
  getHighResAssetIcon,
  type AssetLike,
} from "@/features/express/utils/imageHelpers";

export const SWAP_ASSET_ICON_FALLBACK = "/images/asset-default.svg";

/** Ticker-aware icon for swap dropdowns (local map wins over bad API URLs). */
export function resolveSwapAssetIconSrc(
  asset: AssetLike | null | undefined,
  size = 96
): string {
  if (!asset) return SWAP_ASSET_ICON_FALLBACK;
  return getHighResAssetIcon(asset, size) || SWAP_ASSET_ICON_FALLBACK;
}

/** Use on img onError — never fall back to USDT for non-USDT assets. */
export function handleSwapAssetIconError(
  e: SyntheticEvent<HTMLImageElement, Event>,
  asset?: AssetLike | null
): void {
  const el = e.currentTarget;
  const fallback = resolveSwapAssetIconSrc(asset ?? null);
  if (!el.src.endsWith(fallback)) {
    el.onerror = null;
    el.src = fallback;
  }
}

"use client";

import React, { type ImgHTMLAttributes } from "react";

export const RATES_ASSET_ICON_FALLBACK = "/images/asset-default.svg";

/** Real remote URLs for display; broken FX Primus path → local default. */
export function resolveRatesAssetImageUrl(raw: string | undefined | null): string {
  const s = String(raw ?? "").trim();
  if (!s) return RATES_ASSET_ICON_FALLBACK;
  if (s.includes("fxprimus_logo.svg")) return RATES_ASSET_ICON_FALLBACK;
  return s;
}

/** For API / navigation payloads — same rules as display. */
export function normalizeRatesAssetIconForPayload(raw: string | undefined | null): string {
  return resolveRatesAssetImageUrl(raw);
}

export function pickRatesAssetImageRaw(asset: {
  image_url?: string;
  asset_image?: string;
  icon_url?: string;
  image?: string;
} | null | undefined): string | undefined {
  if (!asset) return undefined;
  const u =
    asset.image_url ||
    asset.asset_image ||
    asset.icon_url ||
    asset.image;
  return typeof u === "string" && u.trim() ? u.trim() : undefined;
}

export type RatesAssetImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  remoteUrl?: string | null;
  fallbackSrc?: string;
};

/**
 * Asset logos on Rates — direct `src` like express dropdowns (no fetch/blob; avoids CORS issues that hid icons).
 * Browser HTTP cache still dedupes repeat URLs.
 */
export function RatesAssetImage({
  remoteUrl,
  fallbackSrc = RATES_ASSET_ICON_FALLBACK,
  alt,
  className,
  loading = "lazy",
  decoding = "async",
  onError,
  ...rest
}: RatesAssetImageProps) {
  const src = resolveRatesAssetImageUrl(remoteUrl ?? "");

  return (
    <img
      src={src}
      alt={alt ?? ""}
      className={className}
      loading={loading}
      decoding={decoding}
      onError={(e) => {
        onError?.(e);
        const el = e.currentTarget as HTMLImageElement;
        el.onerror = null;
        el.src = fallbackSrc;
      }}
      {...rest}
    />
  );
}

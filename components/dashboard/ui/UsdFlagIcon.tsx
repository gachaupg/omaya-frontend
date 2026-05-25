"use client";

import React from "react";

/** Reliable US flag for fiat USD (CDN + local fallback). */
export const USD_FLAG_CDN_URL = "https://flagcdn.com/w80/us.png";
export const USD_FLAG_LOCAL_URL = "/assets/united_states_flag.svg";

type UsdFlagIconProps = {
  size?: number;
  className?: string;
  alt?: string;
};

export function UsdFlagIcon({
  size = 44,
  className = "",
  alt = "USD",
}: UsdFlagIconProps) {
  return (
    <img
      src={USD_FLAG_CDN_URL}
      alt={alt}
      width={size}
      height={size}
      className={`rounded-full object-cover shrink-0 border border-gray-200 dark:border-[#35353E] bg-white ${className}`}
      onError={(e) => {
        const img = e.currentTarget;
        if (!img.src.includes("united_states_flag")) {
          img.src = USD_FLAG_LOCAL_URL;
        }
      }}
    />
  );
}

export function isUsdOrMoneyXTransaction(
  tx: { type?: string | null; currency?: string | null; asset?: string | null },
  assetTitle?: string,
  typeLabel?: string
): boolean {
  const type = String(tx.type ?? "").toLowerCase();
  const label = String(typeLabel ?? "").toLowerCase();
  const code =
    String(tx.currency || tx.asset || assetTitle || "")
      .trim()
      .toUpperCase() || (type === "moneyx" ? "USD" : "");
  return (
    type === "moneyx" ||
    label.includes("moneyx") ||
    code === "USD" ||
    String(assetTitle ?? "")
      .trim()
      .toUpperCase() === "USD"
  );
}

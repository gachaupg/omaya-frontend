/** KES post-ad rate step buttons (absolute KSh per click; labels show %). */
export const KES_RATE_PLUS_OPTIONS = [1, 2, 3, 4, 5] as const;
export const KES_RATE_MINUS_OPTIONS = [1, 2, 3] as const;

/** Max KSh below / above live market rate (e.g. 129.54 → 119.54–139.54). */
export const KES_RATE_MAX_BELOW_MARKET = 10;
export const KES_RATE_MAX_ABOVE_MARKET = 10;

export function roundKesRate(value: number): number {
  return Math.round(value * 100) / 100;
}

export function getKesRateBounds(marketRate: number): {
  min: number;
  max: number;
} | null {
  if (!Number.isFinite(marketRate) || marketRate <= 0) return null;
  return {
    min: roundKesRate(marketRate - KES_RATE_MAX_BELOW_MARKET),
    max: roundKesRate(marketRate + KES_RATE_MAX_ABOVE_MARKET),
  };
}

export function validateKesRateAgainstMarket(
  rate: number,
  marketRate: number
): string {
  const bounds = getKesRateBounds(marketRate);
  if (!bounds) return "Invalid market rate";
  if (!Number.isFinite(rate) || rate <= 0) {
    return "Rate is required";
  }
  if (rate < bounds.min) {
    return `Rate must be at least KSh ${bounds.min.toFixed(2)} (between KSh ${bounds.min.toFixed(2)} and KSh ${bounds.max.toFixed(2)} only)`;
  }
  if (rate > bounds.max) {
    return `Rate must be at most KSh ${bounds.max.toFixed(2)} (between KSh ${bounds.min.toFixed(2)} and KSh ${bounds.max.toFixed(2)} only)`;
  }
  return "";
}

export function clampKesRateToBounds(
  rate: number,
  marketRate: number
): number {
  const bounds = getKesRateBounds(marketRate);
  if (!bounds) return rate;
  return roundKesRate(
    Math.min(bounds.max, Math.max(bounds.min, rate))
  );
}

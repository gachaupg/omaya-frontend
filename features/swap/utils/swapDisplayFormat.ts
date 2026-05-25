/** Uppercase ticker/symbol for swap UI (e.g. "usdt" → "USDT"). */
export function formatSwapDisplayTicker(
  value: string | number | null | undefined
): string {
  return String(value ?? "").trim().toUpperCase();
}

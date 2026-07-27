/** From this value upward, P2P post-ad amounts use whole numbers (no decimals). */
export const P2P_AD_MILLION_ROUND_THRESHOLD = 1_000_000;

export function roundP2PAdAmount(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (Math.abs(value) >= P2P_AD_MILLION_ROUND_THRESHOLD) {
    return Math.round(value);
  }
  return Math.round(value * 100) / 100;
}

/** Format amount for post-ad inputs — 2dp below 1M, integers from 1M up. */
export function formatP2PAdAmountInput(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "";
  const rounded = roundP2PAdAmount(value);
  if (Math.abs(rounded) >= P2P_AD_MILLION_ROUND_THRESHOLD) {
    return String(Math.round(rounded));
  }
  return rounded.toFixed(2);
}

/** Parse user input and apply post-ad rounding rules. */
export function normalizeP2PAdAmountInput(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const num = Number(trimmed.replace(/,/g, ""));
  if (!Number.isFinite(num) || num <= 0) return trimmed;
  return formatP2PAdAmountInput(num);
}

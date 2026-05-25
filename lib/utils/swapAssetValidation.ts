import type { SupportedAsset } from "@/features/swap/types";

export const SWAP_SAME_COIN_MESSAGE =
  "You cannot swap a coin to itself. Please select different assets.";

export function isSameSwapAssetPair(
  from: SupportedAsset | null | undefined,
  to: SupportedAsset | null | undefined
): boolean {
  if (!from || !to) return false;

  const fromTicker = String(from.ticker || from.symbol || "")
    .trim()
    .toUpperCase();
  const toTicker = String(to.ticker || to.symbol || "")
    .trim()
    .toUpperCase();
  if (!fromTicker || !toTicker || fromTicker !== toTicker) return false;

  const fromNetwork = String(from.network || "").trim().toLowerCase();
  const toNetwork = String(to.network || "").trim().toLowerCase();
  if (!fromNetwork && !toNetwork) return true;
  return fromNetwork === toNetwork;
}

export function isSameSwapCreateErrorMessage(text: string): boolean {
  const normalized = String(text || "").trim().toLowerCase();
  if (!normalized) return false;
  return (
    (normalized.includes("same") &&
      (normalized.includes("currency") ||
        normalized.includes("coin") ||
        normalized.includes("asset") ||
        normalized.includes("pair"))) ||
    (normalized.includes("cannot swap") && normalized.includes("itself")) ||
    normalized.includes("swap a coin to itself") ||
    normalized.includes("identical currencies")
  );
}

export function resolveSwapCreateErrorMessage(error: unknown): string | null {
  if (typeof error === "string" && isSameSwapCreateErrorMessage(error)) {
    return SWAP_SAME_COIN_MESSAGE;
  }

  const err = error as {
    message?: string;
    response?: { data?: { message?: string; error?: string; detail?: string } };
  };

  const candidates = [
    err?.message,
    err?.response?.data?.message,
    err?.response?.data?.error,
    err?.response?.data?.detail,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && isSameSwapCreateErrorMessage(candidate)) {
      return SWAP_SAME_COIN_MESSAGE;
    }
  }

  return null;
}

/** Backend may send US "canceled" or UK "cancelled". */
export function normalizeP2PTradeStatus(status: string | undefined | null): string | undefined {
  if (status == null || typeof status !== "string") return undefined;
  const s = status.trim().toLowerCase();
  if (s === "canceled" || s === "cancelled") return "cancelled";
  if (s === "half_matched") return "half-matched";
  return status.trim();
}

export function isHalfMatchedTradeStatus(status: string | undefined | null): boolean {
  return normalizeP2PTradeStatus(status)?.toLowerCase() === "half-matched";
}

export function isP2PTradeCanceledStatus(status: string | undefined | null): boolean {
  if (status == null || typeof status !== "string") return false;
  const s = status.trim().toLowerCase();
  return s === "canceled" || s === "cancelled";
}

/** Backend may send US "canceled" or UK "cancelled". */
export function normalizeP2PTradeStatus(status: string | undefined | null): string | undefined {
  if (status == null || typeof status !== "string") return undefined;
  const s = status.trim().toLowerCase();
  if (s === "canceled" || s === "cancelled") return "cancelled";
  return status.trim();
}

export function isP2PTradeCanceledStatus(status: string | undefined | null): boolean {
  if (status == null || typeof status !== "string") return false;
  const s = status.trim().toLowerCase();
  return s === "canceled" || s === "cancelled";
}

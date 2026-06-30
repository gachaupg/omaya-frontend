import { getMessageFromApiError } from "@/lib/utils/errorHandler";

/** Cancel API may return 400 when the server timer or owner already cancelled the trade. */
export function isP2PTradeAlreadyCanceledError(error: unknown): boolean {
  const msg = getMessageFromApiError(error).toLowerCase();
  return (
    msg.includes("already cancel") || msg.includes("already been cancel")
  );
}

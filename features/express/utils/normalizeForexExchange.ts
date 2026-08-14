import type { ForexExchangeResponse } from "../types/forex";

export const forexExchangeMatchesId = (
  exchange:
    | {
        forex_transaction_id?: string;
        transaction_id?: string;
        id?: string;
      }
    | null
    | undefined,
  transactionId: string
): boolean => {
  if (!exchange || !transactionId) return false;
  const ids = [
    exchange.forex_transaction_id,
    exchange.transaction_id,
    exchange.id,
  ]
    .map((value) => String(value ?? "").trim())
    .filter(Boolean);
  return ids.includes(transactionId);
};

export const normalizeForexExchange = (
  payload: Record<string, unknown> | null | undefined,
  fallbackTransactionId?: string
): ForexExchangeResponse => {
  const source = payload && typeof payload === "object" ? payload : {};
  const resolvedId = String(
    source.forex_transaction_id ||
      source.transaction_id ||
      source.id ||
      fallbackTransactionId ||
      ""
  ).trim();

  return {
    ...(source as ForexExchangeResponse),
    forex_transaction_id: resolvedId,
    transaction_id: String(source.transaction_id || resolvedId || ""),
  };
};

export type ForexUiStep = "pending" | "processing" | "completed";

export const mapForexStatusToUiStep = (status: unknown): ForexUiStep => {
  const normalized = String(status ?? "").toLowerCase();
  if (["completed", "success", "finished", "complete"].includes(normalized)) {
    return "completed";
  }
  if (
    [
      "processing",
      "pending_review",
      "approved",
      "admin_approved",
      "in_progress",
      "processing_payment",
      "confirmed",
      "reviewing",
      "accepted",
    ].includes(normalized)
  ) {
    return "processing";
  }
  return "pending";
};

import { isP2PTradeCanceledStatus } from "./normalizeP2PTradeStatus";

const TERMINAL_MATCHED_TRADE_STATUSES = new Set([
  "cancelled",
  "canceled",
  "completed",
  "declined",
  "rejected",
  "refused",
  "failed",
  "expired",
]);

/** True when a matched-trade row should no longer appear in the notification bell / center. */
export function isTerminalMatchedTradeNotificationStatus(
  status: string | undefined | null
): boolean {
  if (status == null || typeof status !== "string") return false;
  const s = status.trim().toLowerCase();
  if (!s) return false;
  return TERMINAL_MATCHED_TRADE_STATUSES.has(s) || isP2PTradeCanceledStatus(s);
}

/** Whether this trade should count toward notification badge / list. */
export function isPendingMatchedTradeNotification(trade: {
  status?: string | null;
}): boolean {
  return !isTerminalMatchedTradeNotificationStatus(trade.status);
}

export function filterPendingMatchedTradeNotifications<
  T extends { status?: string | null },
>(trades: T[]): T[] {
  return trades.filter(isPendingMatchedTradeNotification);
}

export type MatchedTradeNotificationStatus = {
  text: string;
  color: string;
};

/** Display label for a pending matched-trade notification row. */
export function getMatchedTradeNotificationStatus(
  trade: { owner?: string; order_type?: string; status?: string | null },
  userEmail: string
): MatchedTradeNotificationStatus {
  const status = trade.status?.trim().toLowerCase() ?? "";
  if (isP2PTradeCanceledStatus(status)) {
    return { text: "Cancelled", color: "text-red-400" };
  }
  if (status === "completed") {
    return { text: "Completed", color: "text-gray-400" };
  }
  if (status === "pending_acceptance") {
    return { text: "Awaiting acceptance", color: "text-yellow-500" };
  }
  if (trade.owner === userEmail) {
    return { text: "Pending Incoming Trade", color: "text-[#1D8751]" };
  }
  return {
    text: `Pending ${trade.order_type === "sell" ? "Buy" : "Sell"} Trade`,
    color: "text-yellow-500",
  };
}

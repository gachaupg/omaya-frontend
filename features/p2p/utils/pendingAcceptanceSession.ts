import {
  getMatchedTradeNotificationDisplayName,
  getMatchedTradeNotificationProfileImage,
} from "@/features/p2p/utils/matchedTradeNotifications";

export type PendingAcceptanceSession = {
  tradeId: string;
  /** Market listing order id (sell_order / buy_order from confirm) */
  advertiserOrderId: string;
  advertiserName: string;
  advertiserPhoto?: string;
  advertiserInitials: string;
  isOnline: boolean;
  tradeType: "buy" | "sell";
  commission: string;
};

type NotificationTrade = {
  id?: string;
  owner?: string;
  order_type?: string;
  buy_order?: number | string | null;
  sell_order?: number | string | null;
  commission_rate?: number | string | null;
  rate?: number | string | null;
};

function initialsFromDisplayName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
  }
  if (parts.length === 1 && parts[0].length >= 2) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || "?";
}

/** Build wait-modal session for a counterparty viewing a matched-trade notification. */
export function buildPendingAcceptanceSessionFromNotificationTrade(
  trade: NotificationTrade,
  userEmail: string | null | undefined
): PendingAcceptanceSession | null {
  const tradeId = String(trade?.id ?? "").trim();
  if (!tradeId) return null;

  const orderType = String(trade.order_type ?? "").trim().toLowerCase();
  const advertiserOrderId = String(
    orderType === "sell" ? trade.sell_order : trade.buy_order ?? ""
  ).trim();
  if (!advertiserOrderId) return null;

  const advertiserName = getMatchedTradeNotificationDisplayName(trade, userEmail);
  const advertiserPhoto =
    getMatchedTradeNotificationProfileImage(trade, userEmail) ?? undefined;

  return {
    tradeId,
    advertiserOrderId,
    advertiserName,
    advertiserPhoto,
    advertiserInitials: initialsFromDisplayName(advertiserName),
    isOnline: false,
    tradeType: orderType === "sell" ? "buy" : "sell",
    commission: String(trade.commission_rate ?? trade.rate ?? "0"),
  };
}

export function navigateToMatchedTradeFromSession(
  session: PendingAcceptanceSession,
  tradeId: string
): void {
  const id = String(tradeId || session.tradeId || "").trim();
  if (!id) return;
  try {
    localStorage.setItem("p2p_trade_id", id);
  } catch {
    /* no-op */
  }
  const searchParams = new URLSearchParams();
  searchParams.set(
    "orderData",
    JSON.stringify({
      order_type: session.tradeType === "buy" ? "sell" : "buy",
      commission: session.commission,
    })
  );
  window.location.assign(
    `/p2p/${encodeURIComponent(id)}/matched/?${searchParams.toString()}`
  );
}

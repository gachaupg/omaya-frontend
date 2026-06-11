import type { LocalNotificationPayload } from "@/lib/notifications/webPushClient";
import {
  getMatchedTradeNotificationDisplayName,
  getMatchedTradeNotificationProfileImage,
  getMatchedTradeNotificationStatus,
} from "@/features/p2p/utils/matchedTradeNotifications";

type TradeLike = {
  id?: string | number | null;
  amount?: string | number | null;
  owner?: string;
  order_type?: string;
  status?: string | null;
  buyer?: string;
  seller?: string;
  buyer_full_name?: string | null;
  seller_full_name?: string | null;
  advertiser_name?: string | null;
  buyer_photo?: string | null;
  seller_photo?: string | null;
};

export function buildTradeNotificationPayload(
  trade: TradeLike,
  userEmail?: string | null
): LocalNotificationPayload {
  const name = getMatchedTradeNotificationDisplayName(trade, userEmail);
  const status = getMatchedTradeNotificationStatus(trade, userEmail || "");
  const amount = trade.amount != null ? String(trade.amount) : "";
  const tradeId = trade.id != null ? String(trade.id) : "";
  const photo = getMatchedTradeNotificationProfileImage(trade, userEmail);

  return {
    title: "New trade notification",
    body: `${name} · ${amount} USDT · ${status.text}`,
    tag: tradeId ? `trade-${tradeId}` : "omaya-trade",
    url: "/dashboard/notifications",
    icon: photo || "/favicon.svg",
  };
}

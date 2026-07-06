import type { HomeP2PBadge, HomeP2POffer, HomeP2PMode } from "../types";
import { getHomeP2PPaymentLogo } from "./paymentLogo";
import { mapOrderToMarketRow } from "./mapOrderToMarketRow";

const AVATAR_COLORS = ["#1D8751", "#854D0E", "#2563EB", "#7C3AED", "#BE123C"];

const ASSET_ICONS: Record<string, string> = {
  usdt: "/images/tether.svg",
  eth: "/images/eth.svg",
  btc: "/images/Bitcoin.svg",
};

function formatDisplayName(firstName: string, lastName: string): string {
  const first = firstName.trim();
  const last = lastName.trim();
  if (!first && !last) return "Trader";
  if (!last) return first;
  return `${first}_${last.charAt(0).toUpperCase()}`;
}

function formatRating(completionRate: unknown): string {
  const raw = parseFloat(String(completionRate ?? "0"));
  if (!Number.isFinite(raw) || raw <= 0) return "4.8";
  const normalized = raw > 1 ? raw / 100 : raw;
  const stars = Math.min(5, Math.max(3.5, normalized * 5));
  return stars.toFixed(1);
}

export function mapHomeP2POffers(
  orders: unknown[],
  mode: HomeP2PMode,
  limit = 3
): HomeP2POffer[] {
  return orders.slice(0, limit).flatMap((raw, index): HomeP2POffer[] => {
    const order = raw as Record<string, unknown>;
    const firstName = String(order.advertiser_first_name || "").trim();
    const lastName = String(order.advertiser_last_name || "").trim();
    const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "TR";
    const paymentDetails = Array.isArray(order.payment_details)
      ? (order.payment_details as Array<Record<string, unknown>>)
      : [];
    const primaryPayment = paymentDetails[0];
    const provider = String(
      primaryPayment?.provider || order.payment_provider || "Payment"
    ).trim();
    const providerLogo =
      (typeof primaryPayment?.provider_logo === "string" &&
        primaryPayment.provider_logo.trim()) ||
      getHomeP2PPaymentLogo(provider);
    const asset = String(order.asset || order.currency || "USDT").trim();
    const ticker = asset.toUpperCase();
    const buyTrades = Number(order.user_total_buy_orders || 0);
    const sellTrades = Number(order.user_total_sell_orders || 0);
    const combinedTrades = buyTrades + sellTrades;
    const tradesCount =
      combinedTrades > 0
        ? combinedTrades
        : Number(order.total_trades || order.user_total_buy_orders || order.user_total_sell_orders || 0);

    const isMerchant = Boolean(
      order.is_verified_merchant ?? order.is_merchant ?? order.verified_merchant
    );
    const isElite = Boolean(order.is_merchant_business);
    const marketRow = mapOrderToMarketRow(order);
    if (!marketRow?.id) return [];

    const badge: HomeP2PBadge | undefined = isElite
      ? "elite"
      : isMerchant
        ? "top-trader"
        : undefined;

    return [
      {
        id: String(order.id || index),
        displayName: formatDisplayName(firstName, lastName),
        advertiserInitials: initials,
        advertiserPhoto:
          typeof order.advertiser_photo === "string"
            ? order.advertiser_photo
            : undefined,
        avatarColor: AVATAR_COLORS[index % AVATAR_COLORS.length],
        badge,
        rating: formatRating(order.completion_rate),
        tradesCount: Number.isFinite(tradesCount) ? tradesCount : 0,
        paymentProvider: provider,
        paymentLogo: providerLogo,
        assetIcon: ASSET_ICONS[ticker.toLowerCase()] || ASSET_ICONS.usdt,
        assetTicker: ticker,
        online:
          typeof order.advertiser_online === "boolean"
            ? order.advertiser_online
            : order.status !== "offline",
        marketRow,
      },
    ];
  });
}

export function collectOrdersForMode(
  buyOrders: { results?: unknown[] } | null | undefined,
  sellOrders: { results?: unknown[] } | null | undefined,
  mode: HomeP2PMode
): unknown[] {
  if (mode === "buy") {
    return Array.isArray(sellOrders?.results) ? sellOrders.results : [];
  }
  return Array.isArray(buyOrders?.results) ? buyOrders.results : [];
}

import { AxiosError } from "axios";
import { getMatchedTrades } from "../api";
import { MatchedTrade } from "../types";
import {
  extractMessageFromResponseData,
  getMessageFromApiError,
} from "@/lib/utils/errorHandler";
import { isTerminalMatchedTradeNotificationStatus } from "./matchedTradeNotifications";

const ACTIVE_TRADE_ERROR_PATTERNS = [
  /active\s+trade/i,
  /ongoing\s+trade/i,
  /open\s+trade/i,
  /pending\s+trade/i,
  /cannot\s+(?:delete|cancel|remove)/i,
  /has\s+(?:an?\s+)?(?:active|open|ongoing|pending)/i,
  /in\s+progress/i,
];

export function isActiveTradeDeleteError(message: string): boolean {
  if (!message?.trim()) return false;
  return ACTIVE_TRADE_ERROR_PATTERNS.some((re) => re.test(message));
}

export function extractTradeIdFromDeleteError(
  error: unknown,
  message: string
): string | null {
  if (error instanceof AxiosError && error.response?.data) {
    const data = error.response.data as Record<string, unknown>;
    const candidates = [
      data.trade_id,
      data.active_trade_id,
      data.trade,
      data.transaction_id,
    ];
    for (const c of candidates) {
      if (c != null && String(c).trim()) return String(c).trim();
    }
    const nested = data.error;
    if (nested && typeof nested === "object") {
      const nestedObj = nested as Record<string, unknown>;
      if (nestedObj.trade_id != null) return String(nestedObj.trade_id);
    }
    const fromBody = extractMessageFromResponseData(data);
    if (fromBody && fromBody !== message) {
      const fromNested = extractTradeIdFromDeleteError(null, fromBody);
      if (fromNested) return fromNested;
    }
  }

  const uuid =
    message.match(
      /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i
    )?.[0] ?? message.match(/\b\d{5,}\b/)?.[0];
  return uuid ?? null;
}

export function tradeMatchesOrder(
  trade: MatchedTrade,
  orderId: string | number
): boolean {
  const id = String(orderId);
  return (
    (trade.buy_order != null && String(trade.buy_order) === id) ||
    (trade.sell_order != null && String(trade.sell_order) === id)
  );
}

export function isNonTerminalTrade(trade: MatchedTrade): boolean {
  return !isTerminalMatchedTradeNotificationStatus(trade.status);
}

/** Find an in-progress trade linked to this ad/order id (best-effort). */
export async function findActiveTradeForOrder(
  orderId: string
): Promise<MatchedTrade | null> {
  try {
    const response = await getMatchedTrades(1);
    const results = response?.results ?? [];
    const match = results.find(
      (t) => tradeMatchesOrder(t, orderId) && isNonTerminalTrade(t)
    );
    return match ?? null;
  } catch {
    return null;
  }
}

export function getDeleteAdErrorMessage(error: unknown): string {
  return getMessageFromApiError(error);
}

export function buildMatchedTradeHref(
  trade: MatchedTrade,
  userEmail?: string | null
): string {
  const isOwner = Boolean(
    userEmail && trade.owner && trade.owner === userEmail
  );
  if (isOwner) {
    const role = trade.order_type === "buy" ? "buyer" : "seller";
    return `/p2p/${trade.id}/matched?order_type=${trade.order_type}&trade=${role}`;
  }
  const orderData = encodeURIComponent(
    JSON.stringify({
      order_type: trade.order_type === "buy" ? "buy" : "sell",
    })
  );
  return `/p2p/${trade.id}/matched?orderData=${orderData}`;
}

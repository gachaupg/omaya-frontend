import type { MatchedTrade } from "@/features/p2p/types";

export type MatchedTradeRemovalHints = {
  tradeId?: string | null;
  orderId?: string | null;
};

function orderIdsMatch(trade: MatchedTrade, orderId: string): boolean {
  const target = String(orderId).trim();
  if (!target) return false;
  return (
    String(trade.buy_order ?? "") === target ||
    String(trade.sell_order ?? "") === target ||
    String(trade.associated_trade ?? "") === target
  );
}

export function matchedTradeMatchesRemovalHint(
  trade: MatchedTrade,
  hints: MatchedTradeRemovalHints
): boolean {
  const tradeHint = String(hints.tradeId ?? "").trim();
  const orderHint = String(hints.orderId ?? "").trim();
  const id = String(trade.id ?? "").trim();
  if (tradeHint && id === tradeHint) return true;
  if (orderHint && orderIdsMatch(trade, orderHint)) return true;
  return false;
}

export function isTradeInDismissedSet(
  trade: MatchedTrade,
  dismissed: ReadonlySet<string>
): boolean {
  if (!dismissed.size) return false;
  const id = String(trade.id ?? "").trim();
  if (id && dismissed.has(id)) return true;
  const buy = String(trade.buy_order ?? "").trim();
  const sell = String(trade.sell_order ?? "").trim();
  const assoc = String(trade.associated_trade ?? "").trim();
  return [buy, sell, assoc].some((key) => key && dismissed.has(key));
}

/** Collect every id/key we should treat as dismissed (trade id + order ids + hints). */
export function collectDismissedKeysForHints(
  trades: MatchedTrade[] | undefined,
  hints: MatchedTradeRemovalHints
): string[] {
  const keys = new Set<string>();
  const tradeHint = String(hints.tradeId ?? "").trim();
  const orderHint = String(hints.orderId ?? "").trim();
  if (tradeHint) keys.add(tradeHint);
  if (orderHint) keys.add(orderHint);

  for (const trade of trades ?? []) {
    if (!matchedTradeMatchesRemovalHint(trade, hints)) continue;
    const id = String(trade.id ?? "").trim();
    if (id) keys.add(id);
    const buy = String(trade.buy_order ?? "").trim();
    const sell = String(trade.sell_order ?? "").trim();
    const assoc = String(trade.associated_trade ?? "").trim();
    if (buy) keys.add(buy);
    if (sell) keys.add(sell);
    if (assoc) keys.add(assoc);
  }

  return Array.from(keys);
}

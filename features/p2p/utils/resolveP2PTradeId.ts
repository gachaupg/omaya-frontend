import type { MatchedTrade } from "@/features/p2p/types";
import { getConfirmOrderCached, primeP2PConfirmCache } from "./p2pConfirmCache";
import { store } from "@/store";
import type { RootState } from "@/store/rootReducer";
import {
  isP2PTradeCanceledStatus,
} from "./normalizeP2PTradeStatus";
import { isTradeAcceptedFromConfirmOrder } from "./tradeWsAcceptanceGate";

/** Single GET `/trading_engine/p2p/trades/{id}/confirm/` — use `confirm.id` as the trade key. */
export async function fetchP2PTradeConfirmOnce(
  idHint: string,
  options?: { force?: boolean }
): Promise<MatchedTrade | null> {
  const hint = String(idHint ?? "").trim();
  if (!hint) return null;
  try {
    const confirm = await getConfirmOrderCached(hint, options);
    primeP2PConfirmCache(confirm);
    return confirm;
  } catch {
    return null;
  }
}

/** Canonical trade id for WS + navigation (always `confirm.id`, not sell_order / buy_order). */
export function canonicalTradeIdFromConfirm(confirm: MatchedTrade): string {
  return String(confirm.id).trim();
}

export function isConfirmTerminalForWaitModal(confirm: MatchedTrade): boolean {
  const st = String(confirm.status ?? "").trim().toLowerCase();
  return (
    isP2PTradeCanceledStatus(st) ||
    ["declined", "rejected", "refused", "completed"].includes(st)
  );
}

/** trade_id / id from POST .../orders/{id}/match/ (shape varies by API version). */
export function extractTradeIdFromMatchResponse(response: unknown): string | null {
  if (!response || typeof response !== "object") return null;
  const r = response as Record<string, unknown>;
  const nested =
    r.trade && typeof r.trade === "object"
      ? (r.trade as Record<string, unknown>)
      : null;
  const candidates = [
    r.trade_id,
    r.tradeId,
    r.id,
    nested?.id,
    nested?.trade_id,
    nested?.tradeId,
  ];
  for (const c of candidates) {
    if (c != null && String(c).trim()) return String(c).trim();
  }
  return null;
}

function orderIdsMatch(trade: MatchedTrade, orderId: string): boolean {
  const target = String(orderId).trim();
  if (!target) return false;
  const buy = trade.buy_order;
  const sell = trade.sell_order;
  return (
    String(buy ?? "") === target ||
    String(sell ?? "") === target ||
    String(trade.associated_trade ?? "") === target
  );
}

/** Find an active trade row linked to a market order id. */
export function findTradeForP2POrder(
  trades: MatchedTrade[] | undefined,
  orderId: string
): MatchedTrade | null {
  if (!trades?.length || !orderId.trim()) return null;
  const matches = trades.filter((t) => orderIdsMatch(t, orderId));
  if (!matches.length) return null;
  // Prefer non-terminal, most recent (API usually returns newest first)
  const active = matches.find(
    (t) => !["cancelled", "canceled", "completed", "declined", "rejected", "refused"].includes(
      String(t.status ?? "").trim().toLowerCase()
    )
  );
  return active ?? matches[0];
}

/**
 * Resolve the real `/p2p/trades/{id}` key after matching a market order.
 * Match may only return a message; confirm/WS require the trade id, not the order id.
 */
/**
 * Resolve trade id without hammering confirm — at most one confirm GET when `confirmOnce` is true.
 */
export async function resolveP2PTradeIdForOrder(
  orderId: string,
  matchResponse?: unknown,
  options?: { hintTradeId?: string | null; confirmOnce?: boolean }
): Promise<string | null> {
  const order = String(orderId ?? "").trim();
  if (!order) return null;

  const fromMatch = extractTradeIdFromMatchResponse(matchResponse);
  const hint = options?.hintTradeId?.trim() || fromMatch;

  if (options?.confirmOnce !== false && hint) {
    const confirm = await fetchP2PTradeConfirmOnce(hint);
    if (confirm?.id) return canonicalTradeIdFromConfirm(confirm);
  }

  const cached = (store.getState() as RootState).matchedTrades?.data?.results;
  const fromCache = findTradeForP2POrder(cached, order);
  if (fromCache?.id) return String(fromCache.id).trim();

  if (hint && hint !== order) return hint;

  return null;
}

/** One confirm GET + optional matched-trades cache (no polling). */
export async function detectAcceptedTradeForOrder(
  orderId: string,
  hintTradeId?: string | null
): Promise<{ tradeId: string; accepted: boolean } | null> {
  const hint = hintTradeId?.trim() || orderId.trim();
  const confirm = hint ? await fetchP2PTradeConfirmOnce(hint) : null;
  if (confirm?.id) {
    const tradeId = canonicalTradeIdFromConfirm(confirm);
    return {
      tradeId,
      accepted: isTradeAcceptedFromConfirmOrder(confirm),
    };
  }

  const cached = (store.getState() as RootState).matchedTrades?.data?.results;
  const found = findTradeForP2POrder(cached, orderId);
  if (found?.id) {
    return {
      tradeId: String(found.id).trim(),
      accepted: isTradeAcceptedFromConfirmOrder(found),
    };
  }

  return hint ? { tradeId: hint, accepted: false } : null;
}

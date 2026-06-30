import type { AppDispatch } from "@/store";
import { P2P_TRADE_CANCELED_EVENT } from "@/features/p2p/constants/tradeSocketEvents";
import {
  collectDismissedKeysForHints,
  type MatchedTradeRemovalHints,
} from "@/features/p2p/utils/resolveMatchedTradeRemoval";
import type { MatchedTrade } from "@/features/p2p/types";

export { isP2PTradeAlreadyCanceledError } from "@/features/p2p/utils/p2pCancelErrors";

/** Drop a trade from the bell / notification center immediately (Redux + window event). */
export function syncTradeRemovedFromNotifications(
  dispatch: AppDispatch,
  hints: MatchedTradeRemovalHints,
  source = "local",
  currentTrades?: MatchedTrade[] | null
): void {
  void (async () => {
    const [{ store }, matchedTradesSlice] = await Promise.all([
      import("@/store"),
      import("@/features/p2p/slices/matchedTradesSlice"),
    ]);

    const { dismissMatchedTradesFromNotifications, fetchLatestMatchedTradesPage } =
      matchedTradesSlice;

    const trades =
      currentTrades ??
      (store.getState() as { matchedTrades?: { data?: { results?: MatchedTrade[] } } })
        .matchedTrades?.data?.results;

    const dismissedKeys = collectDismissedKeysForHints(trades, hints);

    if (!dismissedKeys.length) {
      const fallback = String(hints.tradeId ?? hints.orderId ?? "").trim();
      if (fallback) dismissedKeys.push(fallback);
    }
    if (!dismissedKeys.length) return;

    dispatch(dismissMatchedTradesFromNotifications(dismissedKeys));

    const primaryTradeId =
      dismissedKeys.find((key) =>
        trades?.some((trade) => String(trade.id ?? "") === key)
      ) ?? dismissedKeys[0];

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent(P2P_TRADE_CANCELED_EVENT, {
          detail: { tradeId: primaryTradeId, source, dismissedKeys },
        })
      );
    }

    try {
      const raw = localStorage.getItem("p2p_orders");
      if (raw) {
        const orders = JSON.parse(raw) as Array<{ id?: unknown }>;
        if (Array.isArray(orders)) {
          const drop = new Set(dismissedKeys);
          const next = orders.filter(
            (order) => !drop.has(String(order?.id ?? ""))
          );
          if (next.length !== orders.length) {
            localStorage.setItem("p2p_orders", JSON.stringify(next));
          }
        }
      }
    } catch {
      /* no-op */
    }

    try {
      localStorage.removeItem("new_order");
    } catch {
      /* no-op */
    }

    void dispatch(fetchLatestMatchedTradesPage());
  })();
}

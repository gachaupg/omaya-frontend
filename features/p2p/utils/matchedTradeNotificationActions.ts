import type { AppDispatch } from "@/store";
import { respondToP2PTrade } from "@/features/p2p/api";
import { fetchMatchedTrades } from "@/features/p2p/slices/matchedTradesSlice";
import { showToast } from "@/lib/utils/toast";
import { getMessageFromApiError } from "@/lib/utils/errorHandler";
import { waitForTradeConfirmStatus } from "@/features/p2p/utils/waitTradeConfirmSocketStatus";
import {
  isPendingAcceptanceStatus,
  parseTradeTimestampMs,
  recordPendingAcceptanceStartedAt,
} from "@/features/p2p/utils/tradeWsAcceptanceGate";
import {
  buildPendingAcceptanceSessionFromNotificationTrade,
  type PendingAcceptanceSession,
} from "@/features/p2p/utils/pendingAcceptanceSession";

const normalizeEmail = (e: string | null | undefined) =>
  String(e ?? "").trim().toLowerCase();

/** When owner === logged user: show order_type as-is (Buy/Sell). When not owner: show counterparty action. */
export function getMatchedTradeNotificationOrderType(
  order_type: string,
  isOwner: boolean
) {
  if (isOwner) {
    return order_type === "buy"
      ? { label: "Buy", color: "text-[#1D8751]" }
      : { label: "Sell", color: "text-red-400" };
  }
  return order_type === "buy"
    ? { label: "Sell", color: "text-red-400" }
    : { label: "Buy", color: "text-[#1D8751]" };
}

export function isLoggedInUserAdvertiserOnTrade(
  trade: { owner?: string; advertiser_email?: string },
  userEmail: string | null | undefined
): boolean {
  const advertiser =
    trade.advertiser_email != null && String(trade.advertiser_email).trim() !== ""
      ? trade.advertiser_email
      : trade.owner;
  if (!userEmail || !advertiser) return false;
  return normalizeEmail(userEmail) === normalizeEmail(advertiser);
}

type OpenMatchedTradeNotificationOptions = {
  trade: Record<string, unknown>;
  userEmail?: string | null;
  dispatch: AppDispatch;
  router: { push: (href: string) => void };
  activePage?: number;
  onPendingAcceptance?: (session: PendingAcceptanceSession) => void;
  onBeforeNavigate?: () => void;
  onRespondingChange?: (tradeId: string | null) => void;
};

export async function openMatchedTradeNotification({
  trade,
  userEmail,
  dispatch,
  router,
  activePage = 1,
  onPendingAcceptance,
  onBeforeNavigate,
  onRespondingChange,
}: OpenMatchedTradeNotificationOptions): Promise<void> {
  const tradeId = String(trade?.id ?? "");
  if (!tradeId) return;

  if (isLoggedInUserAdvertiserOnTrade(trade, userEmail)) {
    onRespondingChange?.(tradeId);
    try {
      const liveStatus = await waitForTradeConfirmStatus(tradeId, {
        timeoutMs: 10_000,
      });
      if (liveStatus && isPendingAcceptanceStatus(liveStatus)) {
        await respondToP2PTrade(tradeId, "accept");
        void dispatch(fetchMatchedTrades(activePage));
      }
    } catch (error: unknown) {
      const detail = getMessageFromApiError(error);
      showToast.error("Trade could not be accepted", detail, {
        position: "top-center",
      });
      return;
    } finally {
      onRespondingChange?.(null);
    }
  }

  if (isPendingAcceptanceStatus(String(trade?.status ?? ""))) {
    recordPendingAcceptanceStartedAt(
      tradeId,
      parseTradeTimestampMs(trade?.timestamp) ?? Date.now()
    );
  }

  try {
    const fullOrderData = {
      ...trade,
      storedAt: new Date().toISOString(),
      viewedFrom: "notifications",
    };
    localStorage.setItem("new_order", JSON.stringify(fullOrderData));
    const existingOrders = JSON.parse(
      localStorage.getItem("p2p_orders") || "[]"
    );
    const orderExists = existingOrders.find(
      (order: { id?: unknown }) => String(order?.id) === tradeId
    );
    if (!orderExists) {
      existingOrders.push(fullOrderData);
      localStorage.setItem("p2p_orders", JSON.stringify(existingOrders));
    } else {
      const orderIndex = existingOrders.findIndex(
        (order: { id?: unknown }) => String(order?.id) === tradeId
      );
      existingOrders[orderIndex] = fullOrderData;
      localStorage.setItem("p2p_orders", JSON.stringify(existingOrders));
    }
  } catch {
    /* no-op */
  }

  const isOwner = trade.owner === userEmail;

  onBeforeNavigate?.();

  if (isOwner) {
    router.push(
      `/p2p/${tradeId}/matched?order_type=${trade.order_type}&trade=${trade.order_type === "buy" ? "buyer" : "seller"}`
    );
    return;
  }

  if (isPendingAcceptanceStatus(String(trade?.status ?? ""))) {
    const session = buildPendingAcceptanceSessionFromNotificationTrade(
      trade,
      userEmail
    );
    if (session) {
      try {
        localStorage.setItem("p2p_trade_id", tradeId);
      } catch {
        /* no-op */
      }
      onPendingAcceptance?.(session);
      return;
    }
  }

  const orderData = encodeURIComponent(
    JSON.stringify({
      order_type: trade.order_type === "buy" ? "buy" : "sell",
    })
  );
  router.push(`/p2p/${tradeId}/matched?orderData=${orderData}`);
}

import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { P2P_TRADE_CANCELED_EVENT } from "../constants/tradeSocketEvents";
import { isP2PTradeCanceledStatus } from "../utils/normalizeP2PTradeStatus";
import {
  wsPayloadToSnapshot,
  wsStatusPayloadMatchesTrade,
} from "../utils/tradeWsAcceptanceGate";
import { showToast } from "@/lib/utils/toast";

type Options = {
  tradeId: string | undefined | null;
  confirmOrderStatus: string | undefined;
  enabled?: boolean;
};

/**
 * Redirects to P2P market when a trade is cancelled (WS status, global cancel event, or REST refresh).
 * Used by TradeBuyOwner / TradeSellerOwner owner trade screens.
 */
export function useP2pTradeCanceledRedirect({
  tradeId,
  confirmOrderStatus,
  enabled = true,
}: Options) {
  const router = useRouter();
  const exitingRef = useRef(false);
  const tradeIdRef = useRef(tradeId);
  tradeIdRef.current = tradeId;

  const exitToP2p = useCallback(
    (message = "The trade has been cancelled. Returning you to P2P market.") => {
      if (exitingRef.current) return;
      exitingRef.current = true;
      showToast.error("Trade Cancelled", message);
      try {
        localStorage.removeItem("p2p_trade_id");
        localStorage.removeItem("new_order");
      } catch {
        /* no-op */
      }
      setTimeout(() => {
        router.push("/dashboard/p2p");
      }, 900);
    },
    [router]
  );

  /** Returns true when the payload indicates cancel and redirect was triggered. */
  const handleWsStatusPayload = useCallback(
    (payload: Record<string, unknown>): boolean => {
      if (!enabled) return false;

      const pageTradeId = String(tradeIdRef.current ?? "").trim();
      if (pageTradeId && !wsStatusPayloadMatchesTrade(payload, pageTradeId)) {
        return false;
      }

      const snap = wsPayloadToSnapshot(payload);
      const fromSnap = snap.rawStatus;
      const fromStatus = String(payload.status ?? "").trim();
      if (
        isP2PTradeCanceledStatus(fromSnap) ||
        isP2PTradeCanceledStatus(fromStatus)
      ) {
        exitToP2p("This trade was cancelled. Returning you to P2P market.");
        return true;
      }
      return false;
    },
    [enabled, exitToP2p]
  );

  useEffect(() => {
    if (!enabled || !tradeId) return;

    const onCanceled = (e: Event) => {
      const detail = (
        e as CustomEvent<{ tradeId?: string; message?: string }>
      ).detail;
      const cur = String(tradeIdRef.current ?? "").trim();
      if (detail?.tradeId && cur && String(detail.tradeId).trim() !== cur) {
        return;
      }
      exitToP2p(
        detail?.message ||
          "This trade was cancelled. Returning you to P2P market."
      );
    };

    window.addEventListener(P2P_TRADE_CANCELED_EVENT, onCanceled);
    return () =>
      window.removeEventListener(P2P_TRADE_CANCELED_EVENT, onCanceled);
  }, [enabled, tradeId, exitToP2p]);

  useEffect(() => {
    if (!enabled) return;
    if (isP2PTradeCanceledStatus(confirmOrderStatus)) {
      exitToP2p("This trade was cancelled. Returning you to P2P market.");
    }
  }, [enabled, confirmOrderStatus, exitToP2p]);

  return { exitToP2p, handleWsStatusPayload };
}

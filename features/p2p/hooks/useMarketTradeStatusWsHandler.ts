import { useCallback, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store";
import {
  fetchConfirmOrder,
  patchConfirmOrderFromWs,
} from "@/features/p2p/slices/orderSlice";
import { normalizeP2PTradeStatus } from "@/features/p2p/utils/normalizeP2PTradeStatus";
import {
  isDeclinedLikeStatus,
  isPendingAcceptanceStatus,
  shouldRefreshConfirmOrderFromWs,
  wsPayloadToSnapshot,
  wsStatusPayloadMatchesTrade,
  type WsTradeSnapshot,
} from "@/features/p2p/utils/tradeWsAcceptanceGate";
import { logger } from "@/lib/utils/logger";

type ConfirmOrderLike = {
  id?: string;
  status?: string;
  can_confirm_payment?: boolean;
  can_confirm_receipt?: boolean;
} | null;

type UseMarketTradeStatusWsHandlerOptions = {
  confirmOrder: ConfirmOrderLike;
  /** Return true when payload was handled (e.g. cancel redirect). */
  onCanceledPayload?: (payload: Record<string, unknown>) => boolean;
  onCanceled?: () => void;
  onDeclined?: () => void;
  onSnapshot?: (snap: WsTradeSnapshot) => void;
  onPendingAcceptance?: (active: boolean) => void;
  logLabel?: string;
};

/**
 * Shared p2p-trade-confirm WebSocket handler for market buy/sell forms and owner trade screens.
 * Patches Redux immediately and refetches confirm when status or confirm flags change.
 */
export function useMarketTradeStatusWsHandler({
  confirmOrder,
  onCanceledPayload,
  onCanceled,
  onDeclined,
  onSnapshot,
  onPendingAcceptance,
  logLabel = "market",
}: UseMarketTradeStatusWsHandlerOptions) {
  const dispatch = useDispatch<AppDispatch>();
  const confirmOrderRef = useRef(confirmOrder);
  confirmOrderRef.current = confirmOrder;

  const onCanceledPayloadRef = useRef(onCanceledPayload);
  onCanceledPayloadRef.current = onCanceledPayload;
  const onCanceledRef = useRef(onCanceled);
  onCanceledRef.current = onCanceled;
  const onDeclinedRef = useRef(onDeclined);
  onDeclinedRef.current = onDeclined;
  const onSnapshotRef = useRef(onSnapshot);
  onSnapshotRef.current = onSnapshot;
  const onPendingAcceptanceRef = useRef(onPendingAcceptance);
  onPendingAcceptanceRef.current = onPendingAcceptance;

  return useCallback(
    (status: unknown) => {
      const payload = status as Record<string, unknown>;
      const order = confirmOrderRef.current;
      const pageTradeId = String(order?.id ?? "").trim();

      logger.debug("p2p", `[${logLabel}] trade-status WS`, {
        pageTradeId,
        payloadStatus: payload.status,
        can_confirm_payment: payload.can_confirm_payment,
      });

      if (onCanceledPayloadRef.current?.(payload)) {
        return;
      }

      if (pageTradeId && !wsStatusPayloadMatchesTrade(payload, pageTradeId)) {
        logger.debug("p2p", `[${logLabel}] skip WS — trade id mismatch`, { pageTradeId });
        return;
      }

      const snap = wsPayloadToSnapshot(payload);
      onSnapshotRef.current?.(snap);

      const lowered = snap.rawStatus.toLowerCase();
      if (lowered === "cancelled" || lowered === "canceled") {
        onCanceledRef.current?.();
        return;
      }

      if (isDeclinedLikeStatus(payload)) {
        onDeclinedRef.current?.();
        return;
      }

      onPendingAcceptanceRef.current?.(isPendingAcceptanceStatus(snap.rawStatus));

      const normalizedStatus =
        normalizeP2PTradeStatus(snap.rawStatus) ?? snap.rawStatus;
      if (
        normalizedStatus ||
        snap.can_confirm_payment !== undefined ||
        snap.can_confirm_receipt !== undefined
      ) {
        dispatch(
          patchConfirmOrderFromWs({
            status: normalizedStatus || undefined,
            can_confirm_payment: snap.can_confirm_payment,
            can_confirm_receipt: snap.can_confirm_receipt,
          })
        );
      }

      if (pageTradeId && shouldRefreshConfirmOrderFromWs(order, snap)) {
        logger.debug("p2p", `[${logLabel}] refresh confirm from WS`, {
          from: order?.status,
          to: snap.rawStatus,
          can_confirm_payment: snap.can_confirm_payment,
        });
        void dispatch(fetchConfirmOrder(pageTradeId));
      }
    },
    [dispatch, logLabel]
  );
}

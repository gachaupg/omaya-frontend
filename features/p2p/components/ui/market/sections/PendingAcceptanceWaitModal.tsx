"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { PresenceIndicator } from "./UserStatusBadge";
import { useTradeStatusWebSocket } from "@/features/p2p/hooks/useTradeStatusWebSocket";
import { cancelP2POrder } from "@/features/p2p/api";
import {
  PENDING_ACCEPTANCE_AUTO_CANCEL_MS,
  PENDING_ACCEPTANCE_AUTO_CANCEL_NOTE,
  PENDING_ACCEPTANCE_WAIT_MESSAGE,
  recordPendingAcceptanceStartedAt,
  clearPendingAcceptanceStartedAt,
  wsPayloadToSnapshot,
  isDeclinedLikeStatus,
  formatCountdownSeconds,
  wsStatusPayloadMatchesTradeOrOrder,
  isTradeAcceptedFromWsSnapshot,
  isTradeAcceptedFromConfirmOrder,
  getTradeIdFromWsStatusPayload,
} from "@/features/p2p/utils/tradeWsAcceptanceGate";
import {
  canonicalTradeIdFromConfirm,
  fetchP2PTradeConfirmOnce,
  findTradeForP2POrder,
} from "@/features/p2p/utils/resolveP2PTradeId";
import { RootState } from "@/store/rootReducer";
import { showToast } from "@/lib/utils/toast";
import {
  logTradePreview,
  logTradePreviewSockets,
} from "@/features/p2p/utils/tradePreviewDebug";

interface PendingAcceptanceWaitModalProps {
  open: boolean;
  /** Canonical trade id from GET .../trades/{id}/confirm/ → `confirm.id` */
  tradeId: string;
  /** Market listing order id (sell_order / buy_order uuid from confirm) */
  advertiserOrderId: string;
  advertiserName: string;
  advertiserPhoto?: string;
  advertiserInitials: string;
  isOnline: boolean;
  onNavigateToMatched: (tradeId: string) => void;
  onClose: () => void;
}

const USER_NOT_FOUND_MESSAGE = "We couldn't find the user.";

const USER_NOT_FOUND_DISPLAY_MS = 2000;

export const PendingAcceptanceWaitModal: React.FC<PendingAcceptanceWaitModalProps> = ({
  open,
  tradeId,
  advertiserOrderId,
  advertiserName,
  advertiserPhoto,
  advertiserInitials,
  isOnline,
  onNavigateToMatched,
  onClose,
}) => {
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [tick, setTick] = useState(0);
  const [closingMessage, setClosingMessage] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  const exitingRef = useRef(false);
  const acceptedRef = useRef(false);
  const activeTradeIdRef = useRef(tradeId);
  const closeAfterMessageRef = useRef<number | null>(null);
  const autoCancelTimerRef = useRef<number | null>(null);
  const onNavigateRef = useRef(onNavigateToMatched);
  const onCloseRef = useRef(onClose);

  onNavigateRef.current = onNavigateToMatched;
  onCloseRef.current = onClose;

  const matchedTrades = useSelector(
    (state: RootState) => state.matchedTrades?.data?.results
  );

  const clearAutoCancelTimers = useCallback(() => {
    if (autoCancelTimerRef.current) {
      window.clearTimeout(autoCancelTimerRef.current);
      autoCancelTimerRef.current = null;
    }
    if (closeAfterMessageRef.current) {
      window.clearTimeout(closeAfterMessageRef.current);
      closeAfterMessageRef.current = null;
    }
  }, []);

  const goToMatchedPage = useCallback(
    (resolvedTradeId: string) => {
      if (acceptedRef.current || exitingRef.current) return;
      const id =
        resolvedTradeId.trim() ||
        activeTradeIdRef.current.trim() ||
        tradeId.trim();
      if (!id) return;

      acceptedRef.current = true;
      exitingRef.current = true;
      clearAutoCancelTimers();
      activeTradeIdRef.current = id;
      try {
        localStorage.setItem("p2p_trade_id", id);
        clearPendingAcceptanceStartedAt(id);
      } catch {
        /* no-op */
      }
      logTradePreview("wait modal: owner accepted → navigating", { tradeId: id });
      onNavigateRef.current(id);
    },
    [clearAutoCancelTimers, tradeId]
  );

  const finishAndReturnToTable = useCallback(
    (force = false) => {
      if (!force && exitingRef.current) return;
      exitingRef.current = true;
      if (closeAfterMessageRef.current) {
        window.clearTimeout(closeAfterMessageRef.current);
        closeAfterMessageRef.current = null;
      }
      void cancelP2POrder(activeTradeIdRef.current || tradeId).catch(() => {
        /* trade may already be cancelled */
      });
      try {
        localStorage.removeItem("p2p_trade_id");
        clearPendingAcceptanceStartedAt(activeTradeIdRef.current || tradeId);
      } catch {
        /* no-op */
      }
      onCloseRef.current();
    },
    [tradeId]
  );

  const performDismiss = useCallback(
    (opts?: { message?: string; cancelTrade?: boolean }) => {
      if (exitingRef.current) {
        finishAndReturnToTable(true);
        return;
      }
      exitingRef.current = true;
      if (opts?.message) setClosingMessage(opts.message);
      const delay = opts?.message ? 1400 : 0;
      window.setTimeout(() => {
        if (opts?.cancelTrade === false) {
          try {
            localStorage.removeItem("p2p_trade_id");
          } catch {
            /* no-op */
          }
          onCloseRef.current();
        } else {
          finishAndReturnToTable(true);
        }
      }, delay);
    },
    [finishAndReturnToTable]
  );

  const handleStatusUpdate = useCallback(
    (status: unknown) => {
      if (acceptedRef.current || exitingRef.current) return;

      const payload = status as Record<string, unknown>;
      if (
        !wsStatusPayloadMatchesTradeOrOrder(
          payload,
          activeTradeIdRef.current,
          advertiserOrderId
        )
      ) {
        return;
      }

      const wsTradeId = getTradeIdFromWsStatusPayload(payload);
      if (wsTradeId) activeTradeIdRef.current = wsTradeId;

      const snap = wsPayloadToSnapshot(payload);
      const lowered = snap.rawStatus.toLowerCase();

      if (lowered === "cancelled" || lowered === "canceled") {
        logTradePreview("WS trade canceled", { trade_id: wsTradeId, status: snap.rawStatus });
        showToast.warning("Trade cancelled", "This trade was cancelled.");
        void performDismiss({ message: "This trade was cancelled.", cancelTrade: false });
        return;
      }

      if (isDeclinedLikeStatus(payload)) {
        showToast.error("Trade declined", "The trade owner declined this trade.");
        void performDismiss({
          message: "The trade owner declined this trade.",
          cancelTrade: false,
        });
        return;
      }

      logTradePreview("WS status_update", {
        status: snap.rawStatus,
        can_confirm_payment: snap.can_confirm_payment,
        can_confirm_receipt: snap.can_confirm_receipt,
        trade_id: wsTradeId || activeTradeIdRef.current,
        accepted: isTradeAcceptedFromWsSnapshot(snap),
      });

      if (isTradeAcceptedFromWsSnapshot(snap)) {
        goToMatchedPage(wsTradeId || activeTradeIdRef.current || tradeId);
      }
    },
    [advertiserOrderId, goToMatchedPage, performDismiss, tradeId]
  );

  useEffect(() => {
    if (!open) {
      setStartedAt(null);
      return;
    }

    exitingRef.current = false;
    acceptedRef.current = false;
    setClosingMessage(null);
    setImageError(false);
    activeTradeIdRef.current = tradeId;
    recordPendingAcceptanceStartedAt(tradeId);
    setStartedAt((prev) => prev ?? Date.now());

    logTradePreview("wait modal opened (WS only — confirm already fetched on submit)", {
      tradeId,
      advertiserOrderId,
      advertiserName,
    });
    logTradePreviewSockets(tradeId, "wait-modal");

    const tickId = window.setInterval(() => setTick((t) => t + 1), 1000);
    return () => window.clearInterval(tickId);
  }, [open, tradeId, advertiserOrderId, advertiserName]);

  // Matched-trades WebSocket → Redux (no REST confirm polling)
  useEffect(() => {
    if (!open || acceptedRef.current || exitingRef.current) return;
    const found = findTradeForP2POrder(matchedTrades, advertiserOrderId);
    if (!found?.id) return;

    if (String(found.id) !== activeTradeIdRef.current) {
      activeTradeIdRef.current = String(found.id);
    }

    logTradePreview("matched-trades Redux feed", {
      tradeId: found.id,
      status: found.status,
      accepted: isTradeAcceptedFromConfirmOrder(found),
    });
    if (isTradeAcceptedFromConfirmOrder(found)) {
      goToMatchedPage(String(found.id));
    }
  }, [matchedTrades, open, advertiserOrderId, goToMatchedPage]);

  useTradeStatusWebSocket({
    tradeId,
    enabled: open && Boolean(tradeId),
    onStatusUpdate: handleStatusUpdate,
  });

  // Backup when WS is slow or missed — poll confirm until owner accepts.
  useEffect(() => {
    if (!open || acceptedRef.current || exitingRef.current) return;

    const pollConfirm = async () => {
      if (acceptedRef.current || exitingRef.current) return;
      const hint = activeTradeIdRef.current || tradeId;
      const confirm = await fetchP2PTradeConfirmOnce(hint, { force: true });
      if (!confirm || acceptedRef.current || exitingRef.current) return;
      if (isTradeAcceptedFromConfirmOrder(confirm)) {
        goToMatchedPage(canonicalTradeIdFromConfirm(confirm));
      }
    };

    const pollId = window.setInterval(() => {
      void pollConfirm();
    }, 4000);
    const initialId = window.setTimeout(() => {
      void pollConfirm();
    }, 2000);

    return () => {
      window.clearInterval(pollId);
      window.clearTimeout(initialId);
    };
  }, [open, tradeId, goToMatchedPage]);

  useEffect(() => {
    if (!open || startedAt == null) return;

    const runAutoCancel = () => {
      if (exitingRef.current || acceptedRef.current) return;
      exitingRef.current = true;
      setClosingMessage(USER_NOT_FOUND_MESSAGE);
      showToast.warning("User unavailable", USER_NOT_FOUND_MESSAGE);

      closeAfterMessageRef.current = window.setTimeout(() => {
        finishAndReturnToTable(true);
      }, USER_NOT_FOUND_DISPLAY_MS);
    };

    const elapsed = Date.now() - startedAt;
    const remaining = PENDING_ACCEPTANCE_AUTO_CANCEL_MS - elapsed;

    if (remaining <= 0) {
      runAutoCancel();
      return;
    }

    autoCancelTimerRef.current = window.setTimeout(runAutoCancel, remaining);
    return () => {
      if (autoCancelTimerRef.current) {
        window.clearTimeout(autoCancelTimerRef.current);
        autoCancelTimerRef.current = null;
      }
      if (closeAfterMessageRef.current) {
        window.clearTimeout(closeAfterMessageRef.current);
        closeAfterMessageRef.current = null;
      }
    };
  }, [open, startedAt, finishAndReturnToTable]);

  if (!open) return null;

  const secondsLeft =
    startedAt != null
      ? Math.max(
          0,
          Math.ceil(
            (PENDING_ACCEPTANCE_AUTO_CANCEL_MS - (Date.now() - startedAt)) / 1000
          )
        )
      : null;

  const bannerText =
    closingMessage ??
    (secondsLeft != null
      ? `${PENDING_ACCEPTANCE_WAIT_MESSAGE} ${PENDING_ACCEPTANCE_AUTO_CANCEL_NOTE} (${formatCountdownSeconds(secondsLeft)})`
      : PENDING_ACCEPTANCE_WAIT_MESSAGE);

  return (
    <div
      className="fixed inset-0 z-[2147483646] flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pending-acceptance-title"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="relative w-full max-w-md rounded-2xl border border-gray-200 bg-white p-5 shadow-xl dark:border-[#35353E] dark:bg-[var(--card-color)]">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative shrink-0">
            {advertiserPhoto && !imageError ? (
              <img
                src={advertiserPhoto}
                alt={advertiserName}
                className="w-12 h-12 rounded-full object-cover bg-[#1D8751]"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold bg-[#1D8751] text-white">
                {advertiserInitials}
              </div>
            )}
            <PresenceIndicator isOnline={isOnline} />
          </div>
          <div className="min-w-0">
            <h2
              id="pending-acceptance-title"
              className="text-base font-semibold text-gray-900 dark:text-white truncate"
            >
              {advertiserName}
            </h2>
            <p className="text-xs text-gray-500 dark:text-[#788099]">
              Awaiting trade owner
            </p>
          </div>
        </div>

        <div
          role="status"
          className="rounded-xl px-4 py-3 text-sm font-medium border border-[#1D8751]/40 bg-[#1D8751]/10 text-gray-900 dark:text-white dark:bg-[#1D8751]/20 mb-4"
        >
          {closingMessage ? (
            <span>{closingMessage}</span>
          ) : (
            <>
              <span className="inline-block w-2 h-2 rounded-full bg-[#1D8751] animate-pulse mr-2 align-middle" />
              {bannerText}
            </>
          )}
        </div>

        <button
          type="button"
          className="w-full py-2.5 rounded-lg border border-gray-300 dark:border-[#788099] text-gray-700 dark:text-[#788099] font-semibold text-sm hover:bg-gray-100 dark:hover:bg-[#35353E] transition"
          onClick={() =>
            closingMessage
              ? finishAndReturnToTable(true)
              : performDismiss()
          }
        >
          {closingMessage ? "Back to market" : "Cancel and close"}
        </button>
      </div>
    </div>
  );
};


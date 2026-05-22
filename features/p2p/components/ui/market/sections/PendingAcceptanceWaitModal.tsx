"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { PresenceIndicator } from "./UserStatusBadge";
import { useTradeStatusWebSocket } from "@/features/p2p/hooks/useTradeStatusWebSocket";
import { cancelP2POrder, getConfirmOrder } from "@/features/p2p/api";
import {
  PENDING_ACCEPTANCE_AUTO_CANCEL_MS,
  wsPayloadToSnapshot,
  isDeclinedLikeStatus,
  formatCountdownSeconds,
  wsStatusPayloadMatchesTrade,
  isTradeAcceptedFromWsSnapshot,
  isTradeAcceptedFromConfirmOrder,
} from "@/features/p2p/utils/tradeWsAcceptanceGate";
import { showToast } from "@/lib/utils/toast";

interface PendingAcceptanceWaitModalProps {
  open: boolean;
  tradeId: string;
  advertiserName: string;
  advertiserPhoto?: string;
  advertiserInitials: string;
  isOnline: boolean;
  onAccepted: () => void;
  onClose: () => void;
}

const WAIT_MESSAGE =
  "Waiting for the trade owner to accept this trade before you can make the payments.";

const AUTO_CANCEL_TIMER_NOTE =
  "Trade will be cancelled automatically after the timer.";

const USER_NOT_FOUND_MESSAGE = "We couldn't find the user.";

/** How long to show the message before closing modals and returning to the table. */
const USER_NOT_FOUND_DISPLAY_MS = 2000;

export const PendingAcceptanceWaitModal: React.FC<PendingAcceptanceWaitModalProps> = ({
  open,
  tradeId,
  advertiserName,
  advertiserPhoto,
  advertiserInitials,
  isOnline,
  onAccepted,
  onClose,
}) => {
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [tick, setTick] = useState(0);
  const [closingMessage, setClosingMessage] = useState<string | null>(null);
  const exitingRef = useRef(false);
  const acceptedRef = useRef(false);
  const closeAfterMessageRef = useRef<number | null>(null);
  const autoCancelTimerRef = useRef<number | null>(null);
  const [imageError, setImageError] = useState(false);

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

  const handleAccepted = useCallback(() => {
    if (acceptedRef.current || exitingRef.current) return;
    acceptedRef.current = true;
    exitingRef.current = true;
    clearAutoCancelTimers();
    onAccepted();
  }, [clearAutoCancelTimers, onAccepted]);

  const finishAndReturnToTable = useCallback(
    (force = false) => {
      if (!force && exitingRef.current) return;
      exitingRef.current = true;
      if (closeAfterMessageRef.current) {
        window.clearTimeout(closeAfterMessageRef.current);
        closeAfterMessageRef.current = null;
      }
      void cancelP2POrder(tradeId).catch(() => {
        /* trade may already be cancelled */
      });
      try {
        localStorage.removeItem("p2p_trade_id");
      } catch {
        /* no-op */
      }
      onClose();
    },
    [tradeId, onClose]
  );

  useEffect(() => {
    if (open && tradeId) {
      setStartedAt(Date.now());
      exitingRef.current = false;
      acceptedRef.current = false;
      setClosingMessage(null);
      setImageError(false);
    } else if (!open) {
      setStartedAt(null);
    }
  }, [open, tradeId]);

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
          onClose();
        } else {
          finishAndReturnToTable(true);
        }
      }, delay);
    },
    [finishAndReturnToTable, onClose]
  );

  const handleStatusUpdate = useCallback(
    (status: unknown) => {
      const payload = status as Record<string, unknown>;
      if (!wsStatusPayloadMatchesTrade(payload, tradeId)) return;

      const snap = wsPayloadToSnapshot(payload);
      const lowered = snap.rawStatus.toLowerCase();

      if (lowered === "cancelled" || lowered === "canceled") {
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

      if (isTradeAcceptedFromWsSnapshot(snap)) {
        handleAccepted();
      }
    },
    [tradeId, handleAccepted, performDismiss]
  );

  // REST fallback in case acceptance arrives before WS connects
  useEffect(() => {
    if (!open || !tradeId) return;

    const checkAccepted = async () => {
      if (acceptedRef.current || exitingRef.current) return;
      try {
        const confirm = await getConfirmOrder(tradeId);
        if (isTradeAcceptedFromConfirmOrder(confirm)) {
          handleAccepted();
        }
      } catch {
        /* ignore */
      }
    };

    void checkAccepted();
    const pollId = window.setInterval(() => void checkAccepted(), 1500);
    return () => window.clearInterval(pollId);
  }, [open, tradeId, handleAccepted]);

  useTradeStatusWebSocket({
    tradeId,
    enabled: open && !!tradeId,
    onStatusUpdate: handleStatusUpdate,
  });

  useEffect(() => {
    if (!open || startedAt == null) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 1000);
    return () => window.clearInterval(id);
  }, [open, startedAt]);

  useEffect(() => {
    if (!open || startedAt == null) return;

    const runAutoCancel = () => {
      if (exitingRef.current) return;
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
  }, [open, startedAt, tradeId, finishAndReturnToTable]);

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
      ? `${WAIT_MESSAGE} ${AUTO_CANCEL_TIMER_NOTE} (${formatCountdownSeconds(secondsLeft)})`
      : WAIT_MESSAGE);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pending-acceptance-title"
    >
      <div className="relative w-full max-w-md rounded-2xl border border-gray-200 bg-white p-5 shadow-xl dark:border-[#35353E] dark:bg-[var(--card-color)]">
        <button
          type="button"
          aria-label="Close"
          className="absolute top-3 right-3 p-1.5 rounded-full text-gray-500 hover:bg-gray-100 dark:text-[#788099] dark:hover:bg-[#35353E] transition"
          onClick={() => finishAndReturnToTable(true)}
        >
          <span className="text-xl leading-none">&times;</span>
        </button>
        <div className="flex items-center gap-3 mb-4 pr-8">
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

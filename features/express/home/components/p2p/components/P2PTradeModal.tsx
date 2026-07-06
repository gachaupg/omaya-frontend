"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import TradePreview from "@/features/p2p/components/ui/market/sections/tradePreview";
import { PendingAcceptanceWaitModal } from "@/features/p2p/components/ui/market/sections/PendingAcceptanceWaitModal";
import type { MarketRow } from "@/features/p2p/components/ui/market/types";
import type { HomeP2PMode } from "../types";
import type { PendingAcceptanceSession } from "@/features/p2p/utils/pendingAcceptanceSession";
import { navigateToMatchedTradeFromSession } from "@/features/p2p/utils/pendingAcceptanceSession";

type P2PTradeModalProps = {
  open: boolean;
  marketRow: MarketRow | null;
  mode: HomeP2PMode;
  onClose: () => void;
};

export function P2PTradeModal({
  open,
  marketRow,
  mode,
  onClose,
}: P2PTradeModalProps) {
  const modalScrollRef = useRef<HTMLDivElement | null>(null);
  const [pendingAcceptance, setPendingAcceptance] =
    useState<PendingAcceptanceSession | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setPendingAcceptance(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !pendingAcceptance) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose, pendingAcceptance]);

  const navigateToMatchedTrade = useCallback(
    (session: PendingAcceptanceSession, tradeId: string) => {
      setPendingAcceptance(null);
      onClose();
      navigateToMatchedTradeFromSession(session, tradeId);
    },
    [onClose]
  );

  if (!mounted || !open || !marketRow) return null;

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
        onClick={() => {
          if (pendingAcceptance) return;
          onClose();
        }}
      >
        <div
          ref={modalScrollRef}
          className="w-full max-w-5xl max-h-[min(100vh,100dvh)] overflow-y-auto overscroll-contain"
          onClick={(event) => event.stopPropagation()}
        >
          <TradePreview
            advertiserData={marketRow}
            onClose={onClose}
            tradeType={mode}
            paymentDetails={marketRow.payment_details}
            scrollContainerRef={modalScrollRef}
            onPendingAcceptanceStart={(session) => {
              onClose();
              setPendingAcceptance(session);
            }}
          />
        </div>
      </div>

      {pendingAcceptance ? (
        <PendingAcceptanceWaitModal
          open
          tradeId={pendingAcceptance.tradeId}
          advertiserOrderId={pendingAcceptance.advertiserOrderId}
          advertiserName={pendingAcceptance.advertiserName}
          advertiserPhoto={pendingAcceptance.advertiserPhoto}
          advertiserInitials={pendingAcceptance.advertiserInitials}
          isOnline={pendingAcceptance.isOnline}
          onNavigateToMatched={(tradeId) =>
            navigateToMatchedTrade(pendingAcceptance, tradeId)
          }
          onClose={() => setPendingAcceptance(null)}
        />
      ) : null}
    </>,
    document.body
  );
}

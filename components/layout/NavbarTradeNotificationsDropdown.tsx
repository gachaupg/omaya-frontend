"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { Bell, X } from "lucide-react";
import { AppDispatch, RootState } from "@/store/rootReducer";
import {
  selectPendingMatchedTradeNotificationCount,
  selectPendingMatchedTradeNotifications,
} from "@/features/p2p/selectors";
import { useMatchedTradesWebSocket } from "@/features/p2p/hooks/useMatchedTradesWebSocket";
import { useTradeNotificationSound } from "@/features/notifications/hooks/useTradeNotificationSound";
import { MatchedTradeNotificationCard } from "@/features/p2p/components/MatchedTradeNotificationCard";
import { openMatchedTradeNotification } from "@/features/p2p/utils/matchedTradeNotificationActions";
import { PendingAcceptanceWaitModal } from "@/features/p2p/components/ui/market/sections/PendingAcceptanceWaitModal";
import {
  navigateToMatchedTradeFromSession,
  type PendingAcceptanceSession,
} from "@/features/p2p/utils/pendingAcceptanceSession";
import {
  isNotificationSoundMuted,
  NOTIFICATION_PREFERENCES_CHANGED_EVENT,
  toggleNotificationSoundMuted,
} from "@/lib/notifications/notificationPreferences";

const DROPDOWN_PREVIEW_LIMIT = 8;
const MOBILE_MAX_WIDTH = 767;

function useIsMobileViewport() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(`(max-width: ${MOBILE_MAX_WIDTH}px)`);
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return isMobile;
}

export default function NavbarTradeNotificationsDropdown() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const isMobile = useIsMobileViewport();
  const [open, setOpen] = useState(false);
  const [muted, setMuted] = useState(false);
  const [isGrowing, setIsGrowing] = useState(false);
  const [respondingTradeId, setRespondingTradeId] = useState<string | null>(null);
  const [pendingAcceptance, setPendingAcceptance] =
    useState<PendingAcceptanceSession | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(0);
  const hasInitializedCountRef = useRef(false);
  const [growAnimationKey, setGrowAnimationKey] = useState(0);

  const { isAuthenticated, user } = useSelector(
    (state: RootState) => state.auth
  );
  const { activePage } = useSelector((state: RootState) => state.matchedTrades);
  const pendingNotifications = useSelector(
    selectPendingMatchedTradeNotifications
  );
  const pendingCount = useSelector(selectPendingMatchedTradeNotificationCount);

  const { isConnected: wsConnected } = useMatchedTradesWebSocket({
    enabled: isAuthenticated,
  });
  useTradeNotificationSound(isAuthenticated);

  const previewNotifications = useMemo(
    () => pendingNotifications.slice(0, DROPDOWN_PREVIEW_LIMIT),
    [pendingNotifications]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    setMuted(isNotificationSoundMuted());

    const onPreferencesChanged = () => {
      setMuted(isNotificationSoundMuted());
    };
    window.addEventListener(
      NOTIFICATION_PREFERENCES_CHANGED_EVENT,
      onPreferencesChanged
    );
    return () =>
      window.removeEventListener(
        NOTIFICATION_PREFERENCES_CHANGED_EVENT,
        onPreferencesChanged
      );
  }, []);

  useEffect(() => {
    if (!hasInitializedCountRef.current) {
      prevCountRef.current = pendingCount;
      hasInitializedCountRef.current = true;
      return;
    }

    if (pendingCount > prevCountRef.current) {
      setGrowAnimationKey((key) => key + 1);
      setIsGrowing(true);
      const growTimer = window.setTimeout(() => setIsGrowing(false), 900);
      prevCountRef.current = pendingCount;
      return () => window.clearTimeout(growTimer);
    }

    prevCountRef.current = pendingCount;
  }, [pendingCount]);

  useEffect(() => {
    if (!open || isMobile) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        containerRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, isMobile]);

  useEffect(() => {
    if (!open || !isMobile) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open, isMobile]);

  const toggleMuted = useCallback(() => {
    setMuted(toggleNotificationSoundMuted());
  }, []);

  const navigateToMatchedTrade = useCallback(
    (session: PendingAcceptanceSession, tradeId: string) => {
      setPendingAcceptance(null);
      navigateToMatchedTradeFromSession(session, tradeId);
    },
    []
  );

  const handleViewTrade = useCallback(
    async (trade: Record<string, unknown>) => {
      await openMatchedTradeNotification({
        trade,
        userEmail: user?.email,
        dispatch,
        router,
        activePage,
        onRespondingChange: setRespondingTradeId,
        onBeforeNavigate: () => setOpen(false),
        onPendingAcceptance: (session) => {
          setOpen(false);
          setPendingAcceptance(session);
        },
      });
    },
    [activePage, dispatch, router, user?.email]
  );

  const renderPanelBody = (showMobileClose: boolean) => (
    <>
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-100 dark:border-[#35353E] shrink-0">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          Notifications
          {pendingCount > 0 ? (
            <span className="ml-2 text-xs font-medium text-[#1D8751]">
              ({pendingCount})
            </span>
          ) : null}
        </h3>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={toggleMuted}
            className="text-xs font-medium text-gray-500 dark:text-[#8C8CA1] hover:text-[#1D8751] transition-colors whitespace-nowrap"
          >
            {muted ? "Unmute" : "Mute"}
          </button>
          {showMobileClose ? (
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 dark:text-[#8C8CA1] dark:hover:bg-[#35353E]"
              aria-label="Close notifications"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {previewNotifications.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <p className="text-sm text-gray-500 dark:text-[#8C8CA1]">
              No pending trade notifications
            </p>
          </div>
        ) : (
          previewNotifications.map((trade) => (
            <MatchedTradeNotificationCard
              key={String(trade.id)}
              trade={trade as unknown as Record<string, unknown>}
              userEmail={user?.email}
              variant="dropdown"
              isOpening={respondingTradeId === String(trade.id)}
              onView={() =>
                void handleViewTrade(
                  trade as unknown as Record<string, unknown>
                )
              }
            />
          ))
        )}
      </div>

      {pendingCount > 0 && (
        <div className="border-t border-gray-100 dark:border-[#35353E] px-4 py-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              router.push("/dashboard/notifications");
            }}
            className="w-full rounded-xl bg-[#1D8751]/10 py-2.5 text-center text-sm font-semibold text-[#1D8751] hover:bg-[#1D8751]/15 transition-colors"
          >
            {pendingCount > DROPDOWN_PREVIEW_LIMIT
              ? `View all (${pendingCount})`
              : "View all notifications"}
          </button>
        </div>
      )}
    </>
  );

  if (!isAuthenticated) return null;

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center justify-center p-0 min-w-9 min-h-9 w-9 h-9 sm:min-w-10 sm:min-h-10 sm:w-10 sm:h-10 rounded-full shrink-0"
        aria-label="Trade notifications"
        aria-expanded={open}
      >
        <div
          key={growAnimationKey}
          className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-[#1D8751] flex items-center justify-center p-1 relative shrink-0 bg-white/80 dark:bg-[var(--card-color)] ${
            isGrowing
              ? "animate-notification-bell-grow"
              : pendingCount > 0
                ? "animate-notification-bell-pulse"
                : ""
          }`}
        >
          <Bell className="w-4 h-4 text-[#1D8751]" strokeWidth={2} />
          {pendingCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-[#E23D3A] text-white text-[10px] font-semibold rounded-full min-w-5 h-5 px-1 flex items-center justify-center animate-notification-badge-pop">
              {pendingCount > 99 ? "99+" : pendingCount}
            </span>
          )}
        </div>
      </button>

      {open && !isMobile && (
        <>
          <div
            className="fixed inset-0 z-[100] bg-black/10"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div
            ref={panelRef}
            className="absolute right-0 top-full mt-2 z-[101] w-[min(calc(100vw-1.5rem),400px)] rounded-2xl border border-gray-200 dark:border-[#35353E] bg-white dark:bg-[var(--card-color)] shadow-xl overflow-hidden flex flex-col max-h-[min(70vh,480px)]"
          >
            {renderPanelBody(false)}
          </div>
        </>
      )}

      {open &&
        isMobile &&
        typeof document !== "undefined" &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-[200] bg-black/45"
              onClick={() => setOpen(false)}
              aria-hidden
            />
            <div
              ref={panelRef}
              className="fixed inset-x-3 bottom-3 z-[201] flex max-h-[min(85vh,640px)] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-[#35353E] dark:bg-[var(--card-color)]"
              role="dialog"
              aria-modal="true"
              aria-label="Trade notifications"
            >
              {renderPanelBody(true)}
            </div>
          </>,
          document.body
        )}

      {typeof document !== "undefined" &&
        pendingAcceptance &&
        createPortal(
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
          />,
          document.body
        )}
    </div>
  );
}

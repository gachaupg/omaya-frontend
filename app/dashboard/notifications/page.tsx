"use client";
import React, { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/store/rootReducer";
import { useRouter, useSearchParams } from "next/navigation";
import {
  fetchMatchedTrades,
  fetchLatestMatchedTradesPage,
  reconcileCanceledMatchedNotifications,
} from "@/features/p2p/slices/matchedTradesSlice";
import {
  selectPendingMatchedTradeNotifications,
} from "@/features/p2p/selectors";
import { useMatchedTradesWsConnected } from "@/features/p2p/components/MatchedTradesWebSocketProvider";
import {
  filterPendingMatchedTradeNotificationsByCategory,
  type MatchedTradeNotificationCategory,
} from "@/features/p2p/utils/matchedTradeNotifications";
import { PendingAcceptanceWaitModal } from "@/features/p2p/components/ui/market/sections/PendingAcceptanceWaitModal";
import {
  navigateToMatchedTradeFromSession,
  type PendingAcceptanceSession,
} from "@/features/p2p/utils/pendingAcceptanceSession";
import { MatchedTradeNotificationCard } from "@/features/p2p/components/MatchedTradeNotificationCard";
import { openMatchedTradeNotification } from "@/features/p2p/utils/matchedTradeNotificationActions";

const CATEGORY_LABELS: Record<MatchedTradeNotificationCategory, string> = {
  incoming: "Incoming trades",
  buy: "Buy trades",
  sell: "Sell trades",
};

const Notifications = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryParam = searchParams?.get("category") ?? null;
  const activeCategory: MatchedTradeNotificationCategory | null =
    categoryParam === "incoming" ||
    categoryParam === "buy" ||
    categoryParam === "sell"
      ? categoryParam
      : null;
  const dispatch = useDispatch<AppDispatch>();
  const { loading, refreshing, hasLoaded, activePage, totalPages } = useSelector(
    (state: RootState) => state.matchedTrades
  );
  const allNotifications = useSelector(selectPendingMatchedTradeNotifications);
  const wsConnected = useMatchedTradesWsConnected();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const filteredNotifications = React.useMemo(
    () =>
      filterPendingMatchedTradeNotificationsByCategory(
        allNotifications,
        user?.email,
        activeCategory
      ),
    [allNotifications, user?.email, activeCategory]
  );

  const [respondingTradeId, setRespondingTradeId] = useState<string | null>(null);
  const [pendingAcceptance, setPendingAcceptance] =
    useState<PendingAcceptanceSession | null>(null);

  const navigateToMatchedTrade = useCallback(
    (session: PendingAcceptanceSession, tradeId: string) => {
      setPendingAcceptance(null);
      navigateToMatchedTradeFromSession(session, tradeId);
    },
    []
  );

  // Matched-trades WebSocket + polling live in dashboard layout (MatchedTradesWebSocketProvider).
  useEffect(() => {
    if (!isAuthenticated) return;
    void dispatch(reconcileCanceledMatchedNotifications());
    void dispatch(fetchLatestMatchedTradesPage());
  }, [dispatch, isAuthenticated]);

  const handlePageChange = (page: number) => {
    dispatch(fetchMatchedTrades(page));
  };

  // Reverse pagination: Next = go to previous page, Previous = go to next page
  const handleNextPage = () => {
    if (activePage > 1) {
      handlePageChange(activePage - 1);
    }
  };

  const handlePreviousPage = () => {
    if (activePage < totalPages) {
      handlePageChange(activePage + 1);
    }
  };
  // console.log(user?.email);
  // console.log(matchedTrades?.results);
  const handleViewOrder = async (trade: Record<string, unknown>) => {
    await openMatchedTradeNotification({
      trade,
      userEmail: user?.email,
      dispatch,
      router,
      activePage,
      onRespondingChange: setRespondingTradeId,
      onPendingAcceptance: setPendingAcceptance,
    });
  };

  const showInitialLoader =
    loading && !hasLoaded && allNotifications.length === 0;

  if (showInitialLoader) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1D8751]"></div>
      </div>
    );
  }

  const hasNotifications = filteredNotifications.length > 0;
  const showEmptyState = hasLoaded && !hasNotifications && !refreshing;

  if (showEmptyState)
    return (
      <div className="w-full px-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-4 sm:mb-6">
          {/* Breadcrumb */}
          <Breadcrumb
            items={[
              { label: "Dashboard", href: "/dashboard" },
              { label: "Notification center", href: "/dashboard/notifications" },
            ]}
          />
          <span className="text-xs sm:text-sm dark:text-[#A3A3C2] text-gray-600 whitespace-nowrap">0 notifications</span>
        </div>

        <div className="dark:bg-[#23232B] bg-white rounded-xl p-8 text-center shadow-lg border dark:border-[#35353E] border-gray-200">
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            {/* Beautiful notification bell icon with gradient */}
            <div className="relative mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-[#1D8751] to-[#17693F] rounded-full flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  className="w-12 h-12 text-white"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>

              </div>
              {/* Subtle pulse animation */}
              <div className="absolute inset-0 w-24 h-24 bg-gradient-to-br from-[#1D8751] to-[#17693F] rounded-full opacity-20 animate-pulse"></div>
            </div>

            <h3 className="text-2xl font-bold dark:text-white text-gray-800 mb-3">
              You have no notifications
            </h3>

            <p className="dark:text-[#A3A3C2] text-gray-600 max-w-md mb-6 leading-relaxed">
              When you receive notifications about your trades, orders, or
              account updates, they will appear here. Stay tuned for important
              updates!
            </p>
          </div>
        </div>
      </div>
    );

  return (
    <div className="w-full px-2">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-4 sm:mb-6">
        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Notification center", href: "/dashboard/notifications" },
          ]}
        />


        <span className="text-xs sm:text-sm text-gray-500 dark:text-[#A3A3C2] whitespace-nowrap flex items-center gap-2">
          {refreshing && (
            <span
              className="inline-block w-3 h-3 border-2 border-[#1D8751] border-t-transparent rounded-full animate-spin"
              aria-hidden
            />
          )}
          {!refreshing && (
            <span
              className={`inline-block w-2 h-2 rounded-full ${
                wsConnected ? "bg-[#1D8751]" : "bg-amber-500"
              }`}
              title={wsConnected ? "Live via WebSocket" : "Polling for updates"}
              aria-hidden
            />
          )}
          {filteredNotifications.length}{" "}
          {filteredNotifications.length === 1
            ? "notification"
            : "notifications"}
          {activeCategory ? ` · ${CATEGORY_LABELS[activeCategory]}` : ""}
        </span>
      </div>

      {activeCategory && (
        <div className="mb-4">
          <button
            type="button"
            onClick={() => router.push("/dashboard/notifications")}
            className="text-sm font-medium text-[#1D8751] hover:underline"
          >
            Show all notifications
          </button>
        </div>
      )}

      {filteredNotifications.map((trade) => (
        <MatchedTradeNotificationCard
          key={String(trade.id)}
          trade={trade as unknown as Record<string, unknown>}
          userEmail={user?.email}
          variant="page"
          isOpening={respondingTradeId === String(trade.id)}
          onView={() =>
            void handleViewOrder(trade as unknown as Record<string, unknown>)
          }
        />
      ))}


      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center mt-6 space-x-2">
          <button
            onClick={handlePreviousPage}
            disabled={activePage === totalPages}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${activePage === totalPages
              ? "bg-gray-200 dark:bg-[#31313C] text-gray-400 dark:text-[#A3A3C2] cursor-not-allowed"
              : "bg-[#1D8751] text-white hover:bg-[#17693F]"
              }`}
          >
            Previous
          </button>

          <div className="flex space-x-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (activePage <= 3) {
                pageNum = i + 1;
              } else if (activePage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = activePage - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${activePage === pageNum
                    ? "bg-[#1D8751] text-white"
                    : "bg-gray-100 dark:bg-[#31313C] text-gray-600 dark:text-[#A3A3C2] hover:bg-gray-200 dark:hover:bg-[#2A2A33]"
                    }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={handleNextPage}
            disabled={activePage === 1}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${activePage === 1
              ? "bg-gray-200 dark:bg-[#31313C] text-gray-400 dark:text-[#A3A3C2] cursor-not-allowed"
              : "bg-[#1D8751] text-white hover:bg-[#17693F]"
              }`}
          >
            Next
          </button>
        </div>
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
};

export default Notifications;

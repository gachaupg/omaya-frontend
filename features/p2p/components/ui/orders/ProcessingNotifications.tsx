"use client";

import React, { useCallback, useState } from "react";
import { createPortal } from "react-dom";
import { FaUserCircle } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/store/rootReducer";
import {
  getMatchedTradeNotificationDisplayName,
  getMatchedTradeNotificationProfileImage,
  getMatchedTradeNotificationStatus,
} from "@/features/p2p/utils/matchedTradeNotifications";
import { selectPendingMatchedTradeNotifications } from "@/features/p2p/selectors";
import {
  isPendingAcceptanceStatus,
  parseTradeTimestampMs,
  recordPendingAcceptanceStartedAt,
} from "@/features/p2p/utils/tradeWsAcceptanceGate";
import { PendingAcceptanceWaitModal } from "@/features/p2p/components/ui/market/sections/PendingAcceptanceWaitModal";
import {
  buildPendingAcceptanceSessionFromNotificationTrade,
  navigateToMatchedTradeFromSession,
  type PendingAcceptanceSession,
} from "@/features/p2p/utils/pendingAcceptanceSession";

const getOrderType = (order_type: string) => {
  if (order_type === "buy") {
    return { label: "Sell", color: "text-red-400" };
  } else {
    return { label: "Buy", color: "text-[#1D8751]" };
  }
};

const truncate = (str: string, n: number) =>
  str.length > n ? str.slice(0, n - 3) + "..." : str;

const ProcessingNotifications: React.FC = () => {
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);
  const { refreshing, hasLoaded } = useSelector(
    (state: RootState) => state.matchedTrades
  );
  const pendingResults = useSelector(selectPendingMatchedTradeNotifications);
  const [pendingAcceptance, setPendingAcceptance] =
    useState<PendingAcceptanceSession | null>(null);

  const navigateToMatchedTrade = useCallback(
    (session: PendingAcceptanceSession, tradeId: string) => {
      setPendingAcceptance(null);
      navigateToMatchedTradeFromSession(session, tradeId);
    },
    []
  );

  const handleViewOrder = (trade: any) => {
    const tradeId = String(trade?.id ?? "");
    if (isPendingAcceptanceStatus(String(trade?.status ?? "")) && tradeId) {
      recordPendingAcceptanceStartedAt(
        tradeId,
        parseTradeTimestampMs(trade?.timestamp) ?? Date.now()
      );
    }

    // Store the full order in local storage
    try {
      const fullOrderData = {
        ...trade,
        storedAt: new Date().toISOString(),
        viewedFrom: "processing",
      };

      localStorage.setItem("new_order", JSON.stringify(fullOrderData));

      const existingOrders = JSON.parse(
        localStorage.getItem("p2p_orders") || "[]"
      );
      const orderExists = existingOrders.find(
        (order: any) => order.id === trade.id
      );

      if (!orderExists) {
        existingOrders.push(fullOrderData);
        localStorage.setItem("p2p_orders", JSON.stringify(existingOrders));
      } else {
        const orderIndex = existingOrders.findIndex(
          (order: any) => order.id === trade.id
        );
        existingOrders[orderIndex] = fullOrderData;
        localStorage.setItem("p2p_orders", JSON.stringify(existingOrders));
      }
    } catch (error) {
          }

    const isOwner = trade.owner === user?.email;

    if (
      !isOwner &&
      isPendingAcceptanceStatus(String(trade?.status ?? ""))
    ) {
      const session = buildPendingAcceptanceSessionFromNotificationTrade(
        trade,
        user?.email
      );
      if (session) {
        try {
          localStorage.setItem("p2p_trade_id", tradeId);
        } catch {
          /* no-op */
        }
        setPendingAcceptance(session);
        return;
      }
    }

    const status = getMatchedTradeNotificationStatus(trade, user?.email || "");
    if (status.text === `Pending ${trade.order_type === "sell" ? "Buy" : "Sell"} Trade`) {
      if (isOwner) {
        router.push(
          `/p2p/${trade.id}/matched?order_type=${
            trade.order_type === "sell" ? "sell" : "buy"
          }&trade=buyer`
        );
      } else {
        const searchParams = new URLSearchParams();
        searchParams.set(
          "orderData",
          JSON.stringify({
            order_type: trade.order_type === "sell" ? "sell" : "buy",
          })
        );

        router.push(`/p2p/${trade.id}/matched?${searchParams.toString()}`);
      }
    } else {
      {
        trade.owner === user?.email
          ? router.push(
              `/p2p/${trade.id}/matched?order_type=${
                trade.order_type === "sell" ? "sell" : "buy"
              }&trade=seller`
            )
          : router.push(
              `/p2p/${trade.id}/matched?order_type=${
                trade.order_type === "buy" ? "sell" : "buy"
              }&trade=buyer`
            );
      }
    }
  };

  const hasNotifications = pendingResults.length > 0;
  const showEmptyState = hasLoaded && !hasNotifications && !refreshing;

  if (!showEmptyState && !hasNotifications) {
    return null;
  }

  if (showEmptyState) {
    return (
      <div className="dark:bg-[#23232B] bg-white rounded-xl p-0 text-center shadow-lg border dark:border-[#35353E] border-gray-200">
        <div className="flex flex-col items-center justify-center min-h-[400px]">
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
            <div className="absolute inset-0 w-24 h-24 bg-gradient-to-br from-[#1D8751] to-[#17693F] rounded-full opacity-20 animate-pulse"></div>
          </div>

          <h3 className="text-2xl font-bold dark:text-white text-gray-800 mb-3">
            No pending orders
          </h3>

          <p className="dark:text-[#A3A3C2] text-gray-600 max-w-md mb-6 leading-relaxed">
            When you have pending matched trades, they will appear here.
          </p>

          <div className="flex items-center space-x-2 dark:text-[#A3A3C2] text-gray-600 text-sm">
            <div className="w-2 h-2 bg-[#1D8751] rounded-full"></div>
            <span>All caught up</span>
            <div className="w-2 h-2 bg-[#1D8751] rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {pendingResults.map((trade: any) => {
          const orderType = getOrderType(trade.order_type);
          const status = getMatchedTradeNotificationStatus(
            trade,
            user?.email || ""
          );
          const name = getMatchedTradeNotificationDisplayName(trade, user?.email);
          const profileImage = getMatchedTradeNotificationProfileImage(
            trade,
            user?.email
          );

          return (
            <div
              key={trade.id}
              className="group flex flex-col sm:flex-row sm:items-center justify-between bg-white dark:bg-[#1f1f27] border border-gray-100 dark:border-[#35353E] rounded-xl p-0 mb-3 shadow-sm hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="relative shrink-0">
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt=""
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover ring-2 ring-gray-100 dark:ring-[#35353E]"
                    />
                  ) : (
                    <FaUserCircle
                      size={40}
                      className="sm:w-12 sm:h-12 text-gray-300 dark:text-[#555566]"
                    />
                  )}
                  <span
                    className={`absolute bottom-0.5 right-0.5 w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full border-2 sm:border-[2.5px] border-white dark:border-[#1f1f27] ${
                      orderType.color === "text-[#1D8751]"
                        ? "bg-[#1D8751]"
                        : "bg-red-500"
                    }`}
                  ></span>
                </div>

                <div className="flex flex-col grow min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="font-bold text-sm sm:text-base text-gray-900 dark:text-gray-100 break-words">
                      {name}
                    </span>
                    <span
                      className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border whitespace-nowrap ${
                        orderType.color === "text-[#1D8751]"
                          ? "border-[#1D8751]/20 text-[#1D8751] bg-[#1D8751]/5"
                          : "border-red-400/20 text-red-400 bg-red-400/5"
                      }`}
                    >
                      {orderType.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs sm:text-sm flex-wrap">
                    <span className="font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                      {trade.amount}{" "}
                      <span className="text-xs text-gray-500 font-normal">
                        USDT
                      </span>
                    </span>
                    <span className="hidden sm:inline text-gray-300 dark:text-gray-600">
                      |
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(trade.timestamp).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto mt-3 sm:mt-0 gap-3 shrink-0">
                <span className="inline-flex items-center px-2 sm:px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-semibold bg-opacity-10 whitespace-nowrap bg-green-100 text-[#1D8751] dark:bg-green-900/30 dark:text-[#1D8751]">
                  <span className="hidden sm:inline">{status.text}</span>
                  <span className="sm:hidden">Pending</span>
                </span>

                <button
                  onClick={() => handleViewOrder(trade)}
                  className="bg-[#1D8751] hover:bg-[#16663d] text-white py-1.5 px-4 sm:py-2 sm:px-5 rounded-lg font-medium text-xs sm:text-sm transition-colors shadow-sm whitespace-nowrap active:scale-95"
                >
                  View
                </button>
              </div>
            </div>
          );
      })}

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
            onNavigateToMatched={(id) =>
              navigateToMatchedTrade(pendingAcceptance, id)
            }
            onClose={() => setPendingAcceptance(null)}
          />,
          document.body
        )}
    </div>
  );
};

export default ProcessingNotifications;

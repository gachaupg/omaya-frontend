"use client";

import React from "react";
import { FaUserCircle } from "react-icons/fa";
import {
  getMatchedTradeNotificationDisplayName,
  getMatchedTradeNotificationProfileImage,
  getMatchedTradeNotificationStatus,
} from "@/features/p2p/utils/matchedTradeNotifications";
import { getMatchedTradeNotificationOrderType } from "@/features/p2p/utils/matchedTradeNotificationActions";

type MatchedTradeNotificationCardProps = {
  trade: Record<string, unknown>;
  userEmail?: string | null;
  onView: () => void;
  isOpening?: boolean;
  variant?: "page" | "dropdown";
};

export function MatchedTradeNotificationCard({
  trade,
  userEmail,
  onView,
  isOpening = false,
  variant = "page",
}: MatchedTradeNotificationCardProps) {
  const isOwner = trade.owner === userEmail;
  const orderType = getMatchedTradeNotificationOrderType(
    String(trade.order_type ?? ""),
    Boolean(isOwner)
  );
  const status = getMatchedTradeNotificationStatus(
    trade as { owner?: string; order_type?: string; status?: string | null },
    userEmail || ""
  );
  const name = getMatchedTradeNotificationDisplayName(
    trade as Parameters<typeof getMatchedTradeNotificationDisplayName>[0],
    userEmail
  );
  const profileImage = getMatchedTradeNotificationProfileImage(
    trade as Parameters<typeof getMatchedTradeNotificationProfileImage>[0],
    userEmail
  );

  const isDropdown = variant === "dropdown";
  const timestamp = trade.timestamp
    ? new Date(String(trade.timestamp)).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <div
      className={
        isDropdown
          ? "flex flex-col gap-2.5 p-3 border-b border-gray-100 dark:border-[#35353E] last:border-b-0 bg-white dark:bg-[var(--card-color)]"
          : "group flex flex-col sm:flex-row sm:items-center justify-between bg-white dark:bg-[#1f1f27] border border-gray-100 dark:border-[#35353E] rounded-xl p-3 sm:p-4 mb-3 shadow-sm hover:shadow-md transition-all duration-200"
      }
    >
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div className="relative shrink-0">
          {profileImage ? (
            <img
              src={String(profileImage)}
              alt=""
              className={
                isDropdown
                  ? "w-10 h-10 rounded-full object-cover ring-2 ring-gray-100 dark:ring-[#35353E]"
                  : "w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover ring-2 ring-gray-100 dark:ring-[#35353E]"
              }
            />
          ) : (
            <FaUserCircle
              size={isDropdown ? 40 : 40}
              className={
                isDropdown
                  ? "w-10 h-10 text-gray-300 dark:text-[#555566]"
                  : "sm:w-12 sm:h-12 text-gray-300 dark:text-[#555566]"
              }
            />
          )}
          <span
            className={`absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-[#1f1f27] ${
              orderType.color === "text-[#1D8751]" ? "bg-[#1D8751]" : "bg-red-500"
            }`}
          />
        </div>

        <div className="flex flex-col grow min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span
              className={`font-bold text-gray-900 dark:text-gray-100 break-words ${
                isDropdown ? "text-sm" : "text-sm sm:text-base"
              }`}
            >
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

          <div className="flex items-center gap-2 text-xs flex-wrap">
            <span className="font-semibold text-gray-900 dark:text-white whitespace-nowrap">
              {String(trade.amount ?? "")}{" "}
              <span className="text-xs text-gray-500 font-normal">USDT</span>
            </span>
            {timestamp && (
              <>
                <span className="text-gray-300 dark:text-gray-600">|</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {timestamp}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <div
        className={`flex items-center justify-between gap-2 shrink-0 ${
          isDropdown ? "pl-[52px]" : "w-full sm:w-auto mt-3 sm:mt-0 gap-3"
        }`}
      >
        <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap bg-green-100 text-[#1D8751] dark:bg-green-900/30 dark:text-[#1D8751]">
          {isDropdown ? status.text : (
            <>
              <span className="hidden sm:inline">{status.text}</span>
              <span className="sm:hidden">Pending</span>
            </>
          )}
        </span>

        <button
          type="button"
          onClick={onView}
          disabled={isOpening}
          className={`bg-[#1D8751] hover:bg-[#16663d] disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors shadow-sm whitespace-nowrap active:scale-95 ${
            isDropdown
              ? "py-1.5 px-3 text-xs"
              : "py-1.5 px-4 sm:py-2 sm:px-5 text-xs sm:text-sm"
          }`}
        >
          {isOpening ? "Opening…" : "View"}
        </button>
      </div>
    </div>
  );
}

"use client";

import React from "react";
import { useP2PI18n } from "@/lib/useP2PI18n";

interface UnreadMessagesButtonProps {
  onClick?: () => void;
  totalUnreadCount?: number;
  showUnreadMessages?: boolean;
  loading?: boolean;
  className?: string;
}

/**
 * Reusable Unread Messages Button
 * Extracted from Filters component with exact same styling
 */
export const UnreadMessagesButton: React.FC<UnreadMessagesButtonProps> = ({
  onClick,
  totalUnreadCount = 0,
  showUnreadMessages = false,
  loading = false,
  className = "",
}) => {
  const { t } = useP2PI18n();

  return (
    <button
      className={`w-full sm:w-auto rounded-[28px] cursor-pointer flex items-center justify-center gap-2 border border-[#1D8751] text-[#1D8751] px-5 py-3 font-semibold text-sm hover:bg-[#1D8751]/10 transition-all relative ${
        showUnreadMessages
          ? " text-white border border-[#1D8751]"
          : "bg-white dark:bg-[var(--bg-color)]"
      } ${loading ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
      disabled={loading}
      onClick={onClick}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        <rect
          width="100"
          height="100"
          fill="currentColor"
          className="text-gray-800 dark:text-[#1A1A1D]"
        />
        <path d="M20 10 H80 V70 H35 L25 95 L25 70 H20 Z" fill="#F79330" />
        <rect
          x="35"
          y="25"
          width="40"
          height="10"
          fill="currentColor"
          className="text-gray-800 dark:text-[#1A1A1D]"
        />
        <rect
          x="35"
          y="45"
          width="40"
          height="10"
          fill="currentColor"
          className="text-gray-800 dark:text-[#1A1A1D]"
        />
      </svg>

      <span
        className={`text-sm ${showUnreadMessages ? "text-white" : "text-[#1D8751]"}`}
      >
        {t("Unread Message(s)", "Unread Message(s)")}
      </span>

      {/* Unread count badge */}
      {totalUnreadCount > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center min-w-[20px]">
          {totalUnreadCount > 99 ? "99+" : totalUnreadCount}
        </span>
      )}
    </button>
  );
};
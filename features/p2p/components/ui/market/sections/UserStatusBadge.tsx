"use client";

import React from "react";

interface UserStatusBadgeProps {
  isLive: boolean;
  lastSeenMinutes?: number | null;
  className?: string;
}

/**
 * Displays user online status: "Live" when connected, or "Seen X min ago" when offline.
 */
export const UserStatusBadge: React.FC<UserStatusBadgeProps> = ({
  isLive,
  lastSeenMinutes,
  className = "",
}) => {
  if (isLive) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 text-[9px] sm:text-[10px] text-[#1D8751] font-medium whitespace-nowrap ${className}`}
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1D8751] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#1D8751]"></span>
        </span>
        Live
      </span>
    );
  }

  if (lastSeenMinutes != null && lastSeenMinutes >= 0) {
    const text =
      lastSeenMinutes === 0
        ? "Seen just now"
        : lastSeenMinutes === 1
          ? "Seen 1 min ago"
          : `Seen ${lastSeenMinutes} min ago`;
    return (
      <span
        className={`inline-flex items-center gap-1.5 text-[9px] sm:text-[10px] text-gray-500 dark:text-[#788099] font-medium whitespace-nowrap ${className}`}
      >
        <span className="w-2 h-2 rounded-full bg-gray-400 dark:bg-[#788099]"></span>
        {text}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[9px] sm:text-[10px] text-gray-500 dark:text-[#788099] font-medium whitespace-nowrap ${className}`}
    >
      <span className="w-2 h-2 rounded-full bg-gray-400 dark:bg-[#788099]"></span>
      Offline
    </span>
  );
};

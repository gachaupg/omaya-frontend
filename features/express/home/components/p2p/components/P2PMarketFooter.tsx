"use client";

import React from "react";

type P2PMarketFooterProps = {
  activeTradersLabel: string;
  tradersOnlineText?: string;
  viewAllLabel?: string;
  onViewAll: () => void;
};

export function P2PMarketFooter({
  activeTradersLabel,
  tradersOnlineText = "active traders online",
  viewAllLabel = "View all offers",
  onViewAll,
}: P2PMarketFooterProps) {
  return (
    <div className="flex items-center justify-between gap-3 pt-4">
      <p className="text-xs sm:text-sm font-medium text-[#1D8751]">
        {activeTradersLabel} {tradersOnlineText}
      </p>
      <button
        type="button"
        onClick={onViewAll}
        className="cursor-pointer text-xs sm:text-sm font-semibold text-[#1D8751] hover:text-[#25a366] transition-colors whitespace-nowrap"
      >
        {viewAllLabel} →
      </button>
    </div>
  );
}

"use client";

import React from "react";
import type { HomeP2PMode } from "../types";

type P2PMarketTabsProps = {
  mode: HomeP2PMode;
  onModeChange: (mode: HomeP2PMode) => void;
  buyLabel?: string;
  sellLabel?: string;
};

export function P2PMarketTabs({
  mode,
  onModeChange,
  buyLabel = "Buy Crypto",
  sellLabel = "Sell Crypto",
}: P2PMarketTabsProps) {
  return (
    <div className="flex border-b border-gray-200 dark:border-[#35353E]/80">
      {(
        [
          { id: "buy" as const, label: buyLabel },
          { id: "sell" as const, label: sellLabel },
        ] as const
      ).map((tab) => {
        const isActive = mode === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onModeChange(tab.id)}
            className={`flex-1 pb-3 pt-1 text-sm sm:text-base font-semibold transition-colors relative ${
              isActive
                ? "text-[#1D8751]"
                : "text-gray-500 dark:text-[#788099] hover:text-gray-700 dark:hover:text-[#9CA3AF]"
            }`}
          >
            {tab.label}
            {isActive ? (
              <span
                className="absolute left-0 right-0 bottom-0 h-[2px] bg-[#1D8751] rounded-full"
                aria-hidden
              />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

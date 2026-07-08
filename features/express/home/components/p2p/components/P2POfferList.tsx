"use client";

import React from "react";
import type { HomeP2POffer, HomeP2PMode } from "../types";
import { P2POfferRow } from "./P2POfferRow";

type P2POfferListProps = {
  offers: HomeP2POffer[];
  mode: HomeP2PMode;
  loading?: boolean;
  emptyLabel?: string;
  onOfferAction: (offer: HomeP2POffer) => void;
  fillHeight?: boolean;
};

const HOME_PREVIEW_OFFER_COUNT = 4;

function P2POfferRowSkeleton() {
  return (
    <div
      className="flex animate-pulse flex-col gap-2 border-b border-gray-200 py-3 dark:border-[#35353E]/70 last:border-b-0 last:pb-0 sm:flex-row sm:items-start sm:gap-3"
      aria-hidden
    >
      <div className="flex items-start gap-3">
        <div className="relative h-10 w-10 shrink-0">
          <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-[#35353E]" />
          <div className="absolute -bottom-0.5 -right-0.5 z-10 h-3 w-3 rounded-full border-2 border-white bg-gray-200 dark:border-[#18181D] dark:bg-[#35353E]" />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-4 w-32 rounded bg-gray-200 dark:bg-[#35353E]" />
          <div className="h-3 w-24 rounded bg-gray-200 dark:bg-[#35353E]" />
        </div>
        <div className="h-6 w-16 shrink-0 rounded-md bg-gray-200 dark:bg-[#35353E] sm:hidden" />
      </div>
      <div className="space-y-2 pl-[52px] sm:min-w-0 sm:flex-1 sm:pl-0">
        <div className="h-3 w-40 rounded bg-gray-200 dark:bg-[#35353E]" />
        <div className="h-5 w-24 rounded-full bg-gray-200 dark:bg-[#35353E]" />
      </div>
      <div className="hidden shrink-0 flex-col items-end gap-2 sm:flex sm:min-w-[200px]">
        <div className="h-3 w-28 rounded bg-gray-200 dark:bg-[#35353E]" />
        <div className="h-3 w-24 rounded bg-gray-200 dark:bg-[#35353E]" />
        <div className="h-6 w-16 rounded-md bg-gray-200 dark:bg-[#35353E]" />
      </div>
    </div>
  );
}

export function P2POfferList({
  offers,
  mode,
  loading = false,
  emptyLabel = "No offers available right now.",
  onOfferAction,
  fillHeight = false,
}: P2POfferListProps) {
  const listShellClass = fillHeight ? "overflow-x-hidden" : "";

  const showSkeleton = loading && offers.length === 0;

  if (!loading && offers.length === 0) {
    return (
      <div
        className={`flex min-h-[220px] items-center justify-center px-4 text-center text-sm text-gray-500 dark:text-[#788099] ${listShellClass}`}
      >
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className={`divide-y divide-transparent ${listShellClass}`}>
      {showSkeleton
        ? Array.from({ length: HOME_PREVIEW_OFFER_COUNT }, (_, index) => (
            <P2POfferRowSkeleton key={`p2p-offer-skeleton-${index}`} />
          ))
        : offers.map((offer) => (
            <P2POfferRow
              key={offer.id}
              offer={offer}
              mode={mode}
              onAction={onOfferAction}
            />
          ))}
    </div>
  );
}

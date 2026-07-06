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
};

export function P2POfferList({
  offers,
  mode,
  loading = false,
  emptyLabel = "No offers available right now.",
  onOfferAction,
}: P2POfferListProps) {
  if (loading && offers.length === 0) {
    return (
      <div className="flex min-h-[220px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1D8751] border-t-transparent" />
      </div>
    );
  }

  if (!loading && offers.length === 0) {
    return (
      <div className="flex min-h-[220px] items-center justify-center px-4 text-center text-sm text-gray-500 dark:text-[#788099]">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="divide-y divide-transparent">
      {offers.map((offer) => (
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

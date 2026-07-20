"use client";

import React from "react";
import { PresenceIndicator } from "@/features/p2p/components/ui/market/sections/UserStatusBadge";
import type { HomeP2POffer, HomeP2PMode } from "../types";
import { P2PPaymentMethods } from "./P2PPaymentMethods";

type P2POfferRowProps = {
  offer: HomeP2POffer;
  mode: HomeP2PMode;
  onAction: (offer: HomeP2POffer) => void;
  actionLabel?: string;
};

const CRYPTO_CURRENCIES = new Set([
  "USDT",
  "BTC",
  "ETH",
  "USDC",
  "BNB",
  "SOL",
  "TRX",
  "LTC",
]);

function isCryptoCurrency(ticker: string): boolean {
  return CRYPTO_CURRENCIES.has(ticker.trim().toUpperCase());
}

function TraderBadge({ badge }: { badge: NonNullable<HomeP2POffer["badge"]> }) {
  if (badge === "elite") {
    return (
      <span className="inline-flex items-center rounded-md bg-[#2563EB]/15 px-1.5 py-0.5 text-[9px] font-semibold text-[#60A5FA]">
        Elite
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-md bg-[#1D8751]/15 px-1.5 py-0.5 text-[9px] font-semibold text-[#1D8751]">
      Top Trader
    </span>
  );
}

function TraderAvatar({
  offer,
}: {
  offer: HomeP2POffer;
}) {
  return (
    <div className="relative h-10 w-10 shrink-0">
      {offer.advertiserPhoto ? (
        <img
          src={offer.advertiserPhoto}
          alt={offer.displayName}
          className="h-10 w-10 rounded-full object-cover bg-[#1D8751]"
          onError={(event) => {
            event.currentTarget.style.display = "none";
            event.currentTarget.nextElementSibling?.classList.remove("hidden");
          }}
        />
      ) : null}
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold text-white ${
          offer.advertiserPhoto ? "hidden" : ""
        }`}
        style={{ backgroundColor: offer.avatarColor }}
      >
        {offer.advertiserInitials}
      </span>
      <PresenceIndicator
        isOnline={offer.online}
        className="dark:border-[#18181D]"
      />
    </div>
  );
}

function OfferActionButton({
  label,
  badgeClass,
  onClick,
}: {
  label: string;
  badgeClass: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`cursor-pointer inline-flex min-w-[72px] items-center justify-center rounded-md px-5 py-1 text-[10px] font-semibold transition-colors ${badgeClass}`}
    >
      {label}
    </button>
  );
}

function OfferStats({
  offer,
  showCryptoIcon,
  align = "end",
}: {
  offer: HomeP2POffer;
  showCryptoIcon: boolean;
  align?: "start" | "end";
}) {
  const alignClass = align === "start" ? "items-start text-left" : "items-end text-right";

  return (
    <>
      <div
        className={`flex flex-wrap gap-x-3 gap-y-1 sm:gap-x-4 ${align === "start" ? "justify-start" : "justify-end"}`}
      >
        <div className={`flex items-center gap-1 whitespace-nowrap ${alignClass}`}>
          <span className="text-[11px] sm:text-xs font-medium text-gray-500 dark:text-[#788099]">
            Rate:
          </span>
          <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
            {offer.marketRow.commission}
          </span>
        </div>

        <div className={`flex items-center gap-1 whitespace-nowrap ${alignClass}`}>
          <span className="text-[11px] sm:text-xs font-medium text-gray-500 dark:text-[#788099]">
            Available:
          </span>
          {showCryptoIcon ? (
            <img
              src={offer.assetIcon}
              alt=""
              className="h-4 w-4 shrink-0 rounded-full object-cover"
            />
          ) : null}
          <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
            {offer.marketRow.available}
          </span>
        </div>
      </div>

      <div className={`flex items-center gap-1 whitespace-nowrap ${alignClass}`}>
        <span className="text-[11px] sm:text-xs font-medium text-gray-500 dark:text-[#788099]">
          Limit:
        </span>
        <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
          {offer.marketRow.limit}
        </span>
      </div>
    </>
  );
}

export function P2POfferRow({
  offer,
  mode,
  onAction,
  actionLabel,
}: P2POfferRowProps) {
  const buttonLabel = actionLabel || (mode === "buy" ? "Buy" : "Sell");
  const badgeClass =
    mode === "buy"
      ? "bg-[#1D8751]/15 text-[#1D8751] border border-[#1D8751]/40 hover:bg-[#1D8751]/25"
      : "bg-[#E23D3A]/15 text-[#E23D3A] border border-[#E23D3A]/40 hover:bg-[#E23D3A]/25";
  const showCryptoIcon = isCryptoCurrency(offer.assetTicker);

  return (
    <div className="border-b border-gray-200 py-3 dark:border-[#35353E]/70 last:border-b-0 last:pb-0">
      {/* Mobile layout */}
      <div className="flex flex-col gap-2 sm:hidden">
        <div className="flex items-start gap-3">
          <TraderAvatar offer={offer} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="truncate text-xs font-semibold text-gray-900 dark:text-white">
                {offer.displayName}
              </span>
              {offer.badge ? <TraderBadge badge={offer.badge} /> : null}
            </div>
            <div className="mt-0.5 flex items-center gap-1 text-[11px] text-gray-500 dark:text-[#788099]">
              <span className="text-[#FBBF24]">★</span>
              <span>{offer.rating}</span>
              <span aria-hidden>•</span>
              <span>{offer.tradesCount.toLocaleString()} trades</span>
            </div>
          </div>
          <OfferActionButton
            label={buttonLabel}
            badgeClass={badgeClass}
            onClick={() => onAction(offer)}
          />
        </div>

        <div className="flex flex-col gap-1.5 pl-[52px]">
          <OfferStats offer={offer} showCryptoIcon={showCryptoIcon} align="start" />
          <P2PPaymentMethods paymentDetails={offer.marketRow.payment_details} />
        </div>
      </div>

      {/* Desktop layout */}
      <div className="hidden items-start gap-3 sm:flex">
        <div className="flex min-w-0 flex-1 gap-3">
          <TraderAvatar offer={offer} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                {offer.displayName}
              </span>
              {offer.badge ? <TraderBadge badge={offer.badge} /> : null}
            </div>

            <div className="mt-0.5 flex items-center gap-1 text-[11px] text-gray-500 dark:text-[#788099]">
              <span className="text-[#FBBF24]">★</span>
              <span>{offer.rating}</span>
              <span aria-hidden>•</span>
              <span>{offer.tradesCount.toLocaleString()} trades</span>
            </div>

            <P2PPaymentMethods paymentDetails={offer.marketRow.payment_details} />
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1.5 text-right min-w-[200px]">
          <OfferStats offer={offer} showCryptoIcon={showCryptoIcon} align="end" />
          <OfferActionButton
            label={buttonLabel}
            badgeClass={badgeClass}
            onClick={() => onAction(offer)}
          />
        </div>
      </div>
    </div>
  );
}

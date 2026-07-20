"use client";

import React from "react";
import { Clock } from "lucide-react";
import { useP2PI18n } from "@/lib/useP2PI18n";

interface P2PTradeExpiredCardProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Shown when landing on /dashboard/p2p/?trade_link=expired — greenish notice on P2P Market.
 */
export default function P2PTradeExpiredCard({
  isOpen,
  onClose,
}: P2PTradeExpiredCardProps) {
  const { t } = useP2PI18n();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative mx-4 w-full max-w-md">
        <div className="rounded-2xl border border-[#1D8751]/40 bg-[#E8F5EE] p-6 shadow-2xl dark:border-[#1D8751]/50 dark:bg-[#1D8751]/15">
          <div className="mb-4 flex flex-col items-center text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#1D8751]/20">
              <Clock className="h-8 w-8 text-[#1D8751]" aria-hidden />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {t("tradeLink.expiredTitle", "Your trade has expired")}
            </h2>
          </div>
          <p className="mb-6 text-center text-sm leading-relaxed text-gray-700 dark:text-[#C8E6D4]">
            {t("tradeLink.expiredMessage", "Explore P2P market.")}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-[#1D8751] py-3 font-medium text-white transition-colors hover:bg-[#166b3e]"
          >
            {t("tradeLink.close", "Close")}
          </button>
        </div>
      </div>
    </div>
  );
}

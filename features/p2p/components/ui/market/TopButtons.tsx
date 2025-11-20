"use client";

import React from "react";
import { useP2PI18n } from "@/lib/useP2PI18n";

const TopButtons = ({
  activeTab,
  setActiveTab,
  onUnreadMessagesClick,
  showUnreadMessages = false,
  totalUnreadCount = 0,
  loading = false,
}: {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onUnreadMessagesClick?: () => void;
  showUnreadMessages?: boolean;
  totalUnreadCount?: number;
  loading?: boolean;
}) => {
  const { t } = useP2PI18n();
  
  const isBuyActive = activeTab === "buy";
  const isSellActive = activeTab === "sell";
  
  return (
    <div className="flex items-center justify-between gap-4 w-full">
      <div 
        className={`flex rounded-lg overflow-hidden p-1 w-fit transition-all duration-200 ${
          isBuyActive 
            ? "border-2 border border-[#1D8751]" 
            : isSellActive 
            ? "border-2 border border-[#E23D3A]" 
            : "border-2 border border-[#B71C1C]"
        }`}
      >
        <button
          onClick={() => setActiveTab("buy")}
          className={`px-2 py-1 font-bold text-sm min-w-[90px] h-10 transition-all duration-200 rounded-l-lg ${
            isBuyActive
              ? "bg-[#1D8751] text-white"
              : "bg-transparent text-white"
          }`}
        >
          {t("common.buy", "Buy")}
        </button>
        <button
          onClick={() => setActiveTab("sell")}
          className={`px-2 py-1 font-bold text-sm min-w-[90px] h-10 transition-all duration-200 rounded-r-lg ${
            isSellActive
              ? "bg-[#E23D3A] text-white"
              : "bg-transparent text-white"
          }`}
        >
          {t("common.sell", "Sell")}
        </button>
      </div>

      {/* Unread Message(s) Button */}
      <button
        className={`w-full sm:w-auto rounded-[28px] flex items-center justify-center gap-2 border border-[#1D8751] px-5 py-3 font-semibold text-sm hover:bg-[#1D8751]/10 transition-all relative ${
          showUnreadMessages
            ? "bg-[#1D8751] text-white border border-[#1D8751]"
            : "bg-white dark:bg-transparent text-[#1D8751]"
        } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
        disabled={loading}
        onClick={onUnreadMessagesClick}
      >
        <svg width="20" height="20" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
          <rect width="100" height="100" fill="currentColor" className="text-gray-800 dark:text-[#1A1A1D]"/>
          <path d="M20 10 H80 V70 H35 L25 95 L25 70 H20 Z" fill="#F79330"/>
          <rect x="35" y="25" width="40" height="10" fill="currentColor" className="text-gray-800 dark:text-[#1A1A1D]"/>
          <rect x="35" y="45" width="40" height="10" fill="currentColor" className="text-gray-800 dark:text-[#1A1A1D]"/>
        </svg>

        <span className={`text-sm ${showUnreadMessages ? "text-white" : "text-[#1D8751]"}`}>
          Unread Message(s)
        </span>
        
        {/* Unread count badge */}
        {totalUnreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center min-w-[20px]">
            {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
          </span>
        )}
      </button>
    </div>
  );
};

export default TopButtons;

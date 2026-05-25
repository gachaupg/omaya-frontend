"use client";

import React from "react";
import { tokens } from "@/styles/tokens";
import { TabsProps } from "../types";
import { useP2PI18n } from "@/lib/useP2PI18n";
import { Bell } from "lucide-react";
import { UnreadMessagesButton } from "./ui/UnreadMessagesButton";

const Tabs = ({ tabs, 
  activeTab, 
  onTabChange,
  onUnreadMessagesClick,
  totalUnreadCount,
  showUnreadMessages,
shouldShowMessagesButton = false, 
}: TabsProps) => {
  const { t } = useP2PI18n();
  return (
    <div className="flex items-start justify-between gap-2 sm:gap-3 md:gap-4 mb-2 sm:mb-4 md:mb-6 px-1 sm:px-2 md:px-4 pt-1 sm:pt-2 overflow-hidden">
      {/* Tab buttons - horizontal scroll on small screens */}
      <div className="flex gap-4 overflow-x-auto overflow-y-hidden flex-nowrap scroll-smooth scrollbar-thin min-w-0 flex-1 pb-1 -mx-1 px-1 sm:mx-0 sm:px-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`py-2 px-4 relative flex cursor-pointer items-center font-mulish text-lg leading-none tracking-[-0.2px] whitespace-nowrap flex-shrink-0 ${
              activeTab === tab.id
                ? "dark:text-white text-[#0D0D0D]"
                : "dark:text-[#788099] text-[#788099]"
            }`}
          >
            <span className="relative">
              {t(
                tab.label,
                tab.id === "market"
                  ? "P2P Market"
                  : tab.id === "dashboard"
                    ? "P2P Dashboard"
                    : tab.id === "center"
                      ? "P2P Center"
                      : tab.label
              )}
              {activeTab === tab.id && (
                <div className="absolute bottom-[-8px] left-0 h-0.5 w-full bg-[#1D8751]" />
              )}
            </span>
          </button>
        ))}
      </div>

      
    </div>
  );
};

export default Tabs;

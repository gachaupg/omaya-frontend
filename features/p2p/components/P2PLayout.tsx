"use client";

/**
 * P2PLayout.tsx
 */
import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { p2pTabs } from "../data";
import { tokens } from "@/styles/tokens";
import Tabs from "./Tabs";
import P2PDashboard from "./tabs/P2PDashboard";
import Market from "./tabs/Market";
import Orders from "./tabs/Orders";
import NotFound from "./tabs/NotFound";
import P2PCenter from "./tabs/p2pCenter";
import { Chats } from "./tabs/Chats";
import { P2PDataProvider } from "./P2PDataProvider";
import { useGroupedMessages } from "../hooks/useGroupedMessages";
import { RootState } from "@/store/rootReducer";

import { useSelector } from "react-redux";
import UnreadMessages from "./ui/orders/UnreadMessages";

const P2PLayout = () => {
  const searchParams = useSearchParams();
  const tabFromQuery = searchParams?.get("tab");
  const [activeTab, setActiveTab] = useState(tabFromQuery || "dashboard");
   const [showUnreadMessages, setShowUnreadMessages] = useState(false);
   const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { totalUnreadCount } = useSelector((state: RootState) => state.unreadMessages);

   // Reduce refetch interval when on chats tab to prevent constant reloading
   useGroupedMessages({ 
    enabled: isAuthenticated,
    limit: 100,
    refetchInterval: activeTab === "chats" ? 60000 : 30000, // 60s for chats, 30s for others
  });
  // Update active tab when query parameter changes
  useEffect(() => {
    if (tabFromQuery) {
      setActiveTab(tabFromQuery);
    }
  }, [tabFromQuery]);
const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setShowUnreadMessages(false); // Close messages when switching tabs
  };

  const handleUnreadMessagesClick = () => {
    setShowUnreadMessages(!showUnreadMessages);
  };

  const handleBackFromMessages = () => {
    setShowUnreadMessages(false);
  };
  // ✅ Determine the back text based on active tab
  const getBackToText = () => {
    if (activeTab === "market") return "Back to Market";
    if (activeTab === "orders") return "Back to Orders";
    return "Back";
  };

 
  const shouldShowMessagesButton = activeTab === "market" || activeTab === "orders";

  const renderTabContent = () => {
    if (showUnreadMessages) {
      return (
        <UnreadMessages
          loading={false}
          onBackToOrders={handleBackFromMessages}
          backText={getBackToText()}
        />
      );
    }

    switch (activeTab) {
      case "dashboard":
        return <P2PDashboard />;
      case "market":
        return <Market />;
      case "orders":
        return <Orders />;
      case "center":
        return <P2PCenter />;
          case "chats":
            return <Chats />;
      case "chats":
        return (
          <div className="w-full rounded-2xl border border-dashed border-[#D1D2D4FF] dark:border-[#35353E] bg-white dark:bg-[var(--card-color)] p-6 text-center text-sm text-[#788099] dark:text-[#A2A4A9]">
            Chats coming soon.
          </div>
        );
      default:
        return <NotFound />;
    }
  };
  return (
    <P2PDataProvider>
      <div className="dark:bg-[var(--bg-color)] bg-[#EEF1F4] w-full min-h-screen">
         <Tabs 
          tabs={p2pTabs} 
          activeTab={activeTab} 
          onTabChange={handleTabChange}
          onUnreadMessagesClick={handleUnreadMessagesClick}
          totalUnreadCount={totalUnreadCount}
          showUnreadMessages={showUnreadMessages}
          shouldShowMessagesButton={shouldShowMessagesButton}
        />
        <div className="px-1 sm:px-2 md:px-4 pt-0 mb-2 sm:mb-4 flex flex-col gap-2 sm:gap-3 md:gap-4 rounded-lg w-full">
          {renderTabContent()}
        </div>
      </div>
    </P2PDataProvider>
  );
};

export default P2PLayout;

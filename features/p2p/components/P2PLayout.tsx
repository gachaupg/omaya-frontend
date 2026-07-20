"use client";

/**
 * P2PLayout.tsx
 */
import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { p2pTabs } from "../data";
import { useP2PI18n } from "@/lib/useP2PI18n";
import { tokens } from "@/styles/tokens";
import Tabs from "./Tabs";
import P2PDashboard from "./tabs/P2PDashboard";
import Market from "./tabs/Market";
import Orders from "./tabs/Orders";
import NotFound from "./tabs/NotFound";
import P2PCenter from "./tabs/p2pCenter";
import { Chats } from "./tabs/Chats";
import { P2PDataProvider } from "./P2PDataProvider";
import { P2PWalletBalanceProvider } from "@/features/p2p/context/P2PWalletBalanceProvider";
import { useGroupedMessages } from "../hooks/useGroupedMessages";
import { RootState } from "@/store/rootReducer";

import { useSelector } from "react-redux";
import UnreadMessages from "./ui/orders/UnreadMessages";
import {
  consumeP2PMarketScrollOnLoad,
  scrollAppToTop,
} from "@/lib/utils/scrollAppToTop";
import { useSidebarSectionReset } from "@/lib/utils/sidebarNavigationReset";
import P2PTradeExpiredCard from "./ui/market/sections/P2PTradeExpiredCard";

const P2PLayout = () => {
  const { t } = useP2PI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabFromQuery = searchParams?.get("tab");
  const tradeLink = searchParams?.get("trade_link");
  const [activeTab, setActiveTab] = useState(
    tradeLink === "expired" ? "market" : tabFromQuery || "dashboard"
  );
  const [showUnreadMessages, setShowUnreadMessages] = useState(false);
  const [showTradeExpiredCard, setShowTradeExpiredCard] = useState(
    tradeLink === "expired"
  );
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { totalUnreadCount } = useSelector((state: RootState) => state.unreadMessages);

  // Reduce refetch interval when on chats tab to prevent constant reloading
  useGroupedMessages({
    enabled: isAuthenticated,
    limit: 100,
    refetchInterval: activeTab === "chats" ? 60000 : 30000, // 60s for chats, 30s for others
  });

  // Update active tab when query parameter changes; expired trade links open Market
  useEffect(() => {
    if (tradeLink === "expired") {
      setActiveTab("market");
      setShowTradeExpiredCard(true);
      return;
    }
    if (tabFromQuery) {
      setActiveTab(tabFromQuery);
    }
  }, [tabFromQuery, tradeLink]);

  useEffect(() => {
    if (activeTab !== "market") return;
    if (!consumeP2PMarketScrollOnLoad()) return;
    scrollAppToTop();
  }, [activeTab]);
const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setShowUnreadMessages(false); // Close messages when switching tabs
  };

  const handleSidebarReset = useCallback(() => {
    setActiveTab("dashboard");
    setShowUnreadMessages(false);
    setShowTradeExpiredCard(false);
    if (searchParams?.get("tab") || searchParams?.get("trade_link")) {
      router.replace("/dashboard/p2p", { scroll: false });
    }
    scrollAppToTop();
  }, [router, searchParams]);

  useSidebarSectionReset("p2p", handleSidebarReset);

  const handleUnreadMessagesClick = () => {
    setShowUnreadMessages(!showUnreadMessages);
  };

  const handleBackFromMessages = () => {
    setShowUnreadMessages(false);
  };

  const handleCloseTradeExpiredCard = () => {
    setShowTradeExpiredCard(false);
    router.replace("/dashboard/p2p/?tab=market", { scroll: false });
  };

  // Determine the back text based on active tab (translated)
  const getBackToText = () => {
    if (activeTab === "market") return t("back.backToMarket", "Back to P2P Market");
    if (activeTab === "orders") return t("back.backToOrders", "Back to Orders");
    return t("back.back", "Back");
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
      default:
        return <NotFound />;
    }
  };
  return (
    <P2PDataProvider>
      <P2PWalletBalanceProvider>
      <div className={`dark:bg-[var(--bg-color)] bg-[#EEF1F4] w-full ${activeTab === "chats" ? "min-h-[calc(100dvh-3rem)] h-[calc(100dvh-3rem)] overflow-hidden flex flex-col" : "min-h-screen"}`}>
         <Tabs 
          tabs={p2pTabs} 
          activeTab={activeTab} 
          onTabChange={handleTabChange}
          onUnreadMessagesClick={handleUnreadMessagesClick}
          totalUnreadCount={totalUnreadCount}
          showUnreadMessages={showUnreadMessages}
          shouldShowMessagesButton={shouldShowMessagesButton}
        />
        <div className={`w-full pt-0 flex flex-col gap-4 rounded-none sm:rounded-lg px-0 sm:px-6 md:px-8 pr-2 sm:pr-0 overflow-x-hidden ${activeTab === "chats" ? "flex-1 min-h-0 overflow-hidden" : "mb-4"}`}>
          {renderTabContent()}
        </div>
        <P2PTradeExpiredCard
          isOpen={showTradeExpiredCard}
          onClose={handleCloseTradeExpiredCard}
        />
      </div>
      </P2PWalletBalanceProvider>
    </P2PDataProvider>
  );
};

export default P2PLayout;

"use client";

import React, { useState } from "react";
import { useSelector } from "react-redux";
import TopButtons from "../ui/market/TopButtons";
import MarketTransactions from "../ui/market/MarketTransactions";
import UnreadMessages from "../ui/orders/UnreadMessages";
import { RootState } from "@/store/rootReducer";
import { useGroupedMessages } from "../../hooks/useGroupedMessages";

const Market = () => {
  const [activeTab, setActiveTab] = useState<"buy" | "sell">("buy");
  const [showUnreadMessages, setShowUnreadMessages] = useState(false);
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { loading } = useSelector((state: RootState) => state.p2pMarket || {});
  const { totalUnreadCount } = useSelector((state: RootState) => state.unreadMessages);

  // Initialize API hook for grouped messages
  useGroupedMessages({ 
    enabled: isAuthenticated && showUnreadMessages,
    limit: 100,
    refetchInterval: showUnreadMessages ? 30000 : 0, // Poll every 30 seconds when showing messages
  });

  const handleUnreadMessagesClick = () => {
    setShowUnreadMessages(!showUnreadMessages);
  };

  const handleBackToMarket = () => {
    setShowUnreadMessages(false);
  };

  return (
    <div className="flex flex-col gap-4 w-full h-full">
      <TopButtons
        activeTab={activeTab}
        setActiveTab={(tab: string) => setActiveTab(tab as "buy" | "sell")}
        onUnreadMessagesClick={handleUnreadMessagesClick}
        showUnreadMessages={showUnreadMessages}
        totalUnreadCount={totalUnreadCount}
        loading={loading}
      />
      
      <div className="flex flex-col w-full">
        {showUnreadMessages ? (
          <UnreadMessages
            loading={loading}
            onBackToOrders={handleBackToMarket}
          />
        ) : (
          <MarketTransactions activeTab={activeTab} />
        )}
      </div>
    </div>
  );
};

export default Market;

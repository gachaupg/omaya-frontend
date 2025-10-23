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
import { P2PDataProvider } from "./P2PDataProvider";

const P2PLayout = () => {
  const searchParams = useSearchParams();
  const tabFromQuery = searchParams?.get("tab");
  const [activeTab, setActiveTab] = useState(tabFromQuery || "dashboard");

  // Update active tab when query parameter changes
  useEffect(() => {
    if (tabFromQuery) {
      setActiveTab(tabFromQuery);
    }
  }, [tabFromQuery]);

  // Function to render content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <P2PDashboard />;
      case "market":
        return <Market />;

      case "orders":
        return <Orders />;
      case "center":
        return <P2PCenter />;
      default:
        return <NotFound />;
    }
  };

  return (
    <P2PDataProvider>
      <div className="dark:bg-[#18181D] bg-[#EEF1F4] w-full min-h-screen">
        <Tabs tabs={p2pTabs} activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="pl-4 pt-0 mb-4  flex flex-col gap-4 rounded-lg w-full">
          {renderTabContent()}
        </div>
      </div>
    </P2PDataProvider>
  );
};

export default P2PLayout;

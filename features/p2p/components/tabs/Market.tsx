"use client";

import React, { useState } from "react";
import TopButtons from "../ui/market/TopButtons";
import MarketTransactions from "../ui/market/MarketTransactions";

const Market = () => {
  const [activeTab, setActiveTab] = useState<"buy" | "sell">("buy");

  return (
    <div className="flex flex-col gap-4 w-full h-full">
      <TopButtons
        activeTab={activeTab}
        setActiveTab={(tab: string) => setActiveTab(tab as "buy" | "sell")}
      />
      <MarketTransactions />
    </div>
  );
};

export default Market;

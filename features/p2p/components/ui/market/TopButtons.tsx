"use client";

import React from "react";
import Button from "../../Common/Button";

const TopButtons = ({
  activeTab,
  setActiveTab,
}: {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}) => {
  return (
    <div className="flex border border-[#35353E] rounded-[9px] overflow-hidden w-fit bg-transparent">
      <Button
        onClick={() => setActiveTab("buy")}
        variant={activeTab === "buy" ? "primary" : "ghost"}
        size="md"
        className="border-r border-[#35353E] rounded-none font-semibold min-w-[90px] h-12 transition-all duration-200"
      >
        Buy
      </Button>
      <Button
        onClick={() => setActiveTab("sell")}
        variant={activeTab === "sell" ? "primary" : "ghost"}
        size="md"
        className={`rounded-none font-semibold min-w-[90px] h-12 transition-all duration-200 ${
          activeTab === "sell" ? "bg-[#E23D3A]" : "bg-transparent"
        }`}
      >
        Sell
      </Button>
    </div>
  );
};

export default TopButtons;

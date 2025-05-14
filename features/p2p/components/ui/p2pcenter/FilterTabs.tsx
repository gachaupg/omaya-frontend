import React, { useState } from "react";
import Button from "../../Common/Button";
import PaymentMethods from "./sections/PaymentMethods";
import Feedback from "./sections/Feedback";
import MyAdsTable from "./sections/MyAdsTable";

const tabList = [
  { label: "Payment Methods" },
  { label: "Feedback (0)" },
  { label: "My Ads", extra: <span className="text-[#E23D3A]">(14)</span> },
  { label: "+ Post New Ad" },
];

const FiterTabs = () => {
  const [activeTab, setActiveTab] = useState(0);

  // Filter bar for My Ads
  const MyAdsFilterBar = () => (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between w-full">
      {/* Token Filter */}
      <div className="flex items-center bg-[#23242A] rounded-full px-4 py-2 w-full sm:w-auto">
        <img src="/icons/usdt.svg" alt="Tether" className="w-6 h-6 mr-2" />
        <span className="text-white mr-2">Tether</span>
        <span className="text-[#788099]">USDT</span>
        <select className="bg-transparent text-white ml-2 outline-none w-full sm:w-auto">
          <option>Tether</option>
        </select>
      </div>
      {/* Type Filter */}
      <select className="bg-[#23242A] rounded-full px-4 py-2 text-white outline-none w-full sm:w-auto">
        <option>Type</option>
      </select>
      {/* Status Filter */}
      <select className="bg-[#23242A] rounded-full px-4 py-2 text-white outline-none w-full sm:w-auto">
        <option>Status</option>
      </select>
      {/* Date Filter */}
      <select className="bg-[#23242A] rounded-full px-4 py-2 text-white outline-none w-full sm:w-auto">
        <option>Date</option>
      </select>
      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
        <button className="w-full sm:w-auto px-4 py-2 rounded-full border border-[#1D8751] text-[#1D8751] bg-transparent">
          Publish
        </button>
        <button className="w-full sm:w-auto px-4 py-2 rounded-full border border-[#788099] text-[#788099] bg-transparent">
          Put Offline
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center w-full">
        <div className="flex flex-wrap gap-4 w-full sm:w-auto">
          {tabList.map((tab, idx) => (
            <Button
              key={tab.label}
              variant={activeTab === idx ? "primary" : "outline"}
              width={172}
              height={44}
              borderRadius={24}
              borderColor={activeTab === idx ? undefined : "#1D8751"}
              className={`${
                activeTab === idx ? "" : "text-[#1D8751]"
              } cursor-pointer min-w-[120px] sm:min-w-[172px]`}
              onClick={() => setActiveTab(idx)}
            >
              {tab.label} {tab.extra}
            </Button>
          ))}
        </div>
        <div className="flex flex-col gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#1D8751] inline-block"></span>
            <span className="text-[#A3A3C2]">Live Ads Exist</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#E23D3A] inline-block"></span>
            <span className="text-[#A3A3C2]">Offline Ads Exist</span>
          </div>
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        {activeTab === 0 && <PaymentMethods />}
        {activeTab === 1 && <Feedback />}
        {activeTab === 2 && (
          <>
            <MyAdsFilterBar />
            <MyAdsTable />
          </>
        )}
      </div>
    </div>
  );
};

export default FiterTabs;

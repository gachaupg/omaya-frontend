import React from "react";

interface ReferralTabsProps {
  tab: string;
  setTab: (tab: string) => void;
}

const ReferralTabs: React.FC<ReferralTabsProps> = ({ tab, setTab }) => {
  return (
    <div className="inline-flex border border-[#1D8751] rounded-lg mb-4 overflow-hidden p-1">
      <button
        className={`px-4 py-2 text-sm font-normal transition-all duration-150 focus:outline-none ${
          tab === "Referral"
            ? "bg-[#1D8751] text-white rounded"
            : "dark:bg-[#23232B] text-[#788099] hover:opacity-80"
        }`}
        onClick={() => setTab("Referral")}
      >
        Referral
      </button>
      <button
        className={`px-4 py-2 text-sm font-normal transition-all duration-150 focus:outline-none ${
          tab === "History"
            ? "bg-[#1D8751] text-white rounded"
            : "dark:bg-[#23232B] text-[#788099] hover:opacity-80"
        }`}
        onClick={() => setTab("History")}
      >
        History
      </button>
    </div>
  );
};

export default ReferralTabs; 
import React from "react";

interface ReferralTabsProps {
  tab: string;
  setTab: (tab: string) => void;
}

const ReferralTabs: React.FC<ReferralTabsProps> = ({ tab, setTab }) => {
  return (
    <div className="inline-flex border-2 border-[#1D8751] rounded-full mb-3">
      <button
        className={`px-3 py-1.5 text-sm font-semibold transition-all duration-150 focus:outline-none rounded-l-full ${
          tab === "Referral"
            ? "bg-[#1D8751] text-white"
            : "bg-transparent text-[#1D8751] hover:bg-[#1D8751] hover:text-white"
        }`}
        onClick={() => setTab("Referral")}
        style={{ borderRight: "none" }}
      >
        Referral
      </button>
      <button
        className={`px-3 py-1.5 text-sm font-semibold transition-all duration-150 focus:outline-none rounded-r-full ${
          tab === "History"
            ? "bg-[#1D8751] text-white"
            : "bg-transparent text-[#1D8751] hover:bg-[#1D8751] hover:text-white"
        }`}
        onClick={() => setTab("History")}
      >
        History
      </button>
    </div>
  );
};

export default ReferralTabs; 
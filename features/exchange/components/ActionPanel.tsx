import React from "react";

type ActionPanelProps = {
  selectedAction: "deposit" | "withdraw" | null;
  selectedType: "crypto" | "forex";
  onActionChange: (action: "deposit" | "withdraw") => void;
  onTypeChange: (type: "crypto" | "forex") => void;
};

const ActionPanel: React.FC<ActionPanelProps> = ({
  selectedAction,
  selectedType,
  onActionChange,
  onTypeChange,
}) => (
  <div className="rounded-2xl bg-[#1D1D23] border border-[#35353E] p-4 flex items-center justify-center gap-4">
    <button
      className={`px-4 py-2 rounded-lg font-semibold text-sm text-white border flex items-center gap-2 ${
        selectedAction === "deposit" 
          ? "bg-[#1D8751] text-white border-[#1D8751]" 
          : "bg-transparent border-[#1D8751] text-[#1D8751]"
      }`}
      onClick={() => onActionChange("deposit")}
    >
      <svg 
        width="16" 
        height="16" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        <line x1="7" y1="17" x2="17" y2="7"></line>
        <polyline points="7,7 17,7 17,17"></polyline>
      </svg>
      Deposit
    </button>
    <button
      className={`px-4 py-2 rounded-lg font-semibold text-sm border flex items-center gap-2 text-white ${
        selectedAction === "withdraw" 
          ? "bg-red-900 border-red-900" 
          : "bg-transparent border-red-900  hover:bg-red-900/10"
      }`}
      onClick={() => onActionChange("withdraw")}
    >
      <svg 
        width="16" 
        height="16" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        <line x1="17" y1="7" x2="7" y2="17"></line>
        <polyline points="17,17 7,17 7,7"></polyline>
      </svg>
      Withdraw
    </button>
  </div>
);

export default ActionPanel;
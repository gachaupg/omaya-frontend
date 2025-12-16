"use client";

import React, { useState } from "react";

type TabId = "express" | "moneyx" | "swap";

interface HeaderTabsProps {
  /** Optional controlled active tab */
  value?: TabId;
  /** Called whenever a tab is clicked */
  onChange?: (tab: TabId) => void;
  /** Optional custom labels */
  labels?: {
    express?: string;
    moneyx?: string;
    swap?: string;
  };
}

/**
 * HeaderTabs – three connected tabs (Express, MoneyX, Swap) with a joined header look.
 * - Works uncontrolled (internal state) or controlled via `value` / `onChange`.
 * - Uses the same connected visual style as the temporary `ConnectedTabs` in `tb.tsx`.
 */
const HeaderTabs: React.FC<HeaderTabsProps> = ({
  value,
  onChange,
  labels,
}) => {
  const [internalActive, setInternalActive] = useState<TabId>("express");

  const activeTab = value ?? internalActive;

  const tabs: { id: TabId; label: string }[] = [
    { id: "express", label: labels?.express ?? "Express XChange" },
    { id: "moneyx", label: labels?.moneyx ?? "MoneyX" },
    { id: "swap", label: labels?.swap ?? "Swap Crypto" },
  ];

  const handleClick = (id: TabId) => {
    if (!value) {
      setInternalActive(id);
    }
    onChange?.(id);
  };

  return (
    <div className="w-full flex flex-col items-center justify-center">
      <div className="relative w-full max-w-2xl rounded-3xl bg-[#15171f] border border-[#2f323b] shadow-lg overflow-hidden">
        <div className="relative flex w-full">
          {tabs.map((tab, index) => {
            const isActive = activeTab === tab.id;
            const isFirst = index === 0;
            const isLast = index === tabs.length - 1;

            // Clip-paths create the slanted meeting points between tabs
            let clipPath: string | undefined;
            if (isFirst) {
              // Straight left edge, slanted where it meets the next tab
              clipPath = "polygon(0 0, 100% 0, 100% 100%, 8% 100%, 0 0)";
            } else if (isLast) {
              // Slanted where it meets the previous tab, straight right edge
              clipPath = "polygon(8% 0, 100% 0, 100% 100%, 0 100%, 8% 0)";
            } else {
              // Middle tab: slanted on both sides
              clipPath = "polygon(8% 0, 100% 0, 92% 100%, 0 100%, 8% 0)";
            }

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleClick(tab.id)}
                className={[
                  "relative flex-1 h-12 sm:h-14 px-4 sm:px-6 text-xs sm:text-sm font-semibold tracking-wide",
                  "flex items-center justify-center select-none transition-colors duration-200 overflow-hidden",
                  isActive
                    ? "bg-[#15171f] text-white"
                    : "bg-[#20232f] text-[#7C8A97] hover:bg-[#262a38]",
                  isFirst ? "rounded-tl-3xl" : "",
                  isLast ? "rounded-tr-3xl" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                style={{ clipPath }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default HeaderTabs;



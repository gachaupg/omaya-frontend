"use client";

import React from "react";
import { tokens } from "@/styles/tokens";
import { TabsProps } from "../types";
import { useP2PI18n } from "@/lib/useP2PI18n";

const Tabs = ({ tabs, activeTab, onTabChange }: TabsProps) => {
  const { t } = useP2PI18n();
  return (
    <div className="flex flex-wrap gap-4 mb-6">
      {tabs.map((tab) => {
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`py-2 px-4 relative flex cursor-pointer items-center font-mulish text-lg  leading-none tracking-[-0.2px] ${
              activeTab === tab.id
                ? "dark:text-white text-[#0D0D0D]"
                : "dark:text-[#788099] text-[#788099]"
            }`}
          >
            <span className="relative">
              {t(tab.label, tab.label)}
              {activeTab === tab.id && (
                <div className="absolute bottom-[-8px] left-0 h-0.5 w-full bg-[#1D8751]" />
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default Tabs;

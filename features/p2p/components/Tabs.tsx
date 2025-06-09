"use client";

import React from "react";
import { tokens } from "@/styles/tokens";
import { TabsProps } from "../types";

const Tabs = ({ tabs, activeTab, onTabChange }: TabsProps) => {
  return (
    <div className="flex flex-wrap gap-4 mb-6">
      {tabs.map((tab) => {
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`py-2 px-4 relative flex cursor-pointer items-center font-mulish text-lg  leading-none tracking-[-0.2px] ${
              activeTab === tab.id
                ? `text-[${tokens.colors.dark.textTitle}]`
                : `text-[${tokens.colors.dark.textBody}]`
            }`}
          >
            <span className="relative">
              {tab.label}
              {activeTab === tab.id && (
                <div
                  className={`absolute bottom-[-8px] left-0 h-0.5 w-full bg-[${tokens.colors.brand.primary}]`}
                />
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default Tabs;

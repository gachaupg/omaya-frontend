"use client";
import React, { useState } from "react";
import ProfileSettings from "../tabs/ProfileSettings";
import KYC from "../tabs/KYC";
import PrivacySecurity from "../tabs/PrivacySecurity";
import PaymentMethods from "../tabs/PaymentMethods";
import Referral from "../tabs/Referral";
import Stats from "../tabs/Stats";
import { Settings, ShieldCheck, Key } from "lucide-react";

const tabs = [
  {
    label: "Profile Settings",
    icon: (
      <Settings className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" />
    ),
    component: <ProfileSettings />,
  },
  {
    label: "KYC",
    icon: (
      <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" height="24" viewBox="0 0 24 24" 
      fill="none"
      stroke="currentColor"
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round">
      <path d="M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v1"/>
      <path d="M14 2v4a2 2 0 0 0 2 2h4"/>
      <rect width="8" height="5" x="2" y="13" rx="1"/>
      <path d="M8 13v-2a2 2 0 1 0-4 0v2"/>
      </svg>
    ),
    component: <KYC />,
  },
  {
    label: "Privacy & Security",
    icon: (
      // <svg
      //   className="w-5 h-5 md:w-6 md:h-6"
      //   fill="none"
      //   stroke="currentColor"
      //   strokeWidth="2"
      //   viewBox="0 0 24 24"
      // >
      //   <circle cx="12" cy="12" r="10" />
      //   <path d="M12 16v-4M12 8h.01" />
      // </svg>
    <svg xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round">
      <path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z"/>
      <circle cx="16.5" 
      cy="7.5" r=".5" 
      fill="currentColor"/>
    </svg>
    ),
    component: <PrivacySecurity />,
  },
  {
    label: "My Payment Methods",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        >
        <path d="m18 5-2.414-2.414A2 2 0 0 0 14.172 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2"/>
        <path d="M21.378 12.626a1 1 0 0 0-3.004-3.004l-4.01 4.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z"/>
        <path d="M8 18h1"/>
      </svg>
    ),
    component: <PaymentMethods />,
  },
  {
    label: "Referral",
    icon: (
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        style={{ transform: "rotate(-45deg)" }}
      >
        <path d="M9 17H7A5 5 0 0 1 7 7h2"/>
        <path d="M15 7h2a5 5 0 1 1 0 10h-2"/>
        <line x1="8" x2="16" y1="12" y2="12"/>
      </svg>
    ),
    component: <Referral />,
  },
];

const Filters = () => {
  const [activeIdx, setActiveIdx] = useState(0);

  return (
    <div className="flex flex-col">
      {/* Mobile: Vertical column tabs */}
      <div className="md:hidden">
        <div className="flex flex-col rounded-lg border dark:bg-[#1D1D23] bg-white dark:border-[#35353E] border-gray-300 w-full overflow-hidden">
          {tabs.map((tab, idx) => (
            <button
              key={tab.label}
              className={`flex flex-row items-center justify-start gap-3 transition-all duration-150 focus:outline-none w-full px-4 py-3 border-b dark:border-[#35353E] border-gray-300 last:border-b-0
                ${
                  activeIdx === idx
                    ? "bg-[#1D8751] text-white font-semibold"
                    : "bg-transparent dark:text-white text-[#0D0D0D] hover:dark:bg-[#23232a] hover:bg-gray-100"
                }
              `}
              onClick={() => setActiveIdx(idx)}
              type="button"
            >
              <span className="flex items-center justify-center">
                {tab.icon}
              </span>
              <span className="text-sm font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Desktop: Horizontal tabs */}
      <div className="hidden md:flex items-center rounded-lg border px-2 py-2 dark:bg-[#1D1D23] bg-white dark:border-[#35353E] border-gray-300 w-full">
        {tabs.map((tab, idx) => (
          <button
            key={tab.label}
            className={`flex flex-row items-center justify-center flex-1 gap-2 transition-all duration-150 focus:outline-none 
              ${
                activeIdx === idx
                  ? "bg-[#1D8751] text-white font-semibold px-6 py-3 mr-4 rounded-[24px]"
                  : "bg-transparent dark:text-white text-[#0D0D0D] hover:dark:bg-[#23232a] hover:bg-gray-100 rounded-lg"
              }
            `}
            onClick={() => setActiveIdx(idx)}
            type="button"
          >
            <span className="flex items-center justify-center">{tab.icon}</span>
            <span className="text-sm">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content area */}
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 mt-4 lg:mt-6">
        <div className="flex-1">{tabs[activeIdx].component}</div>
        <div className="lg:w-[300px] lg:flex-shrink-0">
          <Stats />
        </div>
      </div>
    </div>
  );
};

export default Filters;

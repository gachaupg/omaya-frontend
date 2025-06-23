"use client";
import React, { useState } from "react";
import ProfileSettings from "../tabs/ProfileSettings";
import KYC from "../tabs/KYC";
import PrivacySecurity from "../tabs/PrivacySecurity";
import PaymentMethods from "../tabs/PaymentMethods";
import Referral from "../tabs/Referral";
import Stats from "../tabs/Stats";

const tabs = [
  {
    label: "Profile Settings",
    icon: (
      <svg
        className="w-5 h-5 md:w-6 md:h-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M11.25 2.25c.38-1.13 2.12-1.13 2.5 0a1.5 1.5 0 0 0 2.1.86c1.08-.54 2.25.63 1.71 1.71a1.5 1.5 0 0 0 .86 2.1c1.13.38 1.13 2.12 0 2.5a1.5 1.5 0 0 0-.86 2.1c.54 1.08-.63 2.25-1.71 1.71a1.5 1.5 0 0 0-2.1.86c-.38 1.13-2.12 1.13-2.5 0a1.5 1.5 0 0 0-2.1-.86c-1.08.54-2.25-.63-1.71-1.71a1.5 1.5 0 0 0-.86-2.1c-1.13-.38-1.13-2.12 0-2.5a1.5 1.5 0 0 0 .86-2.1c-.54-1.08.63-2.25 1.71-1.71a1.5 1.5 0 0 0 2.1-.86z"
        />
      </svg>
    ),
    component: <ProfileSettings />,
  },
  {
    label: "KYC",
    icon: (
      <svg
        className="w-5 h-5 md:w-6 md:h-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <path d="M9 9h6M9 13h6M9 17h2" />
      </svg>
    ),
    component: <KYC />,
  },
  {
    label: "Privacy & Security",
    icon: (
      <svg
        className="w-5 h-5 md:w-6 md:h-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4M12 8h.01" />
      </svg>
    ),
    component: <PrivacySecurity />,
  },
  {
    label: "My Payment Methods",
    icon: (
      <svg
        className="w-5 h-5 md:w-6 md:h-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <rect x="2" y="7" width="20" height="10" rx="2" />
        <path d="M2 10h20" />
      </svg>
    ),
    component: <PaymentMethods />,
  },
  {
    label: "Referral",
    icon: (
      <svg
        className="w-5 h-5 md:w-6 md:h-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path d="M10 13a5 5 0 0 1 7.07 0l1.41 1.41a5 5 0 0 1-7.07 7.07l-1.41-1.41" />
        <path d="M14 11a5 5 0 0 0-7.07 0l-1.41 1.41a5 5 0 0 0 7.07 7.07l1.41-1.41" />
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
        <div className="flex flex-col rounded-lg border bg-[#1D1D23] border-[#35353E] w-full overflow-hidden">
          {tabs.map((tab, idx) => (
            <button
              key={tab.label}
              className={`flex flex-row items-center justify-start gap-3 transition-all duration-150 focus:outline-none w-full px-4 py-3 border-b border-[#35353E] last:border-b-0
                ${
                  activeIdx === idx
                    ? "bg-[#1D8751] text-white font-semibold"
                    : "bg-transparent text-white hover:bg-[#23232a]"
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
      <div className="hidden md:flex items-center rounded-lg border px-2 py-2 bg-[#1D1D23] border-[#35353E] w-full">
        {tabs.map((tab, idx) => (
          <button
            key={tab.label}
            className={`flex flex-row items-center justify-center flex-1 gap-2 transition-all duration-150 focus:outline-none 
              ${
                activeIdx === idx
                  ? "bg-[#1D8751] text-white font-semibold px-6 py-3 mr-4 rounded-[24px]"
                  : "bg-transparent text-white hover:bg-[#23232a] rounded-lg"
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

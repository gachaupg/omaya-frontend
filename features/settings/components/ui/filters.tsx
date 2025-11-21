"use client";
import React, { useEffect, useState } from "react";
import ProfileSettings from "../tabs/ProfileSettings";
import KYC from "../tabs/KYC";
import PrivacySecurity from "../tabs/PrivacySecurity";
import PaymentMethods from "../tabs/PaymentMethods";
import Referral from "../tabs/Referral";
import Stats from "../tabs/Stats";
import { Settings, ShieldCheck, Key } from "lucide-react";
import HelpSupportForm from "../HelpSupportForm";
import { useSettingsI18n } from "@/lib/useSettingsI18n";

const tabs = [
  {
    label: "settings.tabs.profile",
    icon: (
      <Settings
        className="w-4 h-4 md:w-4 md:h-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      />
    ),
    component: <ProfileSettings />,
  },
  {
    label: "settings.tabs.kyc",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-4 h-4"
      >
        <path d="M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v1" />
        <path d="M14 2v4a2 2 0 0 0 2 2h4" />
        <rect width="8" height="5" x="2" y="13" rx="1" />
        <path d="M8 13v-2a2 2 0 1 0-4 0v2" />
      </svg>
    ),
    component: <KYC />,
  },
  {
    label: "settings.tabs.privacy",
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
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-4 h-4"
      >
        <path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z" />
        <circle cx="16.5" cy="7.5" r=".5" fill="currentColor" />
      </svg>
    ),
    component: <PrivacySecurity />,
  },
  {
    label: "settings.tabs.paymentMethods",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-4 h-4"
      >
        <path d="m18 5-2.414-2.414A2 2 0 0 0 14.172 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2" />
        <path d="M21.378 12.626a1 1 0 0 0-3.004-3.004l-4.01 4.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z" />
        <path d="M8 18h1" />
      </svg>
    ),
    component: <PaymentMethods />,
  },
  {
    label: "settings.tabs.referral",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-4 h-4"
        style={{ transform: "rotate(-45deg)" }}
      >
        <path d="M9 17H7A5 5 0 0 1 7 7h2" />
        <path d="M15 7h2a5 5 0 1 1 0 10h-2" />
        <line x1="8" x2="16" y1="12" y2="12" />
      </svg>
    ),
    component: <Referral />,
  },
];

const REFERRAL_TAB_INDEX = tabs.findIndex(
  (tab) => tab.label === "settings.tabs.referral"
);

const Filters = () => {
  const [activeIdx, setActiveIdx] = useState(0);
  const [showHelpSupport, setShowHelpSupport] = useState(false);
  const [isReferralWithdrawActive, setIsReferralWithdrawActive] = useState(false);
  const { t } = useSettingsI18n();

  useEffect(() => {
    if (activeIdx !== REFERRAL_TAB_INDEX && isReferralWithdrawActive) {
      setIsReferralWithdrawActive(false);
    }
  }, [activeIdx, isReferralWithdrawActive]);

  useEffect(() => {
    if (showHelpSupport && isReferralWithdrawActive) {
      setIsReferralWithdrawActive(false);
    }
  }, [showHelpSupport, isReferralWithdrawActive]);

  const renderActiveContent = () => {
    if (showHelpSupport) {
      return <HelpSupportForm />;
    }

    if (activeIdx === REFERRAL_TAB_INDEX) {
      return (
        <Referral onWithdrawStateChange={setIsReferralWithdrawActive} />
      );
    }

    return tabs[activeIdx].component;
  };

  return (
    <div className="flex flex-col px-3 sm:px-4">
      {/* Mobile: Vertical column tabs */}
      <div className="md:hidden">
        <div className="flex flex-col p-4 rounded-lg border dark:bg-[#1D1D23] bg-white dark:border-[#35353E] border-gray-300 w-full overflow-hidden">
          {tabs.map((tab, idx) => (
            <button
              key={tab.label}
              className={`flex flex-row items-center justify-start gap-2 transition-all duration-150 focus:outline-none w-full px-3 py-2 border-b dark:border-[#35353E] border-gray-300 last:border-b-0
                ${
                  activeIdx === idx
                    ? "bg-[#1D8751] text-white font-semibold"
                    : "bg-transparent dark:text-white text-[#0D0D0D] hover:dark:bg-[#23232a] hover:bg-gray-100"
                }
              `}
              onClick={() => {
                setActiveIdx(idx);
                setShowHelpSupport(false);
              }}
              type="button"
            >
              <span className="flex items-center justify-center">
                {tab.icon}
              </span>
              <span className="text-xs font-medium">
                {t(tab.label, tab.label)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Desktop: Horizontal tabs */}
      <div className="hidden md:flex items-center rounded-lg border px-3 py-2 dark:bg-[#1D1D23] bg-white dark:border-[#35353E] border-gray-300 w-full">
        {tabs.map((tab, idx) => (
          <button
            key={tab.label}
            className={`flex flex-row items-center justify-center gap-1.5 transition-all duration-150 focus:outline-none 
              ${
                activeIdx === idx
                  ? "bg-[#1D8751] text-white font-semibold px-3 py-2 mr-2 rounded-[24px] flex-grow-0"
                  : "bg-transparent dark:text-white text-[#0D0D0D] hover:dark:bg-[#23232a] hover:bg-gray-100 rounded-lg flex-1"
              }
            `}
            onClick={() => setActiveIdx(idx)}
            type="button"
          >
            <span className="flex items-center justify-center">{tab.icon}</span>
            <span className="text-xs">{t(tab.label, tab.label)}</span>
          </button>
        ))}
      </div>

      {/* Content area */}
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 mt-4 lg:mt-6">
        <div className="w-full">
          {renderActiveContent()}
        </div>
        {!isReferralWithdrawActive && (
          <div className="w-full lg:w-[300px] lg:flex-shrink-0">
            <Stats onSupportClick={() => setShowHelpSupport((prev) => !prev)} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Filters;

"use client";

import React from "react";
import {
  EXPRESS_P2P_WITHDRAWAL_TERMS_INTRO,
  EXPRESS_P2P_WITHDRAWAL_TERMS_SECTIONS,
} from "@/features/express/constants/expressP2PWithdrawalTerms";

type Variant = "dashboard" | "default";

interface ExpressP2PWithdrawalTermsPanelProps {
  expandedTerms: boolean;
  setExpandedTerms: (next: boolean) => void;
  variant: Variant;
  /** Used only when variant === "dashboard" */
  isDark?: boolean;
}

export function ExpressP2PWithdrawalTermsPanel({
  expandedTerms,
  setExpandedTerms,
  variant,
  isDark,
}: ExpressP2PWithdrawalTermsPanelProps) {
  /** Collapsed view: first N numbered items; remainder via Show more. */
  const COLLAPSED_SECTION_COUNT = 3;
  const visibleSections = expandedTerms
    ? EXPRESS_P2P_WITHDRAWAL_TERMS_SECTIONS
    : EXPRESS_P2P_WITHDRAWAL_TERMS_SECTIONS.slice(0, COLLAPSED_SECTION_COUNT);
  const hasMoreSections =
    EXPRESS_P2P_WITHDRAWAL_TERMS_SECTIONS.length > COLLAPSED_SECTION_COUNT;

  const introClass =
    variant === "dashboard"
      ? `text-xs sm:text-sm mb-3 ${isDark ? "text-[#788099]" : "text-[#475569]"}`
      : "text-xs sm:text-sm text-[#35353e] dark:text-[#788099] mb-3";

  const itemClass =
    variant === "dashboard"
      ? `text-xs sm:text-sm ${isDark ? "text-[#788099]" : "text-[#475569]"}`
      : "text-xs sm:text-sm text-[#35353e] dark:text-[#788099]";

  const titleClass =
    variant === "dashboard"
      ? `font-medium text-sm sm:text-base ${isDark ? "text-white" : "text-gray-900"}`
      : "font-medium text-sm sm:text-base text-[#35353e] dark:text-white";

  const outerClass =
    variant === "dashboard"
      ? `border border-[#1D8751] rounded-xl overflow-hidden transition-all duration-300 ${isDark ? "bg-[#1D1D23]" : "bg-[#F8FAFF]"}`
      : "dark:bg-[#1D1D23] border border-[#1D8751] rounded-xl overflow-hidden transition-all duration-300";

  return (
    <>
      <div className="flex items-center gap-2 mb-2">
        <svg className="w-5 h-5 text-[#1D8751]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h3 className={titleClass}>Terms & Conditions</h3>
      </div>
      <div className={outerClass}>
        <div className="p-4">
          <p className={introClass}>{EXPRESS_P2P_WITHDRAWAL_TERMS_INTRO}</p>
          <div className="space-y-2 sm:space-y-3">
            {visibleSections.map((section, idx) => (
              <div key={section.heading} className="flex items-start gap-2 sm:gap-3">
                <span className="text-[#1D8751] font-bold text-sm sm:text-base flex-shrink-0">
                  {idx + 1}.
                </span>
                <p className={`${itemClass} whitespace-pre-line`}>
                  <span className="font-semibold">{section.heading}:</span>{" "}
                  {section.body}
                </p>
              </div>
            ))}
          </div>
          {hasMoreSections && (
            <button
              type="button"
              onClick={() => setExpandedTerms(!expandedTerms)}
              className="mt-3 sm:mt-4 text-[#1D8751] hover:text-[#166b3e] font-semibold text-xs sm:text-sm flex items-center gap-1.5 transition-colors"
            >
              {expandedTerms ? (
                <>
                  <span>Show Less</span>
                  <svg className="w-4 h-4 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </>
              ) : (
                <>
                  <span>Show More</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </>
  );
}

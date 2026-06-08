"use client";

import React from "react";

type PendingAcceptanceBannerProps = {
  text: string;
  className?: string;
};

export function PendingAcceptanceBanner({
  text,
  className = "mb-3",
}: PendingAcceptanceBannerProps) {
  return (
    <div
      role="status"
      className={`rounded-xl px-4 py-2.5 text-sm font-medium border border-[#1D8751]/40 bg-[#1D8751]/10 text-gray-900 dark:text-white dark:bg-[#1D8751]/20 ${className}`}
    >
      <span className="inline-block w-2 h-2 rounded-full bg-[#1D8751] animate-pulse mr-2 align-middle" />
      {text}
    </div>
  );
}

"use client";

import React from "react";

const SUCCESS_GREEN = "#1D8751";

type ExpressSuccessHeroProps = {
  message?: string;
  className?: string;
};

/** Code-based success header (replaces success PNG assets). */
export function ExpressSuccessHero({
  message = "Your Exchange has been completed successfully",
  className = "",
}: ExpressSuccessHeroProps) {
  return (
    <div
      className={`flex flex-col items-center text-center w-full pt-0 pb-2 ${className}`}
    >
      <div className="relative mb-2.5 flex items-center justify-center">
        <span
          className="absolute -top-1 left-1 w-1.5 h-1.5 rounded-full bg-[#F5A623]"
          aria-hidden
        />
        <span
          className="absolute -top-0.5 right-0 w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: SUCCESS_GREEN }}
          aria-hidden
        />
        <span
          className="absolute bottom-0 -left-1 w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: SUCCESS_GREEN }}
          aria-hidden
        />
        <span
          className="absolute -bottom-0.5 right-0 w-1.5 h-1.5 rounded-full bg-[#4A90D9]"
          aria-hidden
        />

        <div
          className="w-16 h-16 sm:w-[4.5rem] sm:h-[4.5rem] rounded-full flex items-center justify-center shadow-md"
          style={{ backgroundColor: SUCCESS_GREEN }}
        >
          <svg
            className="w-7 h-7 sm:w-8 sm:h-8 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
      </div>

      <h1 className="text-lg sm:text-xl font-bold tracking-tight mb-1 leading-tight">
        <span className="text-gray-900 dark:text-white">EXCHANGE </span>
        <span style={{ color: SUCCESS_GREEN }}>Successful!</span>
      </h1>

      <p className="text-xs sm:text-sm text-gray-600 dark:text-white/90 max-w-sm px-2 leading-snug">
        {message}
      </p>
    </div>
  );
}

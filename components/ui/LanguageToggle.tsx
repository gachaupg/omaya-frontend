"use client";

import React from "react";
import { useLanguageOptional } from "@/context/language";

type LanguageToggleProps = {
  className?: string;
};

export const LanguageToggle: React.FC<LanguageToggleProps> = ({
  className = "",
}) => {
  const ctx = useLanguageOptional();
  if (!ctx) {
    return null;
  }
  const { locale, setLocale } = ctx;

  const isEnglish = locale === "en";
  const target = isEnglish ? "so" : "en";

  return (
    <button
      type="button"
      onClick={() => setLocale(target as any)}
      className={`px-3 py-1 rounded-md text-sm border border-gray-400/40 dark:border-gray-600/60 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${className}`}
      aria-label={`Switch language to ${target}`}
    >
      {isEnglish ? "SO" : "EN"}
    </button>
  );
};

export default LanguageToggle;

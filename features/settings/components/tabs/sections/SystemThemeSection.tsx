import React from "react";
import { useThemeToggle } from "../../../hooks/useThemeToggle";

const SystemThemeSection: React.FC = () => {
  const { theme, currentTheme, isDark, isLight, updating, toggleTheme } =
    useThemeToggle();

  const handleThemeChange = (mode: "light" | "dark" | "system") => {
    toggleTheme(mode);
  };

  return (
    <>
      <div className="text-base font-bold dark:text-white text-gray-900 mb-0">
        System Theme
      </div>
      <section className="dark:bg-[#1D1D23] bg-gray-50 rounded-2xl dark:border-[#35353E] border-gray-300 border-2 p-4 shadow-lg">
        <div className="flex gap-3 mb-3">
          <button
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-2xl font-semibold text-sm transition-all ${
              isLight
                ? "bg-[#1D8751] text-white"
                : "bg-[#23232B] text-[#788099] hover:bg-[#2A2A32]"
            }`}
            onClick={() => handleThemeChange("light")}
            aria-pressed={isLight}
            disabled={updating}
          >
            <svg
              width="18"
              height="18"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <circle cx="12" cy="12" r="5" strokeWidth="2" />
              <path
                d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
                strokeWidth="2"
              />
            </svg>
            Light
          </button>
          <button
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-2xl font-semibold text-sm transition-all ${
              isDark
                ? "bg-[#1D8751] text-white"
                : "border border-[#1D8751] text-[#1D8751] hover:bg-[#1D8751] hover:text-white"
            }`}
            onClick={() => handleThemeChange("dark")}
            aria-pressed={isDark}
            disabled={updating}
          >
            <svg
              width="18"
              height="18"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z"
                strokeWidth="2"
              />
            </svg>
            Dark
          </button>
        </div>
        {updating && (
          <div className="text-center py-2">
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-[#1D8751] mx-auto"></div>
            <span className="dark:text-[#808080] text-gray-500 text-xs ml-2">
              Updating theme...
            </span>
          </div>
        )}
       
      </section>
    </>
  );
};

export default SystemThemeSection;
import React from "react";
import { useThemeToggle } from "../../../hooks/useThemeToggle";

const SystemThemeSection: React.FC = () => {
  const { theme, currentTheme, isDark, isLight, isDeem, updating, toggleTheme } =
    useThemeToggle();

  const handleThemeChange = (mode: "light" | "dark" | "deem" | "system") => {
    toggleTheme(mode);
  };

  return (
    <>
      <div className="text-sm font-bold dark:text-white text-gray-900 mb-1">
        System Theme
      </div>
      <section className="dark:bg-card bg-card rounded-xl dark:border-[#35353E] border-[#E8EFF5] border p-3 sm:p-4">
        <div className="flex gap-3">
          <button
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-2xl font-semibold text-sm transition-all border bg-white dark:bg-[#18181D] hover:bg-gray-50 dark:hover:bg-[#14141B] ${
              isLight
                ? "text-gray-900 dark:text-white border-[#1D8751] ring-2 ring-[#1D8751]/20"
                : "text-gray-700 dark:text-[#C7CAD1] border-gray-300 dark:border-[#35353E]"
            }`}
            onClick={() => handleThemeChange("light")}
            aria-pressed={isLight}
            disabled={updating}
          >
            <span className="w-4 h-4 rounded-full border border-gray-300 bg-white flex-shrink-0" />
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
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-2xl font-semibold text-sm transition-all border bg-white dark:bg-[#18181D] hover:bg-gray-50 dark:hover:bg-[#14141B] ${
              isDeem
                ? "text-gray-900 dark:text-white border-[#1D8751] ring-2 ring-[#1D8751]/20"
                : "text-gray-700 dark:text-[#C7CAD1] border-gray-300 dark:border-[#35353E]"
            }`}
            onClick={() => handleThemeChange("deem")}
            aria-pressed={isDeem}
            disabled={updating}
          >
            <span className="w-4 h-4 rounded-full border border-[#35353E] bg-[#23232B] flex-shrink-0" />
            <svg
              width="18"
              height="18"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <circle cx="12" cy="12" r="5" strokeWidth="2" />
              <path
                d="M12 8v8M8 12h8"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            Dim
          </button>
          <button
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-2xl font-semibold text-sm transition-all border bg-white dark:bg-[#18181D] hover:bg-gray-50 dark:hover:bg-[#14141B] ${
              currentTheme === "dark"
                ? "text-gray-900 dark:text-white border-[#1D8751] ring-2 ring-[#1D8751]/20"
                : "text-gray-700 dark:text-[#C7CAD1] border-gray-300 dark:border-[#35353E]"
            }`}
            onClick={() => handleThemeChange("dark")}
            aria-pressed={currentTheme === "dark"}
            disabled={updating}
          >
            <span className="w-4 h-4 rounded-full border border-[#2F2F3A] bg-[#0F0F17] flex-shrink-0" />
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
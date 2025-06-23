import React, { useState } from "react";

const SystemThemeSection: React.FC = () => {
  const [currentTheme, setCurrentTheme] = useState<"light" | "dark" | "system">(
    "dark"
  );
  const [updating, setUpdating] = useState(false);

  const handleThemeChange = async (mode: "light" | "dark" | "system") => {
    setUpdating(true);
    // Simulate API call
    setTimeout(() => {
      setCurrentTheme(mode);
      setUpdating(false);
    }, 1000);
  };

  const isDark = currentTheme === "dark";
  const isLight = currentTheme === "light";

  return (
    <section className="bg-[#18181D] rounded-xl border border-[#35353E] p-4 shadow-lg">
      <div className="text-base font-semibold text-white mb-2">
        System Theme
      </div>
      <div className="flex gap-3 mb-3">
        <button
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-semibold text-sm transition-all ${
            isLight
              ? "bg-[#1D8751] text-white"
              : "bg-[#23232B] text-[#788099] hover:bg-[#2A2A32]"
          }`}
          onClick={() => handleThemeChange("light")}
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
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-semibold text-sm transition-all ${
            isDark
              ? "bg-[#1D8751] text-white"
              : "bg-[#23232B] text-[#788099] hover:bg-[#2A2A32]"
          }`}
          onClick={() => handleThemeChange("dark")}
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
        <button
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-semibold text-sm transition-all ${
            currentTheme === "system"
              ? "bg-[#1D8751] text-white"
              : "bg-[#23232B] text-[#788099] hover:bg-[#2A2A32]"
          }`}
          onClick={() => handleThemeChange("system")}
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
              d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 6.34l-1.41 1.41M19.07 19.07l-1.41 1.41"
              strokeWidth="2"
            />
          </svg>
          System
        </button>
      </div>
      {updating && (
        <div className="text-center py-2">
          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-[#1D8751] mx-auto"></div>
          <span className="text-[#808080] text-xs ml-2">Updating theme...</span>
        </div>
      )}
      <div className="text-xs text-[#808080] mt-2">
        Current theme: {currentTheme} {currentTheme === "system" && "(system)"}
      </div>
    </section>
  );
};

export default SystemThemeSection;

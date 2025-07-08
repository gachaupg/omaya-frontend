import React from "react";
import { useTheme } from "@/context/theme";
import { ThemeToggle } from "./ThemeToggle";

export const ThemeExample: React.FC = () => {
  const { theme, toggleTheme, setTheme, isDark, isLight } = useTheme();

  return (
    <div
      className={`p-6 rounded-lg transition-colors duration-200 ${
        isDark
          ? "bg-gray-900 text-white"
          : "bg-white text-gray-900 border border-gray-200"
      }`}
    >
      <h2 className="text-2xl font-bold mb-4">Theme Switching Examples</h2>

      <div className="space-y-4">
        {/* Current theme display */}
        <div className="p-4 rounded-lg bg-gray-100 dark:bg-gray-800">
          <p className="font-medium">
            Current Theme: <span className="capitalize">{theme}</span>
          </p>
          <p>Is Dark: {isDark ? "Yes" : "No"}</p>
          <p>Is Light: {isLight ? "Yes" : "No"}</p>
        </div>

        {/* Method 1: Using the ThemeToggle component */}
        <div>
          <h3 className="text-lg font-semibold mb-2">
            Method 1: Theme Toggle Component
          </h3>
          <ThemeToggle showText={true} />
        </div>

        {/* Method 2: Direct toggle function */}
        <div>
          <h3 className="text-lg font-semibold mb-2">
            Method 2: Direct Toggle
          </h3>
          <button
            onClick={toggleTheme}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Toggle Theme
          </button>
        </div>

        {/* Method 3: Set specific theme */}
        <div>
          <h3 className="text-lg font-semibold mb-2">
            Method 3: Set Specific Theme
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => setTheme("light")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                isLight
                  ? "bg-green-500 text-white"
                  : "bg-gray-200 text-gray-800 hover:bg-gray-300"
              }`}
            >
              Set Light
            </button>
            <button
              onClick={() => setTheme("dark")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                isDark
                  ? "bg-green-500 text-white"
                  : "bg-gray-200 text-gray-800 hover:bg-gray-300"
              }`}
            >
              Set Dark
            </button>
          </div>
        </div>

        {/* Conditional rendering example */}
        <div>
          <h3 className="text-lg font-semibold mb-2">
            Conditional Rendering Example
          </h3>
          {isDark ? (
            <div className="p-4 bg-gray-800 text-yellow-400 rounded-lg">
              🌙 Dark mode is active - showing moon content
            </div>
          ) : (
            <div className="p-4 bg-yellow-100 text-yellow-800 rounded-lg">
              ☀️ Light mode is active - showing sun content
            </div>
          )}
        </div>

        {/* Dynamic styling example */}
        <div>
          <h3 className="text-lg font-semibold mb-2">
            Dynamic Styling Example
          </h3>
          <div
            className={`p-4 rounded-lg transition-all duration-300 ${
              isDark
                ? "bg-gradient-to-r from-purple-900 to-blue-900 text-white shadow-lg"
                : "bg-gradient-to-r from-blue-100 to-purple-100 text-gray-800 shadow-md"
            }`}
          >
            <p className="font-medium">This card adapts to the current theme</p>
            <p className="text-sm opacity-80">
              The background, text color, and shadow all change based on the
              theme
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

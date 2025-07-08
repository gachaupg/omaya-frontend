import React, { createContext, useContext, useEffect, useState } from "react";
import { useThemeToggle as useReduxThemeToggle } from "@/features/settings/hooks/useThemeToggle";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  isLight: boolean;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const reduxTheme = useReduxThemeToggle();

  const [theme, setThemeState] = useState<Theme>("light");

  // Sync with Redux theme state
  useEffect(() => {
    if (reduxTheme.mounted && reduxTheme.currentTheme) {
      setThemeState(reduxTheme.currentTheme as Theme);
    }
  }, [reduxTheme.currentTheme, reduxTheme.mounted]);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    // Use Redux theme toggle to update the global state
    reduxTheme.toggleTheme(newTheme as "light" | "dark" | "system");
  };

  const value: ThemeContextType = {
    theme,
    isDark: reduxTheme.isDark,
    isLight: reduxTheme.isLight,
    toggleTheme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

// Convenience hook for just toggling theme
export const useThemeToggle = () => {
  const { toggleTheme, theme, isDark, isLight } = useTheme();
  return { toggleTheme, theme, isDark, isLight };
};

/**
 * useThemeToggle.ts – auto‑generated placeholder
 */

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import { setThemeMode, updateTheme } from "../slices/settingsSlice";
import { ThemeSettings } from "../types";

import { logger } from '@/lib/utils/logger';

export const useThemeToggle = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { theme, updating } = useSelector((state: RootState) => state.settings);
  const [mounted, setMounted] = useState(false);

  // Ensure component is mounted before applying theme
  useEffect(() => {
    setMounted(true);

    // Load theme from localStorage on mount
    try {
      const savedTheme = localStorage.getItem("theme");
      if (savedTheme) {
        const parsedTheme = JSON.parse(savedTheme);
        if (parsedTheme.mode) {
          dispatch(setThemeMode(parsedTheme.mode));
        }
      }
    } catch (error) {
      logger.debug('dashboard', "Failed to load theme from localStorage:", error);
      // Fallback to default theme
      dispatch(setThemeMode("dark"));
    }
  }, [dispatch]);

  // Apply theme to document when theme changes
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    const body = document.body;

    // Remove existing theme classes
    root.classList.remove("light", "dark", "deem");
    body.classList.remove("light", "dark", "deem");

    // Apply current theme
    if (theme.mode === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      root.classList.add(systemTheme);
      body.classList.add(systemTheme);
    } else {
      root.classList.add(theme.mode);
      body.classList.add(theme.mode);
      // For deem mode, also add dark class so Tailwind dark: classes work
      if (theme.mode === "deem") {
        root.classList.add("dark");
        body.classList.add("dark");
      }
    }

    // Apply custom colors if available
    if (theme.primary_color) {
      root.style.setProperty("--primary-color", theme.primary_color);
    }
    if (theme.accent_color) {
      root.style.setProperty("--accent-color", theme.accent_color);
    }
  }, [theme, mounted]);

  // Listen for system theme changes
  useEffect(() => {
    if (theme.mode !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      const root = document.documentElement;
      const body = document.body;

      root.classList.remove("light", "dark", "deem");
      body.classList.remove("light", "dark", "deem");

      const newTheme = mediaQuery.matches ? "dark" : "light";
      root.classList.add(newTheme);
      body.classList.add(newTheme);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme.mode]);

  const toggleTheme = async (mode: "light" | "dark" | "deem" | "system") => {
    try {
      // Update local state immediately for better UX
      dispatch(setThemeMode(mode));

      // Store theme in localStorage for persistence
      const updatedTheme: ThemeSettings = {
        ...theme,
        mode,
      };
      localStorage.setItem("theme", JSON.stringify(updatedTheme));
      
      // Dispatch custom event for same-tab theme changes
      window.dispatchEvent(new CustomEvent("themeChange"));

      // No server API calls - using client-side only
    } catch (error) {
      console.error("Failed to update theme:", error);
      // Revert to previous theme on error
      dispatch(setThemeMode(theme.mode));
    }
  };

  const setCustomColors = async (
    primaryColor?: string,
    accentColor?: string
  ) => {
    try {
      const updatedTheme: ThemeSettings = {
        ...theme,
        primary_color: primaryColor,
        accent_color: accentColor,
      };

      // Store in localStorage
      localStorage.setItem("theme", JSON.stringify(updatedTheme));

      // No server API calls - using client-side only
    } catch (error) {
      console.error("Failed to update custom colors:", error);
    }
  };

  const getCurrentTheme = () => {
    if (!mounted) return "dark"; // Default during SSR
    
    if (theme.mode === "system") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    return theme.mode;
  };

  const isDark = getCurrentTheme() === "dark" || getCurrentTheme() === "deem";
  const isLight = getCurrentTheme() === "light";
  const isDeem = getCurrentTheme() === "deem";

  return {
    theme,
    currentTheme: getCurrentTheme(),
    isDark,
    isLight,
    isDeem,
    isSystem: theme.mode === "system",
    updating,
    mounted,
    toggleTheme,
    setCustomColors,
  };
};

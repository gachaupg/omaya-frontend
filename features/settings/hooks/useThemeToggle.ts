/**
 * useThemeToggle.ts – auto‑generated placeholder
 */

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import { setThemeMode, updateTheme } from "../slices/settingsSlice";
import { ThemeSettings } from "../types";

export const useThemeToggle = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { theme, updating } = useSelector((state: RootState) => state.settings);
  const [mounted, setMounted] = useState(false);

  // Ensure component is mounted before applying theme
  useEffect(() => {
    setMounted(true);
  }, []);

  // Apply theme to document when theme changes
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    const body = document.body;

    // Remove existing theme classes
    root.classList.remove("light", "dark");
    body.classList.remove("light", "dark");

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

      root.classList.remove("light", "dark");
      body.classList.remove("light", "dark");

      const newTheme = mediaQuery.matches ? "dark" : "light";
      root.classList.add(newTheme);
      body.classList.add(newTheme);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme.mode]);

  const toggleTheme = async (mode: "light" | "dark" | "system") => {
    try {
      // Update local state immediately for better UX
      dispatch(setThemeMode(mode));

      // Update server state
      const updatedTheme: ThemeSettings = {
        ...theme,
        mode,
      };

      await dispatch(updateTheme(updatedTheme)).unwrap();
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

      await dispatch(updateTheme(updatedTheme)).unwrap();
    } catch (error) {
      console.error("Failed to update custom colors:", error);
    }
  };

  const getCurrentTheme = () => {
    if (theme.mode === "system") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    return theme.mode;
  };

  const isDark = getCurrentTheme() === "dark";
  const isLight = getCurrentTheme() === "light";

  return {
    theme,
    currentTheme: getCurrentTheme(),
    isDark,
    isLight,
    isSystem: theme.mode === "system",
    updating,
    mounted,
    toggleTheme,
    setCustomColors,
  };
};

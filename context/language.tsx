"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { defaultLocale, type Locale } from "../i18n.config";
import { getStoredLocale, persistLocale } from "@/lib/localePersistence";

type LanguageContextValue = {
  locale: Locale;
  setLocale: (next: Locale) => void;
};

export const LanguageContext = createContext<LanguageContextValue | undefined>(
  undefined
);

type LanguageProviderProps = {
  initialLocale?: Locale;
  children: React.ReactNode;
};

function resolveClientInitialLocale(serverLocale: Locale): Locale {
  return getStoredLocale() ?? serverLocale;
}

export function LanguageProvider({
  initialLocale = defaultLocale,
  children,
}: LanguageProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window === "undefined") {
      return initialLocale;
    }
    return resolveClientInitialLocale(initialLocale);
  });

  // Reconcile client storage after hydration (e.g. localStorage-only from older sessions).
  useEffect(() => {
    const stored = getStoredLocale();
    if (stored && stored !== locale) {
      setLocaleState(stored);
      document.documentElement.lang = stored;
      return;
    }
    persistLocale(locale);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- run once on mount

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    persistLocale(next);
  }, []);

  const value = useMemo<LanguageContextValue>(
    () => ({ locale, setLocale }),
    [locale, setLocale]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return ctx;
}

export function useLanguageOptional() {
  return useContext(LanguageContext);
}

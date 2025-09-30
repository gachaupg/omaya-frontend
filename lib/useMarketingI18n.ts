"use client";

import { useEffect, useMemo, useState } from "react";
import { useLanguageOptional } from "@/context/language";
import { getMarketingMessages, type Messages } from "./getMessages";

type Translator = (key: string, fallback?: string) => string;

export function useMarketingI18n(): {
  t: Translator;
  messages: Messages | null;
} {
  const ctx = useLanguageOptional();
  const locale = ctx?.locale ?? "en";
  const [messages, setMessages] = useState<Messages | null>(null);

  useEffect(() => {
    let isMounted = true;
    getMarketingMessages(locale).then((m) => {
      if (isMounted) setMessages(m);
    });
    return () => {
      isMounted = false;
    };
  }, [locale]);

  const t: Translator = useMemo(() => {
    return (key: string, fallback: string = "") => {
      if (!messages) return fallback;
      return messages[key] ?? fallback;
    };
  }, [messages]);

  return { t, messages };
}

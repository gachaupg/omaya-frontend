"use client";

import { useEffect, useMemo, useState } from "react";
import { useLanguageOptional } from "@/context/language";
import { getMarketingMessages, type Messages } from "./getMessages";

type Translator = (
  key: string,
  fallback?: string,
  params?: Record<string, string>
) => string;

export function useMarketingI18n(): {
  t: Translator;
  messages: Messages | null;
  locale: string;
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
    return (
      key: string,
      fallback: string = "",
      params?: Record<string, string>
    ) => {
      if (!messages) return fallback;
      let message = messages[key] ?? fallback;
      if (params) {
        Object.entries(params).forEach(([paramKey, paramValue]) => {
          message = message.replace(
            new RegExp(`{{${paramKey}}}|{${paramKey}}`, "g"),
            paramValue
          );
        });
      }
      return message;
    };
  }, [messages]);

  return { t, messages, locale };
}

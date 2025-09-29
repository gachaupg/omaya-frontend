"use client";

import { useEffect, useMemo, useState } from "react";
import { useLanguageOptional } from "@/context/language";
import { getMarketsMessages, type Messages } from "./getMessages";

type Translator = (
  key: string,
  fallback?: string,
  params?: Record<string, string>
) => string;

export function useMarketsI18n(): { t: Translator; messages: Messages | null } {
  const ctx = useLanguageOptional();
  const locale = ctx?.locale ?? "en";
  const [messages, setMessages] = useState<Messages | null>(null);

  useEffect(() => {
    let isMounted = true;
    getMarketsMessages(locale).then((m) => {
      if (isMounted) setMessages(m);
    });
    return () => {
      isMounted = false;
    };
  }, [locale]);

  const t: Translator = useMemo(() => {
    function resolvePath(obj: any, path: string): any {
      const parts = path.split(".");
      let cur = obj;
      for (const p of parts) {
        if (cur && typeof cur === "object" && p in cur) {
          cur = cur[p];
        } else {
          return undefined;
        }
      }
      return cur;
    }

    return (
      key: string,
      fallback: string = "",
      params?: Record<string, string>
    ) => {
      if (!messages) return fallback;
      let message = (messages as any)[key];
      if (message === undefined) message = resolvePath(messages, key);
      if (message === undefined || typeof message !== "string")
        message = fallback;
      if (params) {
        Object.entries(params).forEach(([paramKey, paramValue]) => {
          message = message.replace(
            new RegExp(`{{${paramKey}}}`, "g"),
            paramValue
          );
        });
      }
      return message;
    };
  }, [messages]);

  return { t, messages };
}

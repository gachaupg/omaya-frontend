"use client";

import { useEffect, useMemo, useState } from "react";
import { useLanguageOptional } from "@/context/language";
import { getNamespaceMessages, type Messages } from "./getMessages";

type Translator = (key: string, fallback?: string) => string;

export function useI18n(namespace: string): { t: Translator; messages: Messages | null } {
  const ctx = useLanguageOptional();
  const locale = ctx?.locale ?? "en";
  const [messages, setMessages] = useState<Messages | null>(null);

  useEffect(() => {
    let alive = true;
    getNamespaceMessages(namespace, locale).then((m) => {
      if (alive) setMessages(m);
    });
    return () => {
      alive = false;
    };
  }, [namespace, locale]);

  const t: Translator = useMemo(() => {
    return (key: string, fallback: string = "") => {
      if (!messages) return fallback;
      return messages[key] ?? fallback;
    };
  }, [messages]);

  return { t, messages };
}



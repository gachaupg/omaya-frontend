import type { Locale } from "@/i18n.config";

export const LOCALE_COOKIE_NAME = "NEXT_LOCALE";
export const LOCALE_STORAGE_KEY = "omaya_locale";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export function isValidLocale(value: string | null | undefined): value is Locale {
  return value === "en" || value === "so";
}

export function parseLocale(value: string | null | undefined): Locale | null {
  return isValidLocale(value) ? value : null;
}

/** Read persisted locale in the browser (cookie, then localStorage). */
export function getStoredLocale(): Locale | null {
  if (typeof document === "undefined") {
    return null;
  }

  const cookieMatch = document.cookie.match(
    new RegExp(`(?:^|; )${LOCALE_COOKIE_NAME}=([^;]*)`)
  );
  const fromCookie = parseLocale(
    cookieMatch?.[1] ? decodeURIComponent(cookieMatch[1]) : null
  );
  if (fromCookie) {
    return fromCookie;
  }

  try {
    return parseLocale(localStorage.getItem(LOCALE_STORAGE_KEY));
  } catch {
    return null;
  }
}

/** Persist locale for reloads and future visits. */
export function persistLocale(locale: Locale): void {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${LOCALE_COOKIE_NAME}=${locale}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;

  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // ignore quota / private mode
  }

  document.documentElement.lang = locale;
}

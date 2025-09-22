export const locales = ["en", "so"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

// For now, we scope i18n work to marketing pages only.
export const marketingLocales: readonly Locale[] = locales;

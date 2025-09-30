export const locales = ["en", "so"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

// Marketing pages i18n
export const marketingLocales: readonly Locale[] = locales;

// Dashboard i18n
export const dashboardLocales: readonly Locale[] = locales;

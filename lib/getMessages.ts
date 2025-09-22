import { type Locale } from "../i18n.config";

export type Messages = Record<string, string>;

export async function getMarketingMessages(locale: Locale): Promise<Messages> {
  switch (locale) {
    case "so":
      return (await import("../messages/marketing/so.json"))
        .default as Messages;
    case "en":
    default:
      return (await import("../messages/marketing/en.json"))
        .default as Messages;
  }
}

export async function getNamespaceMessages(
  namespace: string,
  locale: Locale
): Promise<Messages> {
  try {
    const mod = await import(
      /* @vite-ignore */ `../messages/${namespace}/${locale}.json`
    );
    return mod.default as Messages;
  } catch {
    return {} as Messages;
  }
}

import { type Locale } from "../i18n.config";

export type Messages = Record<string, any>;

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

export async function getDashboardMessages(locale: Locale): Promise<Messages> {
  switch (locale) {
    case "so":
      return (await import("../messages/dashboard/so.json"))
        .default as Messages;
    case "en":
    default:
      return (await import("../messages/dashboard/en.json"))
        .default as Messages;
  }
}

export async function getP2PMessages(locale: Locale): Promise<Messages> {
  switch (locale) {
    case "so":
      return (await import("../messages/p2p/so.json")).default as Messages;
    case "en":
    default:
      return (await import("../messages/p2p/en.json")).default as Messages;
  }
}

export async function getExpressMessages(locale: Locale): Promise<Messages> {
  switch (locale) {
    case "so":
      return (await import("../messages/express/so.json")).default as Messages;
    case "en":
    default:
      return (await import("../messages/express/en.json")).default as Messages;
  }
}

export async function getSwapMessages(locale: Locale): Promise<Messages> {
  switch (locale) {
    case "so":
      return (await import("../messages/swap/so.json")).default as Messages;
    case "en":
    default:
      return (await import("../messages/swap/en.json")).default as Messages;
  }
}

export async function getSettingsMessages(locale: Locale): Promise<Messages> {
  switch (locale) {
    case "so":
      return (await import("../messages/settings/so.json")).default as Messages;
    case "en":
    default:
      return (await import("../messages/settings/en.json")).default as Messages;
  }
}

export async function getRatesMessages(locale: Locale): Promise<Messages> {
  switch (locale) {
    case "so":
      return (await import("../messages/rates/so.json")).default as Messages;
    case "en":
    default:
      return (await import("../messages/rates/en.json")).default as Messages;
  }
}

export async function getMarketsMessages(locale: Locale): Promise<Messages> {
  switch (locale) {
    case "so":
      return (await import("../messages/markets/so.json")).default as Messages;
    case "en":
    default:
      return (await import("../messages/markets/en.json")).default as Messages;
  }
}

export async function getBlogsMessages(locale: Locale): Promise<Messages> {
  switch (locale) {
    case "so":
      return (await import("../messages/blogs/so.json")).default as Messages;
    case "en":
    default:
      return (await import("../messages/blogs/en.json")).default as Messages;
  }
}

export async function getContactMessages(locale: Locale): Promise<Messages> {
  switch (locale) {
    case "so":
      return (await import("../messages/contact/so.json")).default as Messages;
    case "en":
    default:
      return (await import("../messages/contact/en.json")).default as Messages;
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

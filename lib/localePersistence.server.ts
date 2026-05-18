import { cookies } from "next/headers";
import { defaultLocale } from "@/i18n.config";
import { LOCALE_COOKIE_NAME, parseLocale } from "./localePersistence";

/** Server Components: read locale from request cookies. */
export async function getServerLocale() {
  const cookieStore = await cookies();
  return parseLocale(cookieStore.get(LOCALE_COOKIE_NAME)?.value) ?? defaultLocale;
}

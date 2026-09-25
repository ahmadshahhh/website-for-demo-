import "server-only";
import { cookies, headers } from "next/headers";
import { cache } from "react";
import { defaultLocale, isLocale, LOCALE_COOKIE, type Locale } from "./config";
import { getDictionary } from "./dictionaries";

/** Locale from the remembered cookie, else the browser's preference. */
export const getLocale = cache(async (): Promise<Locale> => {
  const jar = await cookies();
  const fromCookie = jar.get(LOCALE_COOKIE)?.value;
  if (isLocale(fromCookie)) return fromCookie;
  const accept = (await headers()).get("accept-language") ?? "";
  return accept.toLowerCase().startsWith("ar") ? "ar" : defaultLocale;
});

export async function getI18n() {
  const locale = await getLocale();
  return { locale, t: getDictionary(locale) };
}

export const locales = ["en", "ar"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";
export const LOCALE_COOKIE = "sy_locale";

export const isLocale = (v: unknown): v is Locale => v === "en" || v === "ar";
export const dirOf = (l: Locale) => (l === "ar" ? "rtl" : "ltr");

/** Pick the English or Arabic column of a bilingual record. */
export function pick<T extends Record<string, unknown>>(
  row: T,
  base: string,
  locale: Locale,
): string {
  const key = `${base}${locale === "ar" ? "Ar" : "En"}`;
  const fallback = `${base}En`;
  return String(row[key] || row[fallback] || "");
}

/** Replace {name} placeholders. */
export function fmt(template: string, values: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (_, k) => String(values[k] ?? `{${k}}`));
}

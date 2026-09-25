import type { Locale } from "@/lib/i18n/config";

/** 1 KWD = 1000 fils. All prices in the system are integer fils. */
export const FILS_PER_KWD = 1000;

const formatters = new Map<string, Intl.NumberFormat>();

export function formatKWD(fils: number, locale: Locale = "en"): string {
  let f = formatters.get(locale);
  if (!f) {
    f = new Intl.NumberFormat(locale === "ar" ? "ar-KW" : "en-KW", {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    });
    formatters.set(locale, f);
  }
  const amount = f.format(fils / FILS_PER_KWD);
  return locale === "ar" ? `${amount}\u00A0د.ك` : `KWD\u00A0${amount}`;
}

/** Parse a KWD amount typed by an admin ("2.750", "2,750", "3") into fils. */
export function parseKWD(input: string): number | null {
  const cleaned = input.trim().replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d))).replace(",", ".");
  if (!/^\d{1,4}(\.\d{1,3})?$/.test(cleaned)) return null;
  const [whole, frac = ""] = cleaned.split(".");
  return Number(whole) * FILS_PER_KWD + Number(frac.padEnd(3, "0"));
}

export function filsToInput(fils: number): string {
  return (fils / FILS_PER_KWD).toFixed(3);
}

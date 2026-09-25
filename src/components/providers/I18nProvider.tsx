"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";

type I18n = { locale: Locale; t: Dictionary; dir: "ltr" | "rtl" };
const Ctx = createContext<I18n | null>(null);

export function I18nProvider({ locale, t, children }: { locale: Locale; t: Dictionary; children: ReactNode }) {
  return <Ctx.Provider value={{ locale, t, dir: locale === "ar" ? "rtl" : "ltr" }}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useI18n outside I18nProvider");
  return v;
}

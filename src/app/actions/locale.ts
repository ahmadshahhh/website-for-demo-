"use server";

import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { getDb } from "@/db";
import { customers } from "@/db/schema";
import { getCurrentCustomer } from "@/lib/auth/session";
import { isLocale, LOCALE_COOKIE } from "@/lib/i18n/config";

/** Remember the language choice (cookie for everyone, profile for customers). */
export async function setLocaleAction(locale: string) {
  if (!isLocale(locale)) return;
  (await cookies()).set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  const customer = await getCurrentCustomer();
  if (customer) {
    const db = await getDb();
    await db.update(customers).set({ preferredLocale: locale }).where(eq(customers.id, customer.id));
  }
}

"use server";

import { eq, or } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb } from "@/db";
import { customers } from "@/db/schema";
import { getDummyHash, hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, destroySession } from "@/lib/auth/session";
import { getLocale } from "@/lib/i18n/server";
import { normalizePhone } from "@/lib/phone";
import { clientIp, consumeRateLimit, RATE_LIMITS, resetRateLimit } from "@/lib/rate-limit";

export type AuthState = { error?: string; fields?: Record<string, string>; values?: Record<string, string> } | null;

/** Only allow same-site relative redirects after login. */
function safeNext(next: FormDataEntryValue | null) {
  const n = typeof next === "string" ? next : "";
  return n.startsWith("/") && !n.startsWith("//") && !n.startsWith("/admin") ? n : "/account";
}

export async function loginAction(_: AuthState, form: FormData): Promise<AuthState> {
  const identifier = String(form.get("identifier") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const values = { identifier };
  if (!identifier || !password) return { error: "invalid", values };

  const ip = await clientIp();
  if (!(await consumeRateLimit(RATE_LIMITS.login, `${ip}:${identifier}`))) return { error: "rateLimited", values };

  const db = await getDb();
  const phone = normalizePhone(identifier);
  const [c] = await db
    .select()
    .from(customers)
    .where(phone ? or(eq(customers.email, identifier), eq(customers.phone, phone)) : eq(customers.email, identifier));

  // Always run a hash comparison so response time doesn't reveal whether the account exists.
  const ok = await verifyPassword(password, c?.passwordHash ?? (await getDummyHash()));
  if (!c || !ok) return { error: "invalid", values };

  await resetRateLimit(RATE_LIMITS.login, `${ip}:${identifier}`);
  await createSession("customer", c.id);
  redirect(safeNext(form.get("next")));
}

const signupSchema = z.object({
  name: z.string().trim().min(2, "name").max(80, "name"),
  phone: z.string().transform((v, ctx) => normalizePhone(v) ?? (ctx.addIssue({ code: "custom", message: "phone" }), z.NEVER)),
  email: z.email("email").trim().toLowerCase().max(120, "email"),
  password: z.string().min(8, "password").max(200, "password"),
});

export async function signupAction(_: AuthState, form: FormData): Promise<AuthState> {
  const raw = {
    name: String(form.get("name") ?? ""),
    phone: String(form.get("phone") ?? ""),
    email: String(form.get("email") ?? "").trim(),
    password: String(form.get("password") ?? ""),
  };
  const values = { name: raw.name, phone: raw.phone, email: raw.email };
  const parsed = signupSchema.safeParse(raw);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const i of parsed.error.issues) fields[String(i.path[0])] ??= i.message;
    return { fields, values };
  }
  if (!(await consumeRateLimit(RATE_LIMITS.signup, await clientIp()))) return { error: "rateLimited", values };

  const db = await getDb();
  const { name, phone, email, password } = parsed.data;
  const clash = await db
    .select({ id: customers.id })
    .from(customers)
    .where(or(eq(customers.email, email), eq(customers.phone, phone)));
  if (clash.length) return { error: "exists", values };

  let id: number;
  try {
    const [row] = await db
      .insert(customers)
      .values({ name, phone, email, passwordHash: await hashPassword(password), preferredLocale: await getLocale() })
      .returning({ id: customers.id });
    id = row.id;
  } catch {
    return { error: "exists", values };
  }
  await createSession("customer", id);
  redirect(safeNext(form.get("next")));
}

export async function logoutAction() {
  await destroySession("customer");
  redirect("/");
}

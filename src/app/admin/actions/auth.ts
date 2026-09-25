"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { adminUsers } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/guards";
import { getDummyHash, hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, destroyAllSessions, destroySession } from "@/lib/auth/session";
import { clientIp, consumeRateLimit, RATE_LIMITS, resetRateLimit } from "@/lib/rate-limit";

export type AdminFormState = { ok?: boolean; error?: string; email?: string } | null;

export async function adminLoginAction(_: AdminFormState, form: FormData): Promise<AdminFormState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const ip = await clientIp();
  if (!(await consumeRateLimit(RATE_LIMITS.adminLogin, ip))) return { error: "rateLimited", email };
  const db = await getDb();
  const [admin] = email ? await db.select().from(adminUsers).where(eq(adminUsers.email, email)) : [];
  const ok = await verifyPassword(password, admin?.passwordHash ?? (await getDummyHash()));
  if (!admin || !ok || !admin.isActive) return { error: "invalid", email };
  await resetRateLimit(RATE_LIMITS.adminLogin, ip);
  await db.update(adminUsers).set({ lastLoginAt: Date.now() }).where(eq(adminUsers.id, admin.id));
  await createSession("admin", admin.id);
  redirect("/admin");
}

export async function adminLogoutAction() {
  await destroySession("admin");
  redirect("/admin/login");
}

export async function adminChangePasswordAction(_: AdminFormState, form: FormData): Promise<AdminFormState> {
  const me = await requireAdmin();
  const current = String(form.get("current") ?? "");
  const next = String(form.get("next") ?? "");
  if (next.length < 10 || next.length > 200) return { error: "weak" };
  const db = await getDb();
  const [row] = await db.select().from(adminUsers).where(eq(adminUsers.id, me.id));
  if (!row || !(await verifyPassword(current, row.passwordHash))) return { error: "wrong" };
  await db
    .update(adminUsers)
    .set({ passwordHash: await hashPassword(next), mustChangePassword: false })
    .where(eq(adminUsers.id, me.id));
  await destroyAllSessions("admin", me.id);
  await createSession("admin", me.id);
  return { ok: true };
}

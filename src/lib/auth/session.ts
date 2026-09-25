import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, lt } from "drizzle-orm";
import { cookies } from "next/headers";
import { cache } from "react";
import { getDb } from "@/db";
import { adminUsers, customers, sessions } from "@/db/schema";

type SubjectType = "customer" | "admin";

export const SESSION_COOKIE: Record<SubjectType, string> = {
  customer: "sy_session",
  admin: "sy_admin",
};

const TTL_MS: Record<SubjectType, number> = {
  customer: 30 * 24 * 60 * 60_000,
  admin: 12 * 60 * 60_000,
};

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

/** Creates a DB-backed session and sets an httpOnly cookie holding the raw token. */
export async function createSession(subjectType: SubjectType, subjectId: number) {
  const db = await getDb();
  const token = randomBytes(32).toString("base64url");
  const expiresAt = Date.now() + TTL_MS[subjectType];
  await db.insert(sessions).values({ id: hashToken(token), subjectType, subjectId, expiresAt });
  // Housekeeping: drop expired sessions.
  await db.delete(sessions).where(lt(sessions.expiresAt, Date.now()));
  const jar = await cookies();
  jar.set(SESSION_COOKIE[subjectType], token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(expiresAt),
  });
}

export async function destroySession(subjectType: SubjectType) {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE[subjectType])?.value;
  if (token) {
    const db = await getDb();
    await db.delete(sessions).where(eq(sessions.id, hashToken(token)));
  }
  jar.delete(SESSION_COOKIE[subjectType]);
}

/** Revoke every session of a subject (e.g. after a password change). */
export async function destroyAllSessions(subjectType: SubjectType, subjectId: number) {
  const db = await getDb();
  await db
    .delete(sessions)
    .where(and(eq(sessions.subjectType, subjectType), eq(sessions.subjectId, subjectId)));
}

async function readSession(subjectType: SubjectType) {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE[subjectType])?.value;
  if (!token || token.length > 100) return null;
  const db = await getDb();
  const [row] = await db
    .select()
    .from(sessions)
    .where(
      and(
        eq(sessions.id, hashToken(token)),
        eq(sessions.subjectType, subjectType),
        gt(sessions.expiresAt, Date.now()),
      ),
    );
  return row ?? null;
}

export type CurrentCustomer = {
  id: number;
  name: string;
  email: string;
  phone: string;
  preferredLocale: "en" | "ar";
};

/** The signed-in customer for this request, or null. Memoised per request. */
export const getCurrentCustomer = cache(async (): Promise<CurrentCustomer | null> => {
  const session = await readSession("customer");
  if (!session) return null;
  const db = await getDb();
  const [c] = await db
    .select({
      id: customers.id,
      name: customers.name,
      email: customers.email,
      phone: customers.phone,
      preferredLocale: customers.preferredLocale,
    })
    .from(customers)
    .where(eq(customers.id, session.subjectId));
  return c ?? null;
});

export type CurrentAdmin = {
  id: number;
  name: string;
  email: string;
  role: "owner" | "staff";
  mustChangePassword: boolean;
};

export const getCurrentAdmin = cache(async (): Promise<CurrentAdmin | null> => {
  const session = await readSession("admin");
  if (!session) return null;
  const db = await getDb();
  const [a] = await db
    .select({
      id: adminUsers.id,
      name: adminUsers.name,
      email: adminUsers.email,
      role: adminUsers.role,
      isActive: adminUsers.isActive,
      mustChangePassword: adminUsers.mustChangePassword,
    })
    .from(adminUsers)
    .where(eq(adminUsers.id, session.subjectId));
  if (!a || !a.isActive) return null;
  return { id: a.id, name: a.name, email: a.email, role: a.role, mustChangePassword: a.mustChangePassword };
});

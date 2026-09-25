import "server-only";
import { and, eq, lt, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { getDb } from "@/db";
import { rateLimits } from "@/db/schema";

export type RateLimitRule = { bucket: string; limit: number; windowMs: number };

export const RATE_LIMITS = {
  guestTrack: { bucket: "track", limit: 8, windowMs: 15 * 60_000 },
  guestTrackPerOrder: { bucket: "track-order", limit: 5, windowMs: 15 * 60_000 },
  login: { bucket: "login", limit: 10, windowMs: 15 * 60_000 },
  adminLogin: { bucket: "admin-login", limit: 6, windowMs: 15 * 60_000 },
  signup: { bucket: "signup", limit: 5, windowMs: 60 * 60_000 },
  placeOrder: { bucket: "order", limit: 12, windowMs: 15 * 60_000 },
} satisfies Record<string, RateLimitRule>;

/** Best-effort client IP (first X-Forwarded-For hop set by the platform). */
export async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
}

/**
 * Fixed-window counter persisted in the database, so limits hold across
 * restarts and multiple server instances. Returns false when over the limit.
 */
export async function consumeRateLimit(rule: RateLimitRule, key: string): Promise<boolean> {
  const db = await getDb();
  const now = Date.now();
  const windowStart = now - rule.windowMs;
  const [row] = await db
    .insert(rateLimits)
    .values({ bucket: rule.bucket, key, count: 1, windowStart: now })
    .onConflictDoUpdate({
      target: [rateLimits.bucket, rateLimits.key],
      set: {
        count: sql`CASE WHEN ${rateLimits.windowStart} < ${windowStart} THEN 1 ELSE ${rateLimits.count} + 1 END`,
        windowStart: sql`CASE WHEN ${rateLimits.windowStart} < ${windowStart} THEN ${now} ELSE ${rateLimits.windowStart} END`,
      },
    })
    .returning({ count: rateLimits.count });
  // Opportunistic cleanup of stale rows.
  if (Math.random() < 0.02) {
    await db.delete(rateLimits).where(lt(rateLimits.windowStart, now - 24 * 60 * 60_000));
  }
  return row.count <= rule.limit;
}

export async function resetRateLimit(rule: RateLimitRule, key: string) {
  const db = await getDb();
  await db.delete(rateLimits).where(and(eq(rateLimits.bucket, rule.bucket), eq(rateLimits.key, key)));
}

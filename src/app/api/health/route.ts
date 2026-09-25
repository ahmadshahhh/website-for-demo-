import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { databaseConfig } from "@/db/config";

export const dynamic = "force-dynamic";

const EXPECTED_TABLES = [
  "admin_users", "app_secrets", "categories", "customer_addresses", "customers", "delivery_areas",
  "homepage_content", "media", "menu_items", "option_groups", "options", "order_items",
  "order_status_history", "orders", "payments", "popular_items", "rate_limits",
  "restaurant_settings", "sessions",
];

/**
 * Deployment self-check: open /api/health after deploying. Reports which
 * settings are present (never their values), whether the database is
 * reachable, and whether all tables and seed data exist.
 */
export async function GET() {
  const env = {
    DATABASE_URL: !!(process.env.DATABASE_URL || process.env.TURSO_DATABASE_URL),
    DATABASE_AUTH_TOKEN: !!(process.env.DATABASE_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN),
    AUTH_SECRET: (process.env.AUTH_SECRET?.length ?? 0) >= 32,
    ADMIN_PASSWORD: !!process.env.ADMIN_PASSWORD,
    NEXT_PUBLIC_SITE_URL: !!process.env.NEXT_PUBLIC_SITE_URL,
  };
  const result: Record<string, unknown> = { ok: false, env };
  try {
    const cfg = databaseConfig();
    result.database = { kind: cfg.isLocalFile ? "local-file" : "remote", host: cfg.isLocalFile ? null : new URL(cfg.url.replace(/^libsql:/, "https:")).host };
    const { getDb } = await import("@/db");
    const db = await getDb();
    const tables = (await db.all<{ name: string }>(sql`select name from sqlite_master where type = 'table'`)).map((r) => r.name);
    const missing = EXPECTED_TABLES.filter((t) => !tables.includes(t));
    const [counts] = await db.all<{ menuItems: number; categories: number; admins: number; settings: number }>(
      sql`select (select count(*) from menu_items) as menuItems, (select count(*) from categories) as categories, (select count(*) from admin_users) as admins, (select count(*) from restaurant_settings) as settings`,
    );
    result.tables = { expected: EXPECTED_TABLES.length, missing };
    result.data = counts;
    result.ok = missing.length === 0 && Number(counts.settings) > 0 && Number(counts.admins) > 0;
  } catch (err) {
    const e = err as { message?: string; code?: string };
    result.error = { code: e.code ?? null, message: (e.message ?? String(err)).slice(0, 300) };
  }
  return NextResponse.json(result, { status: result.ok ? 200 : 500, headers: { "Cache-Control": "no-store" } });
}

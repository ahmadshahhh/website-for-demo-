import "server-only";
import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { appSecrets } from "@/db/schema";

let cached: Promise<string> | undefined;

/**
 * Server signing secret. Uses AUTH_SECRET when set; otherwise generates a
 * random one on first use and persists it in the database, so a fresh
 * install is secure with zero configuration.
 */
export function getAppSecret(): Promise<string> {
  if (process.env.AUTH_SECRET && process.env.AUTH_SECRET.length >= 32) {
    return Promise.resolve(process.env.AUTH_SECRET);
  }
  cached ??= (async () => {
    const db = await getDb();
    const existing = await db.select().from(appSecrets).where(eq(appSecrets.key, "signing"));
    if (existing[0]) return existing[0].value;
    const value = randomBytes(32).toString("base64url");
    await db.insert(appSecrets).values({ key: "signing", value }).onConflictDoNothing();
    const [row] = await db.select().from(appSecrets).where(eq(appSecrets.key, "signing"));
    return row.value;
  })().catch((e) => {
    cached = undefined;
    throw e;
  });
  return cached;
}

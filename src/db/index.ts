import "server-only";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { createClient, type Client } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { databaseConfig } from "./config";
import * as schema from "./schema";
import { localizeRemoteImages } from "./localize-images";
import { seedDatabase } from "./seed";

export type DB = LibSQLDatabase<typeof schema>;


type GlobalDb = { client?: Client; db?: DB; ready?: Promise<void> };
// Survive hot reloads in development without opening a new connection each time.
const g = globalThis as unknown as { __saffronDb?: GlobalDb };
const state: GlobalDb = (g.__saffronDb ??= {});

function connect(): DB {
  if (state.db) return state.db;
  const { url, authToken, isLocalFile } = databaseConfig();
  if (isLocalFile) {
    mkdirSync(path.dirname(path.resolve(url.slice("file:".length))), { recursive: true });
  }
  state.client = createClient({ url, authToken });
  state.db = drizzle(state.client, { schema });
  return state.db;
}

async function prepare(db: DB) {
  if (state.client && databaseConfig().isLocalFile) {
    // Better concurrency for the local SQLite file.
    await state.client.execute("PRAGMA journal_mode = WAL");
    await state.client.execute("PRAGMA busy_timeout = 5000");
  }
  await state.client?.execute("PRAGMA foreign_keys = ON");
  await migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
  await seedDatabase(db);
  if (process.env.LOCALIZE_IMAGES !== "0") {
    // Fire-and-forget: never block requests on image downloads.
    localizeRemoteImages(db).catch((err) => console.warn("Image localisation skipped:", err?.message));
  }
}

/**
 * Returns the database, applying pending migrations and first-run seed data
 * exactly once per process. Every data access goes through this.
 */
export async function getDb(): Promise<DB> {
  const db = connect();
  state.ready ??= prepare(db).catch((err) => {
    state.ready = undefined;
    throw err;
  });
  await state.ready;
  return db;
}

export { schema };

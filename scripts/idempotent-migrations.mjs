/**
 * Makes generated SQL migrations safe to re-run against a database whose
 * tables already exist (e.g. created with `drizzle-kit push`, or by another
 * server instance that started at the same moment):
 *   CREATE TABLE x        -> CREATE TABLE IF NOT EXISTS x
 *   CREATE [UNIQUE] INDEX -> CREATE [UNIQUE] INDEX IF NOT EXISTS
 * Runs automatically after `npm run db:generate`.
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const dir = path.join(process.cwd(), "drizzle");
for (const file of readdirSync(dir).filter((f) => f.endsWith(".sql"))) {
  const p = path.join(dir, file);
  const before = readFileSync(p, "utf8");
  const after = before
    .replace(/CREATE TABLE (?!IF NOT EXISTS)/g, "CREATE TABLE IF NOT EXISTS ")
    .replace(/CREATE (UNIQUE )?INDEX (?!IF NOT EXISTS)/g, "CREATE $1INDEX IF NOT EXISTS ");
  if (after !== before) {
    writeFileSync(p, after);
    console.log(`made idempotent: ${file}`);
  }
}

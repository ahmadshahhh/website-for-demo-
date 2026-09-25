/**
 * Resolves database settings from the environment. Accepts both this app's
 * names (DATABASE_URL / DATABASE_AUTH_TOKEN) and the names Vercel's Turso
 * integration creates (TURSO_DATABASE_URL / TURSO_AUTH_TOKEN). Values are
 * trimmed and stripped of accidental surrounding quotes.
 */
export const LOCAL_DB_URL = "file:./data/saffron-yard.db";

const clean = (v: string | undefined) => v?.trim().replace(/^["']|["']$/g, "").trim() || undefined;

export function databaseConfig() {
  const url = clean(process.env.DATABASE_URL) ?? clean(process.env.TURSO_DATABASE_URL);
  const authToken = clean(process.env.DATABASE_AUTH_TOKEN) ?? clean(process.env.TURSO_AUTH_TOKEN);
  const serverless = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NETLIFY);

  if (!url) {
    if (serverless) {
      // A local SQLite file cannot work on a read-only, per-request filesystem.
      throw new Error(
        "Database not configured: set DATABASE_URL (libsql://<db>-<org>.turso.io) and DATABASE_AUTH_TOKEN in your hosting environment variables, then redeploy.",
      );
    }
    return { url: LOCAL_DB_URL, authToken: undefined, isLocalFile: true };
  }
  if (!/^(libsql|https?|wss?|file):/.test(url)) {
    throw new Error(`DATABASE_URL must start with libsql://, https:// or file: (got "${url.slice(0, 12)}…")`);
  }
  if (url.startsWith("file:") && serverless) {
    throw new Error("DATABASE_URL points to a local file, which does not persist on serverless hosting. Use your Turso libsql:// URL.");
  }
  if (!url.startsWith("file:") && !authToken && /turso\.io/.test(url)) {
    throw new Error("DATABASE_AUTH_TOKEN is missing: create one with `turso db tokens create <db>` and add it to your environment variables.");
  }
  return { url, authToken, isLocalFile: url.startsWith("file:") };
}

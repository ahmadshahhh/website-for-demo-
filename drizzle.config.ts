import { defineConfig } from "drizzle-kit";

const clean = (v?: string) => v?.trim().replace(/^["']|["']$/g, "").trim() || undefined;

export default defineConfig({
  dialect: "turso",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    // Same variable names the app accepts (see src/db/config.ts).
    url: clean(process.env.DATABASE_URL) ?? clean(process.env.TURSO_DATABASE_URL) ?? "file:./data/saffron-yard.db",
    authToken: clean(process.env.DATABASE_AUTH_TOKEN) ?? clean(process.env.TURSO_AUTH_TOKEN),
  },
});

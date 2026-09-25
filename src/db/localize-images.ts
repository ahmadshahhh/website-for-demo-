import { randomUUID } from "node:crypto";
import { and, eq, like } from "drizzle-orm";
import type { DB } from "./index";
import { homepageContent, media, menuItems } from "./schema";

const REMOTE = "https://unsplash.com/photos/%";

async function download(url: string): Promise<{ buf: Buffer; type: string } | null> {
  try {
    const res = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(20_000) });
    const type = res.headers.get("content-type")?.split(";")[0] ?? "";
    if (!res.ok || !["image/jpeg", "image/png", "image/webp"].includes(type)) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return buf.length > 0 && buf.length <= 8 * 1024 * 1024 ? { buf, type } : null;
  } catch {
    return null;
  }
}

async function store(db: DB, url: string) {
  const file = await download(url);
  if (!file) return null;
  const id = randomUUID();
  await db.insert(media).values({ id, mimeType: file.type, size: file.buf.length, data: file.buf });
  return `/api/media/${id}`;
}

/**
 * Copies the seeded stock photos into the database so the site serves them
 * itself. Runs in the background after start-up; anything that fails (e.g. no
 * internet) keeps its remote URL and is retried on the next start.
 */
export async function localizeRemoteImages(db: DB) {
  const items = await db.select({ id: menuItems.id, url: menuItems.imageUrl }).from(menuItems).where(like(menuItems.imageUrl, REMOTE));
  for (const item of items) {
    const local = await store(db, item.url!);
    // Only replace the URL if nobody changed it meanwhile (admin edit or another instance).
    if (local) await db.update(menuItems).set({ imageUrl: local }).where(and(eq(menuItems.id, item.id), eq(menuItems.imageUrl, item.url!)));
  }
  const [home] = await db.select().from(homepageContent).where(eq(homepageContent.id, 1));
  if (!home) return;
  for (const key of ["heroImageUrl", "aboutImageUrl"] as const) {
    const url = home[key];
    if (!url?.startsWith("https://unsplash.com/photos/")) continue;
    const local = await store(db, url);
    if (local) {
      await db
        .update(homepageContent)
        .set({ [key]: local })
        .where(and(eq(homepageContent.id, 1), eq(homepageContent[key], url)));
    }
  }
}

import "server-only";
import { randomUUID } from "node:crypto";
import { getDb } from "@/db";
import { media } from "@/db/schema";

/** Vercel caps request bodies at 4.5 MB, so keep uploads comfortably below it. */
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

/** Identify an image by its magic bytes — never trust the declared type. SVG is refused (script risk). */
export function sniffImageType(buf: Buffer): "image/jpeg" | "image/png" | "image/webp" | null {
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buf.length > 12 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  return null;
}

/** Store an image in the database and return its public URL. */
export async function saveImage(buf: Buffer): Promise<string | null> {
  const type = sniffImageType(buf);
  if (!type || buf.length > MAX_IMAGE_BYTES) return null;
  const id = randomUUID();
  const db = await getDb();
  await db.insert(media).values({ id, mimeType: type, size: buf.length, data: buf });
  return `/api/media/${id}`;
}

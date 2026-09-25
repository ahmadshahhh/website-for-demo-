import "server-only";
import { cookies } from "next/headers";
import { sign, verifySignature } from "@/lib/crypto";

/**
 * Guest order access. After a guest places an order — or proves ownership on
 * the Track Order page with tracking ID + phone — the tracking ID is added to
 * a signed, httpOnly cookie. Viewing an order requires either this grant or
 * being the signed-in customer who owns it. A tracking ID alone is never enough.
 */
const COOKIE = "sy_orders";
const MAX = 20;

async function read(): Promise<string[]> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return [];
  const dot = raw.lastIndexOf(".");
  if (dot < 0) return [];
  const payload = raw.slice(0, dot);
  if (!(await verifySignature(payload, raw.slice(dot + 1)))) return [];
  try {
    const ids = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return Array.isArray(ids) ? ids.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export async function grantOrderAccess(trackingId: string) {
  const ids = [trackingId, ...(await read()).filter((id) => id !== trackingId)].slice(0, MAX);
  const payload = Buffer.from(JSON.stringify(ids)).toString("base64url");
  (await cookies()).set(COOKIE, `${payload}.${await sign(payload)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function hasOrderGrant(trackingId: string): Promise<boolean> {
  return (await read()).includes(trackingId);
}

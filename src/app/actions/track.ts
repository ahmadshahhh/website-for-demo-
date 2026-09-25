"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { timingSafeEqual } from "node:crypto";
import { getDb } from "@/db";
import { orders } from "@/db/schema";
import { grantOrderAccess } from "@/lib/orders/access";
import { normalizeTrackingId } from "@/lib/orders/tracking";
import { normalizePhone } from "@/lib/phone";
import { clientIp, consumeRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

export type TrackState = { error?: "notFound" | "rateLimited"; trackingId?: string; phone?: string } | null;

/**
 * Guest tracking: tracking ID + phone number must BOTH match. Limited per IP
 * and per tracking ID so neither can be brute-forced. The same generic error
 * is returned whether the ID or the phone was wrong.
 */
export async function verifyTrackingAction(_: TrackState, form: FormData): Promise<TrackState> {
  const rawId = String(form.get("trackingId") ?? "");
  const rawPhone = String(form.get("phone") ?? "");
  const echo = { trackingId: rawId.slice(0, 30), phone: rawPhone.slice(0, 30) };

  const ip = await clientIp();
  if (!(await consumeRateLimit(RATE_LIMITS.guestTrack, ip))) return { error: "rateLimited", ...echo };

  const trackingId = normalizeTrackingId(rawId);
  const phone = normalizePhone(rawPhone);
  if (!trackingId || !phone) return { error: "notFound", ...echo };
  if (!(await consumeRateLimit(RATE_LIMITS.guestTrackPerOrder, trackingId))) return { error: "rateLimited", ...echo };

  const db = await getDb();
  const [order] = await db
    .select({ trackingId: orders.trackingId, phone: orders.phone })
    .from(orders)
    .where(eq(orders.trackingId, trackingId));
  const a = Buffer.from(order?.phone ?? "000000000000");
  const b = Buffer.from(phone);
  const match = !!order && a.length === b.length && timingSafeEqual(a, b);
  if (!match) return { error: "notFound", ...echo };

  await grantOrderAccess(order.trackingId);
  redirect(`/order/${order.trackingId}`);
}

import "server-only";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { orders, payments } from "@/db/schema";
import { getProviderById } from "./registry";

export { siteUrl } from "@/lib/site-url";

/**
 * Apply a verified gateway result. Idempotent: only a pending payment can
 * move to paid/failed, so replayed callbacks are harmless.
 */
export async function applyPaymentResult(paymentId: string, status: "paid" | "failed", providerReference?: string) {
  const db = await getDb();
  const [payment] = await db.select().from(payments).where(eq(payments.id, paymentId));
  if (!payment) return null;
  if (payment.status === "pending" || (payment.status === "failed" && status === "paid")) {
    await db
      .update(payments)
      .set({ status, providerReference: providerReference ?? payment.providerReference, updatedAt: Date.now() })
      .where(and(eq(payments.id, paymentId)));
    await db
      .update(orders)
      .set({ paymentStatus: status, updatedAt: Date.now() })
      .where(eq(orders.id, payment.orderId));
  }
  const [order] = await db.select({ trackingId: orders.trackingId }).from(orders).where(eq(orders.id, payment.orderId));
  return order ?? null;
}

export async function handleProviderCallback(providerId: string, params: URLSearchParams) {
  const provider = getProviderById(providerId);
  if (!provider) return null;
  const result = await provider.verifyCallback(params);
  if (!result) return null;
  return applyPaymentResult(result.paymentId, result.status, result.providerReference);
}

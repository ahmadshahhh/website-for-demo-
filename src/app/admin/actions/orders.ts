"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { ORDER_STATUSES, orders, orderStatusHistory, payments, type OrderStatus } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/guards";
import { canTransition } from "@/lib/orders/status";

export async function updateOrderStatusAction(orderId: number, to: OrderStatus, note?: string) {
  const admin = await requireAdmin();
  if (!Number.isInteger(orderId) || !ORDER_STATUSES.includes(to)) return { ok: false };
  const db = await getDb();
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
  if (!order || !canTransition(order.orderType, order.status, to)) return { ok: false };
  const cleanNote = note?.trim().slice(0, 300) || null;
  await db.transaction(async (tx) => {
    await tx
      .update(orders)
      .set({
        status: to,
        cancelReason: to === "cancelled" ? cleanNote : order.cancelReason,
        seenByStaff: true,
        updatedAt: Date.now(),
      })
      .where(eq(orders.id, orderId));
    await tx.insert(orderStatusHistory).values({ orderId, status: to, note: cleanNote, actor: `admin:${admin.id}` });
    // Cash is collected on delivery / at the counter.
    if (order.paymentMethod === "cash" && (to === "delivered" || to === "picked_up")) {
      await tx.update(orders).set({ paymentStatus: "paid" }).where(eq(orders.id, orderId));
      await tx.update(payments).set({ status: "paid", updatedAt: Date.now() }).where(eq(payments.orderId, orderId));
    }
  });
  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function markOrderSeenAction(orderId: number) {
  await requireAdmin();
  const db = await getDb();
  await db.update(orders).set({ seenByStaff: true }).where(eq(orders.id, orderId));
}

export async function markPaidAction(orderId: number) {
  await requireAdmin();
  const db = await getDb();
  await db.update(orders).set({ paymentStatus: "paid", updatedAt: Date.now() }).where(eq(orders.id, orderId));
  await db.update(payments).set({ status: "paid", updatedAt: Date.now() }).where(eq(payments.orderId, orderId));
  revalidatePath("/admin", "layout");
  return { ok: true };
}

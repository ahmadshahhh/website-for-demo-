import "server-only";
import { randomUUID } from "node:crypto";
import { and, asc, desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import {
  customerAddresses,
  orderItems,
  orders,
  orderStatusHistory,
  payments,
  type OrderStatus,
} from "@/db/schema";
import type { CurrentCustomer } from "@/lib/auth/session";
import { getCurrentCustomer } from "@/lib/auth/session";
import { getDeliveryAreas, getSettings } from "@/lib/data/settings";
import type { Locale } from "@/lib/i18n/config";
import { getOnlineProvider } from "@/lib/payments/registry";
import { siteUrl } from "@/lib/payments/service";
import { grantOrderAccess, hasOrderGrant } from "./access";
import { checkoutSchema, type PlaceOrderResult } from "./checkout-schema";
import { priceCart } from "./pricing";
import { generateTrackingId } from "./tracking";

/**
 * Creates an order. Every value that matters is re-derived on the server:
 * the restaurant must be open, the order type and payment method enabled,
 * each item available, options valid, totals recomputed from the database.
 */
export async function placeOrder(
  raw: unknown,
  customer: CurrentCustomer | null,
  locale: Locale,
): Promise<PlaceOrderResult> {
  const parsed = checkoutSchema.safeParse(raw);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (key === "lines") return { ok: false, error: "empty" };
      fields[key] ??= issue.message;
    }
    return { ok: false, error: "validation", fields };
  }
  const input = parsed.data;
  const db = await getDb();

  // Repeated clicks / retries with the same key return the original order.
  const [existing] = await db
    .select({ trackingId: orders.trackingId, id: orders.id })
    .from(orders)
    .where(eq(orders.idempotencyKey, input.idempotencyKey));
  if (existing) return resumeExisting(existing.id, existing.trackingId, customer);

  const settings = await getSettings();
  if (!settings.isOpen) return { ok: false, error: "closed" };
  if (input.orderType === "delivery" && !settings.deliveryEnabled) return { ok: false, error: "deliveryOff" };
  if (input.orderType === "pickup" && !settings.pickupEnabled) return { ok: false, error: "pickupOff" };
  if (input.paymentMethod === "cash" && !settings.cashEnabled) return { ok: false, error: "paymentOff" };
  if (input.paymentMethod === "online" && !settings.onlinePaymentEnabled) return { ok: false, error: "paymentOff" };

  let area: { id: number; nameEn: string; nameAr: string } | undefined;
  if (input.orderType === "delivery") {
    area = (await getDeliveryAreas({ activeOnly: true })).find((a) => a.id === input.areaId);
    if (!area) return { ok: false, error: "validation", fields: { areaId: "area" } };
  }

  const quote = await priceCart(input.lines, { orderType: input.orderType, areaId: area?.id }, settings);
  const bad = quote.lines.filter((l) => l.problem);
  if (bad.some((l) => l.problem === "unavailable")) {
    return {
      ok: false,
      error: "unavailable",
      items: bad.map((l) => (locale === "ar" ? l.nameAr : l.nameEn)),
    };
  }
  if (bad.length) return { ok: false, error: "options", items: bad.map((l) => (locale === "ar" ? l.nameAr : l.nameEn)) };
  if (quote.lines.length === 0) return { ok: false, error: "empty" };
  if (quote.belowMinimum) return { ok: false, error: "minimum" };

  const trackingId = generateTrackingId();
  const isDelivery = input.orderType === "delivery";
  const paymentId = randomUUID();
  const actor = customer ? `customer:${customer.id}` : "guest";

  let orderId: number;
  try {
    orderId = await db.transaction(async (tx) => {
      const [order] = await tx
        .insert(orders)
        .values({
          trackingId,
          idempotencyKey: input.idempotencyKey,
          customerId: customer?.id ?? null,
          isGuest: !customer,
          customerName: input.name,
          phone: input.phone,
          email: input.email ?? customer?.email ?? null,
          orderType: input.orderType,
          areaId: isDelivery ? area!.id : null,
          areaName: isDelivery ? `${area!.nameEn} / ${area!.nameAr}` : null,
          block: isDelivery ? input.block : null,
          street: isDelivery ? input.street : null,
          building: isDelivery ? input.building : null,
          floor: isDelivery ? input.floor || null : null,
          apartment: isDelivery ? input.apartment || null : null,
          instructions: input.instructions || null,
          subtotal: quote.subtotal,
          deliveryFee: quote.deliveryFee,
          discount: quote.discount,
          total: quote.total,
          paymentMethod: input.paymentMethod,
          paymentStatus: input.paymentMethod === "online" ? "pending" : "unpaid",
          status: "received",
          locale,
        })
        .returning({ id: orders.id });

      await tx.insert(orderItems).values(
        quote.lines.map((l) => ({
          orderId: order.id,
          menuItemId: l.itemId,
          nameEn: l.nameEn,
          nameAr: l.nameAr,
          imageUrl: l.imageUrl,
          unitPrice: l.unitPrice,
          quantity: l.quantity,
          options: l.selectedOptions,
          lineTotal: l.lineTotal,
        })),
      );
      await tx.insert(orderStatusHistory).values({ orderId: order.id, status: "received", actor });
      await tx.insert(payments).values({
        id: paymentId,
        orderId: order.id,
        provider: input.paymentMethod === "online" ? getOnlineProvider().id : "cash",
        method: input.paymentMethod,
        amount: quote.total,
        status: input.paymentMethod === "online" ? "pending" : "unpaid",
      });

      if (customer && isDelivery && input.saveAddress) {
        const hasDefault = await tx
          .select({ id: customerAddresses.id })
          .from(customerAddresses)
          .where(and(eq(customerAddresses.customerId, customer.id), eq(customerAddresses.isDefault, true)));
        await tx.insert(customerAddresses).values({
          customerId: customer.id,
          label: area!.nameEn,
          areaId: area!.id,
          block: input.block!,
          street: input.street!,
          building: input.building!,
          floor: input.floor || null,
          apartment: input.apartment || null,
          instructions: input.instructions || null,
          isDefault: hasDefault.length === 0,
        });
      }
      return order.id;
    });
  } catch (err) {
    // A concurrent duplicate submit lost the race on the unique key.
    const [dupe] = await db
      .select({ trackingId: orders.trackingId, id: orders.id })
      .from(orders)
      .where(eq(orders.idempotencyKey, input.idempotencyKey));
    if (dupe) return resumeExisting(dupe.id, dupe.trackingId, customer);
    console.error("placeOrder failed", err);
    return { ok: false, error: "unknown" };
  }

  if (!customer) await grantOrderAccess(trackingId);

  if (input.paymentMethod === "online") {
    const redirectUrl = await startOnlinePayment(paymentId, orderId);
    if (redirectUrl) return { ok: true, trackingId, redirectUrl };
  }
  return { ok: true, trackingId, redirectUrl: `/order/${trackingId}` };
}

async function resumeExisting(orderId: number, trackingId: string, customer: CurrentCustomer | null): Promise<PlaceOrderResult> {
  if (!customer) await grantOrderAccess(trackingId);
  const db = await getDb();
  const [pending] = await db
    .select()
    .from(payments)
    .where(and(eq(payments.orderId, orderId), eq(payments.status, "pending")));
  if (pending) {
    const url = await startOnlinePayment(pending.id, orderId);
    if (url) return { ok: true, trackingId, redirectUrl: url };
  }
  return { ok: true, trackingId, redirectUrl: `/order/${trackingId}` };
}

/** Ask the configured gateway for a hosted payment page URL. */
export async function startOnlinePayment(paymentId: string, orderId: number): Promise<string | null> {
  const db = await getDb();
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
  const [payment] = await db.select().from(payments).where(eq(payments.id, paymentId));
  if (!order || !payment || payment.status === "paid") return null;
  const provider = getOnlineProvider();
  try {
    const res = await provider.initiate({
      paymentId,
      trackingId: order.trackingId,
      amountFils: payment.amount,
      currency: "KWD",
      locale: order.locale,
      customer: { name: order.customerName, phone: order.phone, email: order.email },
      returnUrl: `${siteUrl()}/order/${order.trackingId}`,
      callbackUrl: `${siteUrl()}/api/payments/${provider.id}/callback`,
    });
    if (res.providerReference) {
      await db.update(payments).set({ providerReference: res.providerReference }).where(eq(payments.id, paymentId));
    }
    return res.redirectUrl;
  } catch (err) {
    console.error("payment initiate failed", err);
    return null;
  }
}

/** Retry payment for an order the viewer is allowed to see. */
export async function retryPayment(trackingId: string): Promise<string | null> {
  const order = await getViewableOrder(trackingId);
  if (!order || order.paymentMethod !== "online" || order.paymentStatus === "paid" || order.status === "cancelled") {
    return null;
  }
  const db = await getDb();
  const paymentId = randomUUID();
  await db.insert(payments).values({
    id: paymentId,
    orderId: order.id,
    provider: getOnlineProvider().id,
    method: "online",
    amount: order.total,
    status: "pending",
  });
  await db.update(orders).set({ paymentStatus: "pending" }).where(eq(orders.id, order.id));
  return startOnlinePayment(paymentId, order.id);
}

export type OrderView = NonNullable<Awaited<ReturnType<typeof loadOrder>>>;

async function loadOrder(where: ReturnType<typeof eq>) {
  const db = await getDb();
  const [order] = await db.select().from(orders).where(where);
  if (!order) return null;
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id)).orderBy(asc(orderItems.id));
  const history = await db
    .select()
    .from(orderStatusHistory)
    .where(eq(orderStatusHistory.orderId, order.id))
    .orderBy(asc(orderStatusHistory.createdAt), asc(orderStatusHistory.id));
  return { ...order, items, history };
}

export const loadOrderByTracking = (trackingId: string) => loadOrder(eq(orders.trackingId, trackingId));
export const loadOrderById = (id: number) => loadOrder(eq(orders.id, id));

/**
 * The only way the storefront reads an order: the signed-in owner, or a
 * browser holding a signed grant for that tracking ID. Anyone else gets null.
 */
export async function getViewableOrder(trackingId: string) {
  const order = await loadOrderByTracking(trackingId);
  if (!order) return null;
  const customer = await getCurrentCustomer();
  if (customer && order.customerId === customer.id) return order;
  if (await hasOrderGrant(trackingId)) return order;
  return null;
}

export async function getCustomerOrders(customerId: number) {
  const db = await getDb();
  const rows = await db.select().from(orders).where(eq(orders.customerId, customerId)).orderBy(desc(orders.createdAt));
  const counts = new Map<number, number>();
  for (const r of rows) {
    const items = await db.select({ q: orderItems.quantity }).from(orderItems).where(eq(orderItems.orderId, r.id));
    counts.set(r.id, items.reduce((s, i) => s + i.q, 0));
  }
  return rows.map((r) => ({ ...r, itemCount: counts.get(r.id) ?? 0 }));
}

export type { OrderStatus };

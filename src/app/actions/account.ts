"use server";

import { and, eq, ne, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "@/db";
import { customerAddresses, customers, orderItems, orders } from "@/db/schema";
import { requireCustomer } from "@/lib/auth/guards";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, destroyAllSessions } from "@/lib/auth/session";
import type { CartLine } from "@/lib/cart/types";
import { lineKey } from "@/lib/cart/types";
import { getItemsByIds } from "@/lib/data/menu";
import { getDeliveryAreas } from "@/lib/data/settings";
import { normalizePhone } from "@/lib/phone";

export type FormState = { ok?: boolean; error?: string; fields?: Record<string, string> } | null;

const profileSchema = z.object({
  name: z.string().trim().min(2, "name").max(80, "name"),
  phone: z.string().transform((v, ctx) => normalizePhone(v) ?? (ctx.addIssue({ code: "custom", message: "phone" }), z.NEVER)),
  email: z.email("email").trim().toLowerCase().max(120, "email"),
});

export async function updateProfileAction(_: FormState, form: FormData): Promise<FormState> {
  const me = await requireCustomer();
  const parsed = profileSchema.safeParse({ name: form.get("name"), phone: form.get("phone"), email: form.get("email") });
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const i of parsed.error.issues) fields[String(i.path[0])] ??= i.message;
    return { fields };
  }
  const db = await getDb();
  const clash = await db
    .select({ id: customers.id })
    .from(customers)
    .where(and(ne(customers.id, me.id), or(eq(customers.email, parsed.data.email), eq(customers.phone, parsed.data.phone))));
  if (clash.length) return { error: "exists" };
  await db.update(customers).set({ ...parsed.data, updatedAt: Date.now() }).where(eq(customers.id, me.id));
  revalidatePath("/account");
  return { ok: true };
}

export async function changePasswordAction(_: FormState, form: FormData): Promise<FormState> {
  const me = await requireCustomer();
  const current = String(form.get("current") ?? "");
  const next = String(form.get("next") ?? "");
  if (next.length < 8 || next.length > 200) return { fields: { next: "password" } };
  const db = await getDb();
  const [row] = await db.select({ hash: customers.passwordHash }).from(customers).where(eq(customers.id, me.id));
  if (!row || !(await verifyPassword(current, row.hash))) return { error: "wrongPassword" };
  await db.update(customers).set({ passwordHash: await hashPassword(next), updatedAt: Date.now() }).where(eq(customers.id, me.id));
  // Sign out every other device, then keep this one signed in.
  await destroyAllSessions("customer", me.id);
  await createSession("customer", me.id);
  return { ok: true };
}

const addressSchema = z.object({
  label: z.string().trim().min(1).max(40),
  areaId: z.coerce.number().int().positive(),
  block: z.string().trim().min(1, "block").max(20),
  street: z.string().trim().min(1, "street").max(80),
  building: z.string().trim().min(1, "building").max(40),
  floor: z.string().trim().max(10).optional(),
  apartment: z.string().trim().max(10).optional(),
  instructions: z.string().trim().max(300).optional(),
});

export async function addAddressAction(_: FormState, form: FormData): Promise<FormState> {
  const me = await requireCustomer();
  const parsed = addressSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const i of parsed.error.issues) fields[String(i.path[0])] ??= i.message || "required";
    return { fields };
  }
  const areas = await getDeliveryAreas({ activeOnly: true });
  if (!areas.some((a) => a.id === parsed.data.areaId)) return { fields: { areaId: "area" } };
  const db = await getDb();
  const existing = await db.select({ id: customerAddresses.id }).from(customerAddresses).where(eq(customerAddresses.customerId, me.id));
  if (existing.length >= 10) return { error: "limit" };
  await db.insert(customerAddresses).values({
    ...parsed.data,
    floor: parsed.data.floor || null,
    apartment: parsed.data.apartment || null,
    instructions: parsed.data.instructions || null,
    customerId: me.id,
    isDefault: existing.length === 0,
  });
  revalidatePath("/account");
  return { ok: true };
}

export async function deleteAddressAction(id: number) {
  const me = await requireCustomer();
  const db = await getDb();
  // Scoped by customer id: a customer can only ever touch their own rows.
  await db.delete(customerAddresses).where(and(eq(customerAddresses.id, id), eq(customerAddresses.customerId, me.id)));
  revalidatePath("/account");
}

export async function setDefaultAddressAction(id: number) {
  const me = await requireCustomer();
  const db = await getDb();
  const [own] = await db
    .select({ id: customerAddresses.id })
    .from(customerAddresses)
    .where(and(eq(customerAddresses.id, id), eq(customerAddresses.customerId, me.id)));
  if (!own) return;
  await db.update(customerAddresses).set({ isDefault: false }).where(eq(customerAddresses.customerId, me.id));
  await db.update(customerAddresses).set({ isDefault: true }).where(eq(customerAddresses.id, id));
  revalidatePath("/account");
}

/** Build cart lines from one of the customer's past orders (available items only). */
export async function reorderAction(trackingId: string): Promise<CartLine[]> {
  const me = await requireCustomer();
  const db = await getDb();
  const [order] = await db
    .select({ id: orders.id })
    .from(orders)
    .where(and(eq(orders.trackingId, trackingId), eq(orders.customerId, me.id)));
  if (!order) return [];
  const rows = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
  const items = await getItemsByIds(rows.map((r) => r.menuItemId).filter((x): x is number => x !== null));
  const byId = new Map(items.map((i) => [i.id, i]));
  const lines: CartLine[] = [];
  for (const r of rows) {
    const item = r.menuItemId ? byId.get(r.menuItemId) : undefined;
    if (!item || !item.isAvailable || item.slug === "") continue;
    const validOptionIds = new Set(item.optionGroups.flatMap((g) => g.options.filter((o) => o.isAvailable).map((o) => o.id)));
    const optionIds = r.options.map((o) => o.id).filter((id) => validOptionIds.has(id));
    const opts = item.optionGroups.flatMap((g) => g.options).filter((o) => optionIds.includes(o.id));
    lines.push({
      key: lineKey(item.id, optionIds),
      itemId: item.id,
      quantity: r.quantity,
      optionIds,
      slug: item.slug,
      nameEn: item.nameEn,
      nameAr: item.nameAr,
      imageUrl: item.imageUrl,
      unitPrice: item.price + opts.reduce((s, o) => s + o.priceDelta, 0),
      optionNamesEn: opts.map((o) => o.nameEn),
      optionNamesAr: opts.map((o) => o.nameAr),
    });
  }
  return lines;
}

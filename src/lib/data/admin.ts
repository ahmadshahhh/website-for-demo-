import "server-only";
import { and, asc, count, desc, eq, gte, inArray, like, or, sql, sum } from "drizzle-orm";
import { getDb } from "@/db";
import { categories, customerAddresses, customers, menuItems, orderItems, orders, popularItems, type OrderStatus } from "@/db/schema";
import { ACTIVE_STATUSES } from "@/lib/orders/status";

const DAY = 86_400_000;
const KW_OFFSET = 3 * 3_600_000; // Kuwait is UTC+3 all year.
export const startOfTodayKW = () => Math.floor((Date.now() + KW_OFFSET) / DAY) * DAY - KW_OFFSET;

export async function getDashboardStats() {
  const db = await getDb();
  const today = startOfTodayKW();
  const [[n], [a], [td], [done], [sales], [items], [unavail], [pop]] = await Promise.all([
    db.select({ n: count() }).from(orders).where(eq(orders.status, "received")),
    db.select({ n: count() }).from(orders).where(inArray(orders.status, ACTIVE_STATUSES)),
    db.select({ n: count() }).from(orders).where(gte(orders.createdAt, today)),
    db.select({ n: count() }).from(orders).where(and(gte(orders.createdAt, today), inArray(orders.status, ["delivered", "picked_up"]))),
    db.select({ s: sum(orders.total) }).from(orders).where(and(gte(orders.createdAt, today), sql`${orders.status} != 'cancelled'`)),
    db.select({ n: count() }).from(menuItems),
    db.select({ n: count() }).from(menuItems).where(eq(menuItems.isAvailable, false)),
    db.select({ n: count() }).from(popularItems),
  ]);
  return {
    newOrders: n.n,
    activeOrders: a.n,
    todayOrders: td.n,
    completedToday: done.n,
    todaySales: Number(sales.s ?? 0),
    totalItems: items.n,
    unavailableItems: unavail.n,
    popularItems: pop.n,
  };
}

export type OrderTab = "new" | "active" | "completed" | "cancelled" | "all";

const TAB_STATUSES: Record<Exclude<OrderTab, "all">, OrderStatus[]> = {
  new: ["received"],
  active: ACTIVE_STATUSES,
  completed: ["delivered", "picked_up"],
  cancelled: ["cancelled"],
};

export async function listOrders(tab: OrderTab, q?: string, limit = 100) {
  const db = await getDb();
  const conds = [];
  if (tab !== "all") conds.push(inArray(orders.status, TAB_STATUSES[tab]));
  const term = q?.trim().slice(0, 60);
  if (term) {
    const digits = term.replace(/\D/g, "");
    conds.push(
      or(
        like(orders.trackingId, `%${term.toUpperCase()}%`),
        like(orders.customerName, `%${term}%`),
        ...(digits.length >= 3 ? [like(orders.phone, `%${digits}%`)] : []),
        ...(/^\d+$/.test(term) ? [eq(orders.id, Number(term))] : []),
      ),
    );
  }
  const rows = await db
    .select()
    .from(orders)
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(tab === "new" || tab === "active" ? asc(orders.createdAt) : desc(orders.createdAt))
    .limit(limit);
  const ids = rows.map((r) => r.id);
  const counts = ids.length
    ? await db
        .select({ orderId: orderItems.orderId, q: sum(orderItems.quantity) })
        .from(orderItems)
        .where(inArray(orderItems.orderId, ids))
        .groupBy(orderItems.orderId)
    : [];
  const byId = new Map(counts.map((c) => [c.orderId, Number(c.q ?? 0)]));
  return rows.map((r) => ({ ...r, itemCount: byId.get(r.id) ?? 0 }));
}

export async function getTabCounts() {
  const db = await getDb();
  const rows = await db.select({ status: orders.status, n: count() }).from(orders).groupBy(orders.status);
  const by = new Map(rows.map((r) => [r.status, r.n]));
  const total = (s: OrderStatus[]) => s.reduce((acc, x) => acc + (by.get(x) ?? 0), 0);
  return {
    new: total(TAB_STATUSES.new),
    active: total(TAB_STATUSES.active),
    completed: total(TAB_STATUSES.completed),
    cancelled: total(TAB_STATUSES.cancelled),
    all: rows.reduce((a, r) => a + r.n, 0),
  };
}

export async function getOrderPulse() {
  const db = await getDb();
  const [[unseen], [latest]] = await Promise.all([
    db.select({ n: count() }).from(orders).where(eq(orders.seenByStaff, false)),
    db.select({ id: orders.id }).from(orders).orderBy(desc(orders.id)).limit(1),
  ]);
  return { unseen: unseen.n, latestId: latest?.id ?? 0 };
}

export async function getPopularSales(limit = 5) {
  const db = await getDb();
  return db
    .select({ nameEn: orderItems.nameEn, nameAr: orderItems.nameAr, qty: sum(orderItems.quantity) })
    .from(orderItems)
    .innerJoin(orders, eq(orders.id, orderItems.orderId))
    .where(sql`${orders.status} != 'cancelled'`)
    .groupBy(orderItems.nameEn, orderItems.nameAr)
    .orderBy(desc(sum(orderItems.quantity)))
    .limit(limit);
}

export async function listAdminMenu() {
  const db = await getDb();
  const [items, cats, pops] = await Promise.all([
    db.select().from(menuItems).orderBy(asc(menuItems.sortOrder), asc(menuItems.id)),
    db.select().from(categories).orderBy(asc(categories.sortOrder), asc(categories.id)),
    db.select().from(popularItems).orderBy(asc(popularItems.sortOrder)),
  ]);
  return { items, categories: cats, popular: pops };
}

/** Customers with order aggregates. Password hashes are never selected. */
export async function listCustomers(q?: string) {
  const db = await getDb();
  const term = q?.trim().slice(0, 60);
  const rows = await db
    .select({ id: customers.id, name: customers.name, phone: customers.phone, email: customers.email, createdAt: customers.createdAt })
    .from(customers)
    .where(term ? or(like(customers.name, `%${term}%`), like(customers.email, `%${term.toLowerCase()}%`), like(customers.phone, `%${term.replace(/\D/g, "") || term}%`)) : undefined)
    .orderBy(desc(customers.createdAt))
    .limit(200);
  const stats = rows.length
    ? await db
        .select({ customerId: orders.customerId, n: count(), spent: sum(orders.total), last: sql<number>`max(${orders.createdAt})` })
        .from(orders)
        .where(and(inArray(orders.customerId, rows.map((r) => r.id)), sql`${orders.status} != 'cancelled'`))
        .groupBy(orders.customerId)
    : [];
  const by = new Map(stats.map((s) => [s.customerId, s]));
  return rows.map((r) => ({ ...r, orders: by.get(r.id)?.n ?? 0, spent: Number(by.get(r.id)?.spent ?? 0), lastOrder: by.get(r.id)?.last ?? null }));
}

/** Guest orders grouped by phone number. */
export async function listGuests(q?: string) {
  const db = await getDb();
  const term = q?.trim().slice(0, 60);
  return db
    .select({
      phone: orders.phone,
      name: sql<string>`max(${orders.customerName})`,
      n: count(),
      spent: sum(orders.total),
      last: sql<number>`max(${orders.createdAt})`,
    })
    .from(orders)
    .where(and(eq(orders.isGuest, true), term ? or(like(orders.customerName, `%${term}%`), like(orders.phone, `%${term.replace(/\D/g, "") || term}%`)) : undefined))
    .groupBy(orders.phone)
    .orderBy(desc(sql`max(${orders.createdAt})`))
    .limit(200);
}

export async function getCustomerDetail(id: number) {
  const db = await getDb();
  const [c] = await db
    .select({ id: customers.id, name: customers.name, phone: customers.phone, email: customers.email, createdAt: customers.createdAt, preferredLocale: customers.preferredLocale })
    .from(customers)
    .where(eq(customers.id, id));
  if (!c) return null;
  const [addresses, history] = await Promise.all([
    db.select().from(customerAddresses).where(eq(customerAddresses.customerId, id)),
    db.select().from(orders).where(eq(orders.customerId, id)).orderBy(desc(orders.createdAt)).limit(100),
  ]);
  return { ...c, addresses, history };
}

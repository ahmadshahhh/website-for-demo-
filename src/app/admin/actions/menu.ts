"use server";

import { and, asc, eq, isNull, max } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb } from "@/db";
import { categories, menuItems, optionGroups, options, popularItems } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/guards";
import { saveImage } from "@/lib/media";
import { parseKWD } from "@/lib/money";

export type MenuFormState = { ok?: boolean; error?: string; fields?: Record<string, string> } | null;

const refresh = () => revalidatePath("/", "layout");

function slugify(s: string) {
  return (
    s
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || `item-${Date.now().toString(36)}`
  );
}

/** Returns the image URL to store: uploaded file > URL field > keep > remove. */
async function resolveImage(form: FormData, field: string, current: string | null): Promise<string | null | "bad"> {
  const file = form.get(`${field}File`);
  if (file instanceof File && file.size > 0) {
    const url = await saveImage(Buffer.from(await file.arrayBuffer()));
    return url ?? "bad";
  }
  if (form.get(`${field}Remove`) === "1") return null;
  const url = String(form.get(`${field}Url`) ?? "").trim();
  if (url) {
    if (url.startsWith("/") && !url.startsWith("//")) return url;
    try {
      const u = new URL(url);
      return u.protocol === "https:" ? u.toString() : "bad";
    } catch {
      return "bad";
    }
  }
  return current;
}

const itemSchema = z.object({
  nameEn: z.string().trim().min(1, "required").max(80),
  nameAr: z.string().trim().min(1, "required").max(80),
  descriptionEn: z.string().trim().max(500),
  descriptionAr: z.string().trim().max(500),
  categoryId: z.coerce.number().int().nonnegative(),
  tags: z.string().trim().max(80),
});

export async function saveMenuItemAction(id: number | null, _: MenuFormState, form: FormData): Promise<MenuFormState> {
  await requireAdmin({ ownerOnly: true });
  const parsed = itemSchema.safeParse({
    nameEn: form.get("nameEn"),
    nameAr: form.get("nameAr"),
    descriptionEn: form.get("descriptionEn") ?? "",
    descriptionAr: form.get("descriptionAr") ?? "",
    categoryId: form.get("categoryId") || 0,
    tags: form.get("tags") ?? "",
  });
  const fields: Record<string, string> = {};
  if (!parsed.success) for (const i of parsed.error.issues) fields[String(i.path[0])] ??= "required";
  const price = parseKWD(String(form.get("price") ?? ""));
  if (price === null || price <= 0) fields.price = "badPrice";
  if (Object.keys(fields).length || !parsed.success) return { fields };

  const db = await getDb();
  const [existing] = id ? await db.select().from(menuItems).where(eq(menuItems.id, id)) : [];
  if (id && !existing) return { error: "notFound" };
  const imageUrl = await resolveImage(form, "image", existing?.imageUrl ?? null);
  if (imageUrl === "bad") return { fields: { image: "badImage" } };

  const d = parsed.data;
  const values = {
    nameEn: d.nameEn,
    nameAr: d.nameAr,
    descriptionEn: d.descriptionEn,
    descriptionAr: d.descriptionAr,
    categoryId: d.categoryId || null,
    tags: d.tags
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean)
      .join(","),
    price: price!,
    imageUrl,
    isAvailable: form.get("isAvailable") === "on",
    updatedAt: Date.now(),
  };

  let itemId = id;
  if (existing) {
    await db.update(menuItems).set(values).where(eq(menuItems.id, existing.id));
  } else {
    let slug = slugify(d.nameEn);
    const clash = await db.select({ id: menuItems.id }).from(menuItems).where(eq(menuItems.slug, slug));
    if (clash.length) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
    const [{ m }] = await db.select({ m: max(menuItems.sortOrder) }).from(menuItems);
    const [row] = await db.insert(menuItems).values({ ...values, slug, sortOrder: (m ?? 0) + 1 }).returning({ id: menuItems.id });
    itemId = row.id;
  }

  const wantPopular = form.get("isPopular") === "on";
  const [pop] = await db.select().from(popularItems).where(eq(popularItems.menuItemId, itemId!));
  if (wantPopular && !pop) {
    const [{ m }] = await db.select({ m: max(popularItems.sortOrder) }).from(popularItems);
    await db.insert(popularItems).values({ menuItemId: itemId!, sortOrder: (m ?? 0) + 1 });
  } else if (!wantPopular && pop) {
    await db.delete(popularItems).where(eq(popularItems.menuItemId, itemId!));
  }

  refresh();
  if (!existing) redirect(`/admin/menu/${itemId}?created=1`);
  return { ok: true };
}

export async function deleteMenuItemAction(id: number) {
  await requireAdmin({ ownerOnly: true });
  const db = await getDb();
  // Order history keeps its own snapshot (order_items.menu_item_id is set to NULL).
  await db.delete(menuItems).where(eq(menuItems.id, id));
  refresh();
  redirect("/admin/menu?deleted=1");
}

export async function toggleAvailabilityAction(id: number) {
  await requireAdmin();
  const db = await getDb();
  const [item] = await db.select({ a: menuItems.isAvailable }).from(menuItems).where(eq(menuItems.id, id));
  if (!item) return;
  await db.update(menuItems).set({ isAvailable: !item.a, updatedAt: Date.now() }).where(eq(menuItems.id, id));
  refresh();
}

/** Swap an item with its neighbour inside the same category. */
export async function moveMenuItemAction(id: number, dir: "up" | "down") {
  await requireAdmin({ ownerOnly: true });
  const db = await getDb();
  const [item] = await db.select().from(menuItems).where(eq(menuItems.id, id));
  if (!item) return;
  const siblings = await db
    .select({ id: menuItems.id, sortOrder: menuItems.sortOrder })
    .from(menuItems)
    .where(item.categoryId === null ? isNull(menuItems.categoryId) : eq(menuItems.categoryId, item.categoryId))
    .orderBy(asc(menuItems.sortOrder), asc(menuItems.id));
  await swapInList(siblings, id, dir, (rid, order) => db.update(menuItems).set({ sortOrder: order }).where(eq(menuItems.id, rid)));
  refresh();
}

/** Normalise sort orders to 0..n then swap the target with its neighbour. */
async function swapInList(
  list: { id: number }[],
  id: number,
  dir: "up" | "down",
  write: (id: number, order: number) => Promise<unknown>,
) {
  const i = list.findIndex((x) => x.id === id);
  const j = dir === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= list.length) return;
  const next = [...list];
  [next[i], next[j]] = [next[j], next[i]];
  for (let k = 0; k < next.length; k++) await write(next[k].id, k);
}

/* ───────── Categories ───────── */

const catSchema = z.object({ nameEn: z.string().trim().min(1).max(60), nameAr: z.string().trim().min(1).max(60) });

export async function saveCategoryAction(id: number | null, _: MenuFormState, form: FormData): Promise<MenuFormState> {
  await requireAdmin({ ownerOnly: true });
  const parsed = catSchema.safeParse({ nameEn: form.get("nameEn"), nameAr: form.get("nameAr") });
  if (!parsed.success) return { error: "required" };
  const db = await getDb();
  if (id) {
    await db.update(categories).set({ ...parsed.data, isActive: form.get("isActive") === "on" }).where(eq(categories.id, id));
  } else {
    let slug = slugify(parsed.data.nameEn);
    const clash = await db.select({ id: categories.id }).from(categories).where(eq(categories.slug, slug));
    if (clash.length) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
    const [{ m }] = await db.select({ m: max(categories.sortOrder) }).from(categories);
    await db.insert(categories).values({ ...parsed.data, slug, sortOrder: (m ?? 0) + 1 });
  }
  refresh();
  return { ok: true };
}

export async function deleteCategoryAction(id: number) {
  await requireAdmin({ ownerOnly: true });
  const db = await getDb();
  await db.delete(categories).where(eq(categories.id, id));
  refresh();
}

export async function moveCategoryAction(id: number, dir: "up" | "down") {
  await requireAdmin({ ownerOnly: true });
  const db = await getDb();
  const list = await db.select({ id: categories.id }).from(categories).orderBy(asc(categories.sortOrder), asc(categories.id));
  await swapInList(list, id, dir, (rid, order) => db.update(categories).set({ sortOrder: order }).where(eq(categories.id, rid)));
  refresh();
}

/* ───────── Popular ───────── */

export async function addPopularAction(menuItemId: number) {
  await requireAdmin({ ownerOnly: true });
  const db = await getDb();
  const [{ m }] = await db.select({ m: max(popularItems.sortOrder) }).from(popularItems);
  await db.insert(popularItems).values({ menuItemId, sortOrder: (m ?? 0) + 1 }).onConflictDoNothing();
  refresh();
}

export async function removePopularAction(menuItemId: number) {
  await requireAdmin({ ownerOnly: true });
  const db = await getDb();
  await db.delete(popularItems).where(eq(popularItems.menuItemId, menuItemId));
  refresh();
}

export async function movePopularAction(menuItemId: number, dir: "up" | "down") {
  await requireAdmin({ ownerOnly: true });
  const db = await getDb();
  const list = (await db.select().from(popularItems).orderBy(asc(popularItems.sortOrder))).map((p) => ({ id: p.menuItemId }));
  await swapInList(list, menuItemId, dir, (rid, order) => db.update(popularItems).set({ sortOrder: order }).where(eq(popularItems.menuItemId, rid)));
  refresh();
}

/* ───────── Option groups (customisation) ───────── */

export async function addOptionGroupAction(menuItemId: number, _: MenuFormState, form: FormData): Promise<MenuFormState> {
  await requireAdmin({ ownerOnly: true });
  const nameEn = String(form.get("nameEn") ?? "").trim().slice(0, 60);
  const nameAr = String(form.get("nameAr") ?? "").trim().slice(0, 60);
  const minSelect = Math.max(0, Math.min(10, Number(form.get("minSelect") ?? 0) | 0));
  const maxSelect = Math.max(1, Math.min(10, Number(form.get("maxSelect") ?? 1) | 0));
  if (!nameEn || !nameAr || minSelect > maxSelect) return { error: "required" };
  const db = await getDb();
  await db.insert(optionGroups).values({ menuItemId, nameEn, nameAr, minSelect, maxSelect });
  refresh();
  return { ok: true };
}

export async function deleteOptionGroupAction(groupId: number) {
  await requireAdmin({ ownerOnly: true });
  const db = await getDb();
  await db.delete(optionGroups).where(eq(optionGroups.id, groupId));
  refresh();
}

export async function addOptionAction(groupId: number, _: MenuFormState, form: FormData): Promise<MenuFormState> {
  await requireAdmin({ ownerOnly: true });
  const nameEn = String(form.get("nameEn") ?? "").trim().slice(0, 60);
  const nameAr = String(form.get("nameAr") ?? "").trim().slice(0, 60);
  const priceRaw = String(form.get("price") ?? "").trim();
  const priceDelta = priceRaw ? parseKWD(priceRaw) : 0;
  if (!nameEn || !nameAr || priceDelta === null) return { error: "required" };
  const db = await getDb();
  const [{ m }] = await db.select({ m: max(options.sortOrder) }).from(options).where(eq(options.groupId, groupId));
  await db.insert(options).values({ groupId, nameEn, nameAr, priceDelta, sortOrder: (m ?? 0) + 1 });
  refresh();
  return { ok: true };
}

export async function deleteOptionAction(optionId: number) {
  await requireAdmin({ ownerOnly: true });
  const db = await getDb();
  await db.delete(options).where(eq(options.id, optionId));
  refresh();
}

export async function toggleOptionAction(optionId: number) {
  await requireAdmin();
  const db = await getDb();
  const [o] = await db.select({ a: options.isAvailable }).from(options).where(and(eq(options.id, optionId)));
  if (o) await db.update(options).set({ isAvailable: !o.a }).where(eq(options.id, optionId));
  refresh();
}

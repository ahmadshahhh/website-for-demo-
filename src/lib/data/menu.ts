import "server-only";
import { and, asc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { categories, menuItems, optionGroups, options, popularItems } from "@/db/schema";

export type OptionDTO = {
  id: number;
  nameEn: string;
  nameAr: string;
  priceDelta: number;
  isAvailable: boolean;
};
export type OptionGroupDTO = {
  id: number;
  nameEn: string;
  nameAr: string;
  minSelect: number;
  maxSelect: number;
  options: OptionDTO[];
};
export type MenuItemDTO = {
  id: number;
  slug: string;
  categoryId: number | null;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  price: number;
  imageUrl: string | null;
  isAvailable: boolean;
  tags: string[];
  optionGroups: OptionGroupDTO[];
};
export type CategoryDTO = { id: number; slug: string; nameEn: string; nameAr: string };

export async function getCategories(opts: { activeOnly?: boolean } = { activeOnly: true }) {
  const db = await getDb();
  const rows = await db.select().from(categories).orderBy(asc(categories.sortOrder), asc(categories.id));
  return (opts.activeOnly ? rows.filter((c) => c.isActive) : rows).map(
    (c): CategoryDTO => ({ id: c.id, slug: c.slug, nameEn: c.nameEn, nameAr: c.nameAr }),
  );
}

async function attachOptions(rows: (typeof menuItems.$inferSelect)[]): Promise<MenuItemDTO[]> {
  const db = await getDb();
  const ids = rows.map((r) => r.id);
  const groups = ids.length
    ? await db
        .select()
        .from(optionGroups)
        .where(inArray(optionGroups.menuItemId, ids))
        .orderBy(asc(optionGroups.sortOrder), asc(optionGroups.id))
    : [];
  const opts = groups.length
    ? await db
        .select()
        .from(options)
        .where(inArray(options.groupId, groups.map((g) => g.id)))
        .orderBy(asc(options.sortOrder), asc(options.id))
    : [];
  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    categoryId: r.categoryId,
    nameEn: r.nameEn,
    nameAr: r.nameAr,
    descriptionEn: r.descriptionEn,
    descriptionAr: r.descriptionAr,
    price: r.price,
    imageUrl: r.imageUrl,
    isAvailable: r.isAvailable,
    tags: r.tags.split(",").map((t) => t.trim()).filter(Boolean),
    optionGroups: groups
      .filter((g) => g.menuItemId === r.id)
      .map((g) => ({
        id: g.id,
        nameEn: g.nameEn,
        nameAr: g.nameAr,
        minSelect: g.minSelect,
        maxSelect: g.maxSelect,
        options: opts
          .filter((o) => o.groupId === g.id)
          .map((o) => ({
            id: o.id,
            nameEn: o.nameEn,
            nameAr: o.nameAr,
            priceDelta: o.priceDelta,
            isAvailable: o.isAvailable,
          })),
      })),
  }));
}

/** Every non-archived item in an active (or no) category, in menu order. */
export async function getMenu(): Promise<{ categories: CategoryDTO[]; items: MenuItemDTO[]; popularIds: number[] }> {
  const db = await getDb();
  const cats = await getCategories();
  const activeCatIds = new Set(cats.map((c) => c.id));
  const catOrder = new Map(cats.map((c, i) => [c.id, i]));
  const rows = (
    await db.select().from(menuItems).where(eq(menuItems.isArchived, false)).orderBy(asc(menuItems.sortOrder), asc(menuItems.id))
  )
    .filter((r) => r.categoryId === null || activeCatIds.has(r.categoryId))
    .sort((a, b) => (catOrder.get(a.categoryId ?? -1) ?? 999) - (catOrder.get(b.categoryId ?? -1) ?? 999));
  const items = await attachOptions(rows);
  const pop = await db.select().from(popularItems).orderBy(asc(popularItems.sortOrder));
  const present = new Set(items.map((i) => i.id));
  return { categories: cats, items, popularIds: pop.map((p) => p.menuItemId).filter((id) => present.has(id)) };
}

/** Homepage: the first 6 selected popular items, in the admin's order. */
export async function getFeaturedItems(limit = 6): Promise<MenuItemDTO[]> {
  const db = await getDb();
  const rows = await db
    .select({ item: menuItems })
    .from(popularItems)
    .innerJoin(menuItems, eq(menuItems.id, popularItems.menuItemId))
    .where(eq(menuItems.isArchived, false))
    .orderBy(asc(popularItems.sortOrder))
    .limit(limit);
  return attachOptions(rows.map((r) => r.item));
}

export async function getItemBySlug(slug: string): Promise<MenuItemDTO | null> {
  const db = await getDb();
  const [row] = await db
    .select()
    .from(menuItems)
    .where(and(eq(menuItems.slug, slug), eq(menuItems.isArchived, false)));
  if (!row) return null;
  const [dto] = await attachOptions([row]);
  return dto;
}

export async function getItemsByCategory(categoryId: number | null, excludeId: number, limit = 4) {
  if (categoryId === null) return [];
  const db = await getDb();
  const rows = await db
    .select()
    .from(menuItems)
    .where(and(eq(menuItems.categoryId, categoryId), eq(menuItems.isArchived, false)))
    .orderBy(asc(menuItems.sortOrder));
  return attachOptions(rows.filter((r) => r.id !== excludeId).slice(0, limit));
}

export async function getItemsByIds(ids: number[]) {
  if (!ids.length) return [];
  const db = await getDb();
  const rows = await db.select().from(menuItems).where(inArray(menuItems.id, ids));
  return attachOptions(rows);
}

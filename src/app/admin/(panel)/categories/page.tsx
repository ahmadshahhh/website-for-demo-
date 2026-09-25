import { asc, count } from "drizzle-orm";
import { CategoryManager } from "@/components/admin/CategoryManager";
import { PageTitle } from "@/components/admin/ui";
import { getDb } from "@/db";
import { categories, menuItems } from "@/db/schema";
import { requireAdminPage } from "@/lib/auth/guards";
import { getI18n } from "@/lib/i18n/server";

export default async function CategoriesPage() {
  await requireAdminPage({ ownerOnly: true });
  const db = await getDb();
  const [{ t }, cats, counts] = await Promise.all([
    getI18n(),
    db.select().from(categories).orderBy(asc(categories.sortOrder), asc(categories.id)),
    db.select({ id: menuItems.categoryId, n: count() }).from(menuItems).groupBy(menuItems.categoryId),
  ]);
  const by = new Map(counts.map((c) => [c.id, c.n]));
  return (
    <>
      <PageTitle title={t.admin.categories.title} />
      <CategoryManager categories={cats.map((c) => ({ id: c.id, nameEn: c.nameEn, nameAr: c.nameAr, isActive: c.isActive, items: by.get(c.id) ?? 0 }))} />
    </>
  );
}

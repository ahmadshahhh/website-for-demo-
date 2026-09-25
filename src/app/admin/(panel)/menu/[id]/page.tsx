import { eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MenuItemForm } from "@/components/admin/MenuItemForm";
import { OptionsEditor } from "@/components/admin/OptionsEditor";
import { PageTitle, Panel } from "@/components/admin/ui";
import { ArrowIcon } from "@/components/ui/icons";
import { getDb } from "@/db";
import { menuItems, popularItems } from "@/db/schema";
import { requireAdminPage } from "@/lib/auth/guards";
import { getCategories, getItemsByIds } from "@/lib/data/menu";
import { getI18n } from "@/lib/i18n/server";

export default async function EditItemPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage({ ownerOnly: true });
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const db = await getDb();
  const [item] = await db.select().from(menuItems).where(eq(menuItems.id, Number(id)));
  if (!item) notFound();
  const [{ t }, categories, [dto], pop] = await Promise.all([
    getI18n(),
    getCategories({ activeOnly: false }),
    getItemsByIds([item.id]),
    db.select().from(popularItems).where(eq(popularItems.menuItemId, item.id)),
  ]);
  return (
    <>
      <Link href="/admin/menu" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink">
        <ArrowIcon size={16} className="rotate-180" /> {t.admin.menu.title}
      </Link>
      <PageTitle title={item.nameEn} subtitle={<Link href={`/menu/${item.slug}`} target="_blank" className="text-pomegranate-600 hover:underline">/menu/{item.slug} ↗</Link>} />
      <MenuItemForm categories={categories} item={{ ...item, isPopular: pop.length > 0 }} />
      <Panel title={t.admin.menu.options} className="mt-6">
        <p className="mb-4 text-sm text-muted">{t.admin.menu.optionsHint}</p>
        <OptionsEditor itemId={item.id} groups={dto.optionGroups} />
      </Panel>
    </>
  );
}

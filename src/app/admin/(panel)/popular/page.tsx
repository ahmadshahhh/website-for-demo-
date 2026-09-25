import { PopularManager } from "@/components/admin/PopularManager";
import { PageTitle } from "@/components/admin/ui";
import { requireAdminPage } from "@/lib/auth/guards";
import { listAdminMenu } from "@/lib/data/admin";
import { getI18n } from "@/lib/i18n/server";

export default async function PopularPage() {
  await requireAdminPage({ ownerOnly: true });
  const [{ t }, { items, popular }] = await Promise.all([getI18n(), listAdminMenu()]);
  const byId = new Map(items.map((i) => [i.id, i]));
  const selected = popular.map((p) => byId.get(p.menuItemId)).filter((x): x is NonNullable<typeof x> => !!x);
  const chosen = new Set(selected.map((s) => s.id));
  return (
    <>
      <PageTitle title={t.admin.popular.title} subtitle={t.admin.popular.subtitle} />
      <PopularManager
        selected={selected.map((i) => ({ id: i.id, nameEn: i.nameEn, nameAr: i.nameAr, imageUrl: i.imageUrl, price: i.price, isAvailable: i.isAvailable }))}
        candidates={items.filter((i) => !chosen.has(i.id)).map((i) => ({ id: i.id, nameEn: i.nameEn, nameAr: i.nameAr }))}
      />
    </>
  );
}

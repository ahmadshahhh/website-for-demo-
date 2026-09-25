import { AreaManager } from "@/components/admin/AreaManager";
import { PageTitle } from "@/components/admin/ui";
import { requireAdminPage } from "@/lib/auth/guards";
import { getDeliveryAreas, getSettings } from "@/lib/data/settings";
import { getI18n } from "@/lib/i18n/server";
import { formatKWD } from "@/lib/money";

export default async function AreasPage() {
  await requireAdminPage({ ownerOnly: true });
  const [{ t, locale }, areas, s] = await Promise.all([getI18n(), getDeliveryAreas(), getSettings()]);
  return (
    <>
      <PageTitle title={t.admin.areas.title} subtitle={`${t.admin.settings.deliveryFee}: ${formatKWD(s.deliveryFee, locale)}`} />
      <AreaManager areas={areas.map((a) => ({ id: a.id, nameEn: a.nameEn, nameAr: a.nameAr, deliveryFee: a.deliveryFee, isActive: a.isActive }))} />
    </>
  );
}

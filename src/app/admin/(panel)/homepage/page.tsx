import { HomepageForm } from "@/components/admin/HomepageForm";
import { PageTitle } from "@/components/admin/ui";
import { requireAdminPage } from "@/lib/auth/guards";
import { getHomepageContent } from "@/lib/data/settings";
import { getI18n } from "@/lib/i18n/server";

export default async function HomepageAdminPage() {
  await requireAdminPage({ ownerOnly: true });
  const [{ t }, home] = await Promise.all([getI18n(), getHomepageContent()]);
  return (
    <>
      <PageTitle title={t.admin.homepage.title} subtitle={t.admin.popular.subtitle} />
      <HomepageForm home={home} />
    </>
  );
}

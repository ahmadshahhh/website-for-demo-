import { SettingsForm } from "@/components/admin/SettingsForm";
import { PageTitle } from "@/components/admin/ui";
import { requireAdminPage } from "@/lib/auth/guards";
import { getSettings } from "@/lib/data/settings";
import { getI18n } from "@/lib/i18n/server";

export default async function SettingsPage() {
  await requireAdminPage({ ownerOnly: true });
  const [{ t }, s] = await Promise.all([getI18n(), getSettings()]);
  return (
    <>
      <PageTitle title={t.admin.settings.title} />
      <SettingsForm s={s} />
    </>
  );
}

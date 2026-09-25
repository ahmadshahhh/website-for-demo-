import { AdminPasswordForm } from "@/components/admin/AdminPasswordForm";
import { PageTitle, Panel } from "@/components/admin/ui";
import { requireAdminPage } from "@/lib/auth/guards";
import { getI18n } from "@/lib/i18n/server";

export default async function AdminAccountPage() {
  const admin = await requireAdminPage();
  const { t } = await getI18n();
  return (
    <>
      <PageTitle title={t.admin.account.title} subtitle={`${admin.name} · ${admin.email} · ${admin.role}`} />
      <Panel title={t.admin.account.changePassword} className="max-w-lg">
        <AdminPasswordForm />
      </Panel>
    </>
  );
}

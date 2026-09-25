import { MenuItemForm } from "@/components/admin/MenuItemForm";
import { PageTitle } from "@/components/admin/ui";
import { requireAdminPage } from "@/lib/auth/guards";
import { getCategories } from "@/lib/data/menu";
import { getI18n } from "@/lib/i18n/server";

export default async function NewItemPage() {
  await requireAdminPage({ ownerOnly: true });
  const [{ t }, categories] = await Promise.all([getI18n(), getCategories({ activeOnly: false })]);
  return (
    <>
      <PageTitle title={t.admin.menu.new} />
      <MenuItemForm categories={categories} item={null} />
    </>
  );
}

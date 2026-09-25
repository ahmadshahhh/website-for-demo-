import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdminPage } from "@/lib/auth/guards";
import { getOrderPulse } from "@/lib/data/admin";
import { getSettings } from "@/lib/data/settings";
import { pick } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin" }, robots: { index: false, follow: false } };

/** Every page in the panel requires an authenticated, active admin. */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdminPage();
  const [{ locale }, settings, pulse] = await Promise.all([getI18n(), getSettings(), getOrderPulse()]);
  return (
    <AdminShell
      admin={{ name: admin.name, email: admin.email, role: admin.role, mustChangePassword: admin.mustChangePassword }}
      restaurantName={pick(settings, "name", locale)}
      isOpen={settings.isOpen}
      initialPulse={pulse}
    >
      {children}
    </AdminShell>
  );
}

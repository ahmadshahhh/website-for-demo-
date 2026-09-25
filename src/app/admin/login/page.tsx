import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { LogoMark } from "@/components/ui/Logo";
import { getCurrentAdmin } from "@/lib/auth/session";
import { getI18n } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

export default async function AdminLoginPage() {
  const [{ t }, admin] = await Promise.all([getI18n(), getCurrentAdmin()]);
  if (admin) redirect("/admin");
  return (
    <div className="flex min-h-dvh items-center justify-center bg-ink px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-end"><LanguageSwitcher variant="dark" /></div>
        <div className="rounded-3xl bg-cream p-7 shadow-2xl sm:p-8">
          <LogoMark size={48} />
          <h1 className="mt-4 text-2xl font-extrabold">{t.admin.loginTitle}</h1>
          <p className="mt-1 text-muted">{t.admin.loginSubtitle}</p>
          <div className="mt-6"><AdminLoginForm /></div>
        </div>
      </div>
    </div>
  );
}

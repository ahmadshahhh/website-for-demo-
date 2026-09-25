"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";
import { useI18n } from "@/components/providers/I18nProvider";
import { LogoutIcon, ReceiptIcon, UserIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

export function AccountNav() {
  const { t } = useI18n();
  const pathname = usePathname();
  const tabs = [
    { href: "/account", label: t.account.profile, Icon: UserIcon, active: pathname === "/account" },
    { href: "/account/orders", label: t.account.orders, Icon: ReceiptIcon, active: pathname.startsWith("/account/orders") },
  ];
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-line pb-3">
      {tabs.map(({ href, label, Icon, active }) => (
        <Link key={href} href={href} className={cn("inline-flex items-center gap-2 rounded-xl px-4 py-2.5 font-semibold", active ? "bg-ink text-cream" : "text-ink-soft hover:bg-sand")}>
          <Icon size={18} /> {label}
        </Link>
      ))}
      <form action={logoutAction} className="ms-auto">
        <button className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 font-semibold text-pomegranate-600 hover:bg-pomegranate-50">
          <LogoutIcon size={18} /> {t.nav.logout}
        </button>
      </form>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { adminLogoutAction } from "@/app/admin/actions/auth";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useI18n } from "@/components/providers/I18nProvider";
import { useToast } from "@/components/providers/ToastProvider";
import {
  AlertIcon,
  BellIcon,
  CloseIcon,
  GridIcon,
  HomeIcon,
  ImageIcon,
  ListIcon,
  LogoutIcon,
  MenuIcon,
  PinIcon,
  ReceiptIcon,
  SettingsIcon,
  StarIcon,
  TagIcon,
  UserIcon,
  UsersIcon,
} from "@/components/ui/icons";
import { LogoMark } from "@/components/ui/Logo";
import { fmt } from "@/lib/i18n/config";
import { cn } from "@/lib/cn";

type Pulse = { unseen: number; latestId: number };

// Per-browser "sound alerts" preference.
const soundListeners = new Set<() => void>();
const subscribeSound = (cb: () => void) => {
  soundListeners.add(cb);
  return () => soundListeners.delete(cb);
};
const readSound = () => {
  try {
    return localStorage.getItem("sy_admin_sound") !== "0";
  } catch {
    return true;
  }
};

/** Short two-tone chime via Web Audio — no audio file needed. */
function chime() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    [880, 1318.5].forEach((freq, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = freq;
      o.type = "sine";
      g.gain.setValueAtTime(0.0001, ctx.currentTime + i * 0.18);
      g.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + i * 0.18 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.18 + 0.5);
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + i * 0.18);
      o.stop(ctx.currentTime + i * 0.18 + 0.55);
    });
  } catch {}
}

export function AdminShell({
  admin,
  restaurantName,
  isOpen,
  initialPulse,
  children,
}: {
  admin: { name: string; email: string; role: "owner" | "staff"; mustChangePassword: boolean };
  restaurantName: string;
  isOpen: boolean;
  initialPulse: Pulse;
  children: React.ReactNode;
}) {
  const { t } = useI18n();
  const { toast } = useToast();
  const pathname = usePathname();
  const router = useRouter();
  const [drawer, setDrawer] = useState(false);
  const [pulse, setPulse] = useState(initialPulse);
  const sound = useSyncExternalStore(subscribeSound, readSound, () => true);
  const setSound = (on: boolean) => {
    try {
      localStorage.setItem("sy_admin_sound", on ? "1" : "0");
    } catch {}
    soundListeners.forEach((l) => l());
  };
  const latest = useRef(initialPulse.latestId);

  const poll = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/pulse", { cache: "no-store" });
      if (res.status === 401) return router.refresh();
      if (!res.ok) return;
      const p: Pulse = await res.json();
      setPulse(p);
      if (p.latestId > latest.current) {
        latest.current = p.latestId;
        toast(fmt(t.admin.orders.newAlert, { count: p.unseen }), "info");
        if (sound) chime();
        router.refresh();
      }
    } catch {}
  }, [router, sound, t, toast]);

  useEffect(() => {
    const id = setInterval(poll, 10_000);
    return () => clearInterval(id);
  }, [poll]);

  // Flash the tab title while there are unseen orders.
  useEffect(() => {
    const base = document.title.replace(/^\(\d+\)\s*/, "");
    document.title = pulse.unseen > 0 ? `(${pulse.unseen}) ${base}` : base;
  }, [pulse.unseen, pathname]);

  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setDrawer(false);
  }

  const owner = admin.role === "owner";
  const nav = [
    { href: "/admin", label: t.admin.nav.dashboard, Icon: GridIcon, show: true },
    { href: "/admin/orders", label: t.admin.nav.orders, Icon: ReceiptIcon, show: true, badge: pulse.unseen },
    { href: "/admin/menu", label: t.admin.nav.menu, Icon: ListIcon, show: owner },
    { href: "/admin/categories", label: t.admin.nav.categories, Icon: TagIcon, show: owner },
    { href: "/admin/popular", label: t.admin.nav.popular, Icon: StarIcon, show: owner },
    { href: "/admin/customers", label: t.admin.nav.customers, Icon: UsersIcon, show: true },
    { href: "/admin/homepage", label: t.admin.nav.homepage, Icon: ImageIcon, show: owner },
    { href: "/admin/areas", label: t.admin.nav.areas, Icon: PinIcon, show: owner },
    { href: "/admin/settings", label: t.admin.nav.settings, Icon: SettingsIcon, show: owner },
    { href: "/admin/account", label: t.admin.nav.account, Icon: UserIcon, show: true },
  ].filter((n) => n.show);
  const active = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-5 py-5">
        <LogoMark size={36} />
        <div className="min-w-0 leading-tight">
          <p className="truncate font-bold text-cream">{restaurantName}</p>
          <p className="text-xs text-cream/50">{t.admin.panel}</p>
        </div>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3" aria-label="Admin">
        {nav.map(({ href, label, Icon, badge }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[0.95rem] font-semibold transition-colors",
              active(href) ? "bg-saffron-400 text-ink" : "text-cream/75 hover:bg-white/5 hover:text-cream",
            )}
          >
            <Icon size={19} />
            <span className="flex-1">{label}</span>
            {!!badge && <span className="animate-pulse rounded-full bg-pomegranate-500 px-2 py-0.5 text-xs font-bold text-white">{badge}</span>}
          </Link>
        ))}
      </nav>
      <div className="space-y-3 border-t border-white/10 p-4">
        <LanguageSwitcher variant="dark" />
        <Link href="/" target="_blank" className="flex items-center gap-2 text-sm font-semibold text-cream/70 hover:text-cream">
          <HomeIcon size={17} /> {t.admin.viewSite}
        </Link>
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1 text-sm">
            <p className="truncate font-semibold text-cream">{admin.name}</p>
            <p className="truncate text-xs text-cream/50">{admin.email}</p>
          </div>
          <form action={adminLogoutAction}>
            <button className="flex size-9 items-center justify-center rounded-lg text-cream/70 hover:bg-white/10 hover:text-cream" aria-label={t.admin.account.signOut} title={t.admin.account.signOut}>
              <LogoutIcon size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh bg-[#F6F1E9]">
      <aside className="fixed inset-y-0 start-0 z-30 hidden w-64 bg-ink lg:block">{sidebar}</aside>

      <div className={cn("fixed inset-0 z-50 lg:hidden", drawer ? "visible" : "invisible")}>
        <div className={cn("absolute inset-0 bg-black/50 transition-opacity", drawer ? "opacity-100" : "opacity-0")} onClick={() => setDrawer(false)} />
        <aside className={cn("absolute inset-y-0 start-0 w-72 bg-ink transition-transform", drawer ? "translate-x-0" : "-translate-x-full rtl:translate-x-full")}>
          <button onClick={() => setDrawer(false)} className="absolute end-3 top-5 text-cream/70" aria-label={t.common.close}><CloseIcon /></button>
          {sidebar}
        </aside>
      </div>

      <div className="lg:ps-64">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-line bg-white/90 px-4 backdrop-blur lg:px-8 no-print">
          <button className="lg:hidden" onClick={() => setDrawer(true)} aria-label={t.nav.openMenu}><MenuIcon /></button>
          <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold", isOpen ? "bg-leaf-50 text-leaf" : "bg-pomegranate-50 text-pomegranate-600")}>
            <span className={cn("size-2 rounded-full", isOpen ? "bg-leaf" : "bg-pomegranate-500")} />
            {t.admin.dashboard.restaurant}: {isOpen ? t.admin.dashboard.open : t.admin.dashboard.closed}
          </span>
          <div className="ms-auto flex items-center gap-2">
            <button
              onClick={() => {
                const next = !sound;
                setSound(next);
                if (next) chime();
              }}
              className={cn("inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold", sound ? "bg-saffron-100 text-saffron-700" : "bg-sand text-muted")}
              aria-pressed={sound}
            >
              <BellIcon size={16} /> {t.admin.orders.sound}
            </button>
            <Link href="/admin/orders?tab=new" className="relative flex size-9 items-center justify-center rounded-lg hover:bg-sand" aria-label={t.admin.orders.tabs.new}>
              <ReceiptIcon size={19} />
              {pulse.unseen > 0 && <span className="absolute -end-1 -top-1 flex h-5 min-w-5 animate-pop items-center justify-center rounded-full bg-pomegranate-600 px-1 text-[0.7rem] font-bold text-white">{pulse.unseen}</span>}
            </Link>
          </div>
        </header>
        {admin.mustChangePassword && (
          <Link href="/admin/account" className="flex items-center gap-2 bg-saffron-400 px-4 py-2.5 text-sm font-bold text-ink lg:px-8">
            <AlertIcon size={17} /> {t.admin.defaultPassword}
          </Link>
        )}
        <main className="px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}

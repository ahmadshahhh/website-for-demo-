import Link from "next/link";
import { OpenToggle } from "@/components/admin/OpenToggle";
import { OrderStatusBadge, PageTitle, Panel, timeAgo } from "@/components/admin/ui";
import { LinkButton } from "@/components/ui/Button";
import { BagIcon, ClockIcon, CheckIcon, ImageIcon, ListIcon, PlusIcon, ReceiptIcon, SettingsIcon, StarIcon, TruckIcon } from "@/components/ui/icons";
import { AutoRefresh } from "@/components/order/AutoRefresh";
import { requireAdminPage } from "@/lib/auth/guards";
import { getDashboardStats, getPopularSales, listOrders } from "@/lib/data/admin";
import { getSettings } from "@/lib/data/settings";
import { fmt, pick } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";
import { formatKWD } from "@/lib/money";
import { cn } from "@/lib/cn";

export default async function DashboardPage() {
  const admin = await requireAdminPage();
  const [{ t, locale }, stats, settings, recent, top] = await Promise.all([
    getI18n(),
    getDashboardStats(),
    getSettings(),
    listOrders("all", undefined, 8),
    getPopularSales(5),
  ]);
  const d = t.admin.dashboard;
  const cards = [
    { label: d.newOrders, value: stats.newOrders, Icon: ReceiptIcon, href: "/admin/orders?tab=new", tone: stats.newOrders > 0 ? "bg-pomegranate-600 text-white" : "bg-white" },
    { label: d.activeOrders, value: stats.activeOrders, Icon: ClockIcon, href: "/admin/orders?tab=active", tone: "bg-white" },
    { label: d.todayOrders, value: stats.todayOrders, Icon: BagIcon, href: "/admin/orders?tab=all", tone: "bg-white" },
    { label: d.completedOrders, value: stats.completedToday, Icon: CheckIcon, href: "/admin/orders?tab=completed", tone: "bg-white" },
  ];
  const owner = admin.role === "owner";
  return (
    <>
      <AutoRefresh seconds={20} />
      <PageTitle title={d.title} subtitle={fmt(t.account.hello, { name: admin.name })} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, Icon, href, tone }) => (
          <Link key={label} href={href} className={cn("group rounded-2xl border border-line p-5 shadow-[var(--shadow-card)] transition-transform hover:-translate-y-0.5", tone)}>
            <div className="flex items-center justify-between">
              <span className={cn("text-sm font-semibold", tone.includes("text-white") ? "text-white/80" : "text-muted")}>{label}</span>
              <Icon size={20} className={tone.includes("text-white") ? "text-white/80" : "text-saffron-600"} />
            </div>
            <p className="mt-3 text-4xl font-extrabold tabular-nums">{value}</p>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Panel title={d.recentOrders} actions={<Link href="/admin/orders" className="text-sm font-semibold text-pomegranate-600 hover:underline">{t.common.viewAll}</Link>}>
          {recent.length === 0 ? (
            <p className="text-muted">{d.noOrders}</p>
          ) : (
            <ul className="divide-y divide-line">
              {recent.map((o) => (
                <li key={o.id}>
                  <Link href={`/admin/orders/${o.id}`} className="flex items-center gap-3 py-3 hover:bg-sand/40">
                    <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", o.status === "received" ? "bg-pomegranate-50 text-pomegranate-600" : "bg-sand text-ink-soft")}>
                      {o.orderType === "delivery" ? <TruckIcon size={18} /> : <BagIcon size={18} />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">#{o.id} · {o.customerName} {o.isGuest && <span className="text-xs font-normal text-muted">({t.common.guest})</span>}</p>
                      <p className="text-xs text-muted">{timeAgo(o.createdAt, locale)} · {o.itemCount} {t.admin.orders.items}</p>
                    </div>
                    <OrderStatusBadge status={o.status} type={o.orderType} t={t} />
                    <span className="hidden w-24 text-end font-bold tabular-nums sm:block">{formatKWD(o.total, locale)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <div className="space-y-6">
          <Panel title={d.restaurant}>
            <OpenToggle isOpen={settings.isOpen} />
            <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-sand/60 p-3"><dt className="text-muted">{d.todaySales}</dt><dd className="mt-1 text-lg font-extrabold tabular-nums">{formatKWD(stats.todaySales, locale)}</dd></div>
              <div className="rounded-xl bg-sand/60 p-3"><dt className="text-muted">{d.totalItems}</dt><dd className="mt-1 text-lg font-extrabold">{stats.totalItems} <span className="text-xs font-semibold text-pomegranate-600">{stats.unavailableItems > 0 && fmt(d.unavailable, { count: stats.unavailableItems })}</span></dd></div>
              <div className="rounded-xl bg-sand/60 p-3"><dt className="text-muted">{d.popularItems}</dt><dd className="mt-1 text-lg font-extrabold">{Math.min(stats.popularItems, 6)} / 6</dd></div>
              <div className="rounded-xl bg-sand/60 p-3"><dt className="text-muted">{pick(settings, "name", locale)}</dt><dd className="mt-1 text-sm font-bold">{settings.deliveryTimeMin}–{settings.deliveryTimeMax} {t.common.minutes}</dd></div>
            </dl>
          </Panel>

          <Panel title={d.quickActions}>
            <div className="grid grid-cols-2 gap-2">
              <LinkButton href="/admin/orders?tab=new" variant="dark" size="sm" icon={<ReceiptIcon size={16} />}>{d.manageOrders}</LinkButton>
              {owner && <LinkButton href="/admin/menu/new" size="sm" icon={<PlusIcon size={16} />}>{d.addItem}</LinkButton>}
              {owner && <LinkButton href="/admin/popular" variant="outline" size="sm" icon={<StarIcon size={16} />}>{t.admin.nav.popular}</LinkButton>}
              {owner && <LinkButton href="/admin/menu" variant="outline" size="sm" icon={<ListIcon size={16} />}>{t.admin.nav.menu}</LinkButton>}
              {owner && <LinkButton href="/admin/homepage" variant="outline" size="sm" icon={<ImageIcon size={16} />}>{d.editHomepage}</LinkButton>}
              {owner && <LinkButton href="/admin/settings" variant="outline" size="sm" icon={<SettingsIcon size={16} />}>{d.editSettings}</LinkButton>}
            </div>
          </Panel>

          {top.length > 0 && (
            <Panel title={t.menu.popular}>
              <ol className="space-y-2">
                {top.map((r, i) => (
                  <li key={r.nameEn} className="flex items-center gap-3 text-sm">
                    <span className="flex size-7 items-center justify-center rounded-full bg-saffron-100 font-bold text-saffron-700">{i + 1}</span>
                    <span className="flex-1 font-semibold">{pick(r, "name", locale)}</span>
                    <span className="font-bold tabular-nums">× {Number(r.qty)}</span>
                  </li>
                ))}
              </ol>
            </Panel>
          )}
        </div>
      </div>
    </>
  );
}

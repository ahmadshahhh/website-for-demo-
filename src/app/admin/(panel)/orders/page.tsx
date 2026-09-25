import Link from "next/link";
import { OrderStatusBadge, PageTitle, PaymentBadge, formatDateTime, timeAgo } from "@/components/admin/ui";
import { AutoRefresh } from "@/components/order/AutoRefresh";
import { BagIcon, SearchIcon, TruckIcon } from "@/components/ui/icons";
import { requireAdminPage } from "@/lib/auth/guards";
import { getTabCounts, listOrders, type OrderTab } from "@/lib/data/admin";
import { getI18n } from "@/lib/i18n/server";
import { formatKWD } from "@/lib/money";
import { formatPhone } from "@/lib/phone";
import { cn } from "@/lib/cn";

const TABS: OrderTab[] = ["new", "active", "completed", "cancelled", "all"];

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ tab?: string; q?: string }> }) {
  await requireAdminPage();
  const sp = await searchParams;
  const tab = (TABS.includes(sp.tab as OrderTab) ? sp.tab : "active") as OrderTab;
  const [{ t, locale }, rows, counts] = await Promise.all([getI18n(), listOrders(tab, sp.q), getTabCounts()]);
  const o = t.admin.orders;
  return (
    <>
      <AutoRefresh seconds={10} />
      <PageTitle title={o.title} subtitle={<span className="inline-flex items-center gap-1.5 text-leaf"><span className="size-2 animate-pulse rounded-full bg-leaf" /> {o.autoRefresh}</span>} />

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto rounded-2xl bg-white p-1.5 shadow-[var(--shadow-card)] ring-1 ring-line">
          {TABS.map((k) => (
            <Link
              key={k}
              href={`/admin/orders?tab=${k}`}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold",
                tab === k ? "bg-ink text-cream" : "text-ink-soft hover:bg-sand",
              )}
            >
              {o.tabs[k]}
              <span className={cn("rounded-full px-2 py-0.5 text-xs", k === "new" && counts.new > 0 ? "bg-pomegranate-600 text-white" : tab === k ? "bg-white/15" : "bg-sand")}>{counts[k]}</span>
            </Link>
          ))}
        </div>
        <form className="relative lg:ms-auto lg:w-80">
          <input type="hidden" name="tab" value={tab} />
          <SearchIcon size={18} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted" />
          <input name="q" defaultValue={sp.q} placeholder={o.search} className="h-11 w-full rounded-xl border border-line-strong bg-white ps-10 pe-3 text-sm outline-none focus:border-saffron-500" />
        </form>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line-strong bg-white/60 p-12 text-center text-muted">{o.empty}</div>
      ) : (
        <>
          {/* Cards on phones/tablets */}
          <ul className="grid gap-3 md:grid-cols-2 xl:hidden">
            {rows.map((r) => (
              <li key={r.id}>
                <Link href={`/admin/orders/${r.id}`} className={cn("block rounded-2xl border bg-white p-4 shadow-[var(--shadow-card)]", !r.seenByStaff ? "border-pomegranate-500 ring-4 ring-pomegranate-50" : "border-line")}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-extrabold">#{r.id} {!r.seenByStaff && <span className="ms-1 rounded bg-pomegranate-600 px-1.5 py-0.5 text-[0.65rem] font-bold text-white">{o.newBadge}</span>}</p>
                    <OrderStatusBadge status={r.status} type={r.orderType} t={t} />
                  </div>
                  <p className="mt-1 font-mono text-xs text-muted ltr-nums">{r.trackingId}</p>
                  <p className="mt-2 font-semibold">{r.customerName} <span className="text-xs font-normal text-muted">· {r.isGuest ? t.common.guest : t.common.registered}</span></p>
                  <p className="text-sm text-muted ltr-nums">{formatPhone(r.phone)}</p>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="inline-flex items-center gap-1.5 text-muted">
                      {r.orderType === "delivery" ? <TruckIcon size={15} /> : <BagIcon size={15} />} {r.itemCount} {o.items} · {timeAgo(r.createdAt, locale)}
                    </span>
                    <span className="font-extrabold tabular-nums">{formatKWD(r.total, locale)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          {/* Table on desktop */}
          <div className="hidden overflow-hidden rounded-2xl border border-line bg-white shadow-[var(--shadow-card)] xl:block">
            <table className="w-full text-sm">
              <thead className="bg-sand/60 text-start text-xs uppercase tracking-wide text-muted">
                <tr>
                  {[o.order, o.customer, o.type, o.items, o.total, o.payment, o.status, o.time].map((h) => (
                    <th key={h} className="px-4 py-3 text-start font-bold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((r) => (
                  <tr key={r.id} className={cn("relative hover:bg-saffron-50/50", !r.seenByStaff && "bg-pomegranate-50/60")}>
                    <td className="px-4 py-3">
                      <Link href={`/admin/orders/${r.id}`} className="font-extrabold after:absolute after:inset-0">
                        #{r.id}
                      </Link>
                      {!r.seenByStaff && <span className="ms-2 rounded bg-pomegranate-600 px-1.5 py-0.5 text-[0.65rem] font-bold text-white">{o.newBadge}</span>}
                      <p className="font-mono text-xs text-muted ltr-nums">{r.trackingId}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold">{r.customerName}</p>
                      <p className="text-xs text-muted"><span className="ltr-nums">{formatPhone(r.phone)}</span> · {r.isGuest ? t.common.guest : t.common.registered}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5">{r.orderType === "delivery" ? <TruckIcon size={15} /> : <BagIcon size={15} />} {r.orderType === "delivery" ? t.checkout.delivery : t.checkout.pickup}</span>
                      {r.areaName && <p className="text-xs text-muted">{r.areaName.split(" / ")[locale === "ar" ? 1 : 0]}</p>}
                    </td>
                    <td className="px-4 py-3 tabular-nums">{r.itemCount}</td>
                    <td className="px-4 py-3 font-bold tabular-nums">{formatKWD(r.total, locale)}</td>
                    <td className="px-4 py-3">
                      <p className="text-xs">{t.paymentMethod[r.paymentMethod]}</p>
                      <PaymentBadge status={r.paymentStatus} t={t} />
                    </td>
                    <td className="px-4 py-3"><OrderStatusBadge status={r.status} type={r.orderType} t={t} /></td>
                    <td className="px-4 py-3 text-xs text-muted">
                      {timeAgo(r.createdAt, locale)}
                      <br />
                      {formatDateTime(r.createdAt, locale, { timeStyle: "short" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}

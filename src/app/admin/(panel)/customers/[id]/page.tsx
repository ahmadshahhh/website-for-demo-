import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderStatusBadge, PageTitle, Panel, formatDateTime } from "@/components/admin/ui";
import { ArrowIcon } from "@/components/ui/icons";
import { requireAdminPage } from "@/lib/auth/guards";
import { getCustomerDetail } from "@/lib/data/admin";
import { getI18n } from "@/lib/i18n/server";
import { formatKWD } from "@/lib/money";
import { formatPhone } from "@/lib/phone";

export default async function CustomerPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();
  const { id } = await params;
  const c = /^\d+$/.test(id) ? await getCustomerDetail(Number(id)) : null;
  if (!c) notFound();
  const { t, locale } = await getI18n();
  const x = t.admin.customers;
  const spent = c.history.filter((o) => o.status !== "cancelled").reduce((s, o) => s + o.total, 0);
  return (
    <>
      <Link href="/admin/customers" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink">
        <ArrowIcon size={16} className="rotate-180" /> {x.title}
      </Link>
      <PageTitle title={c.name} subtitle={`${x.joined}: ${formatDateTime(c.createdAt, locale, { dateStyle: "medium" })}`} />
      <div className="grid gap-6 xl:grid-cols-[1fr_2fr]">
        <div className="space-y-6">
          <Panel>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-3"><dt className="text-muted">{x.phone}</dt><dd className="font-semibold ltr-nums">{formatPhone(c.phone)}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-muted">{x.email}</dt><dd className="font-semibold">{c.email}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-muted">{x.orders}</dt><dd className="font-semibold">{c.history.length}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-muted">{x.spent}</dt><dd className="font-semibold tabular-nums">{formatKWD(spent, locale)}</dd></div>
            </dl>
          </Panel>
          <Panel title={x.addresses}>
            {c.addresses.length === 0 ? <p className="text-sm text-muted">—</p> : (
              <ul className="space-y-2 text-sm">
                {c.addresses.map((a) => <li key={a.id} className="rounded-xl bg-sand/60 p-3"><b>{a.label}</b> · {t.checkout.block} {a.block}, {t.checkout.street} {a.street}, {a.building}</li>)}
              </ul>
            )}
          </Panel>
        </div>
        <Panel title={x.history}>
          <ul className="divide-y divide-line">
            {c.history.map((o) => (
              <li key={o.id}>
                <Link href={`/admin/orders/${o.id}`} className="flex items-center gap-3 py-3 text-sm hover:bg-sand/40">
                  <span className="font-bold">#{o.id}</span>
                  <span className="flex-1 text-muted">{formatDateTime(o.createdAt, locale)}</span>
                  <OrderStatusBadge status={o.status} type={o.orderType} t={t} />
                  <span className="w-24 text-end font-bold tabular-nums">{formatKWD(o.total, locale)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}

import Link from "next/link";
import { PageTitle, formatDateTime } from "@/components/admin/ui";
import { SearchIcon } from "@/components/ui/icons";
import { requireAdminPage } from "@/lib/auth/guards";
import { listCustomers, listGuests } from "@/lib/data/admin";
import { getI18n } from "@/lib/i18n/server";
import { formatKWD } from "@/lib/money";
import { formatPhone } from "@/lib/phone";
import { cn } from "@/lib/cn";

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ tab?: string; q?: string }> }) {
  await requireAdminPage();
  const sp = await searchParams;
  const tab = sp.tab === "guests" ? "guests" : "registered";
  const { t, locale } = await getI18n();
  const c = t.admin.customers;
  const [customers, guests] = await Promise.all([tab === "registered" ? listCustomers(sp.q) : [], tab === "guests" ? listGuests(sp.q) : []]);
  const th = "px-4 py-3 text-start font-bold";
  return (
    <>
      <PageTitle title={c.title} />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex gap-1.5 rounded-2xl bg-white p-1.5 ring-1 ring-line">
          {(["registered", "guests"] as const).map((k) => (
            <Link key={k} href={`/admin/customers?tab=${k}`} className={cn("rounded-xl px-4 py-2 text-sm font-bold", tab === k ? "bg-ink text-cream" : "text-ink-soft hover:bg-sand")}>
              {k === "registered" ? c.registered : c.guests}
            </Link>
          ))}
        </div>
        <form className="relative sm:ms-auto sm:w-80">
          <input type="hidden" name="tab" value={tab} />
          <SearchIcon size={18} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted" />
          <input name="q" defaultValue={sp.q} placeholder={c.search} className="h-11 w-full rounded-xl border border-line-strong bg-white ps-10 pe-3 text-sm outline-none focus:border-saffron-500" />
        </form>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-line bg-white shadow-[var(--shadow-card)]">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-sand/60 text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className={th}>{c.name}</th>
              <th className={th}>{c.phone}</th>
              {tab === "registered" && <th className={th}>{c.email}</th>}
              <th className={th}>{c.orders}</th>
              <th className={th}>{c.spent}</th>
              <th className={th}>{c.lastOrder}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {tab === "registered"
              ? customers.map((r) => (
                  <tr key={r.id} className="relative hover:bg-saffron-50/50">
                    <td className="px-4 py-3 font-semibold"><Link href={`/admin/customers/${r.id}`} className="after:absolute after:inset-0">{r.name}</Link></td>
                    <td className="px-4 py-3 ltr-nums">{formatPhone(r.phone)}</td>
                    <td className="px-4 py-3">{r.email}</td>
                    <td className="px-4 py-3 tabular-nums">{r.orders}</td>
                    <td className="px-4 py-3 font-semibold tabular-nums">{formatKWD(r.spent, locale)}</td>
                    <td className="px-4 py-3 text-muted">{r.lastOrder ? formatDateTime(r.lastOrder, locale, { dateStyle: "medium" }) : "—"}</td>
                  </tr>
                ))
              : guests.map((g) => (
                  <tr key={g.phone} className="relative hover:bg-saffron-50/50">
                    <td className="px-4 py-3 font-semibold">
                      <Link href={`/admin/orders?tab=all&q=${g.phone.slice(3)}`} className="after:absolute after:inset-0">{g.name}</Link>{" "}
                      <span className="text-xs font-normal text-muted">({t.common.guest})</span>
                    </td>
                    <td className="px-4 py-3 ltr-nums">{formatPhone(g.phone)}</td>
                    <td className="px-4 py-3 tabular-nums">{g.n}</td>
                    <td className="px-4 py-3 font-semibold tabular-nums">{formatKWD(Number(g.spent ?? 0), locale)}</td>
                    <td className="px-4 py-3 text-muted">{formatDateTime(g.last, locale, { dateStyle: "medium" })}</td>
                  </tr>
                ))}
          </tbody>
        </table>
        {(tab === "registered" ? customers.length : guests.length) === 0 && <p className="p-8 text-center text-muted">{c.empty}</p>}
      </div>
    </>
  );
}

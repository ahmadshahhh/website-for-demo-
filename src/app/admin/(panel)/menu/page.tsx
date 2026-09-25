import Link from "next/link";
import { MenuRowActions } from "@/components/admin/MenuRowActions";
import { PageTitle } from "@/components/admin/ui";
import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/Button";
import { FoodImage } from "@/components/ui/FoodImage";
import { PlusIcon, SearchIcon } from "@/components/ui/icons";
import { requireAdminPage } from "@/lib/auth/guards";
import { listAdminMenu } from "@/lib/data/admin";
import { pick } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";
import { formatKWD } from "@/lib/money";

export default async function AdminMenuPage({ searchParams }: { searchParams: Promise<{ q?: string; category?: string }> }) {
  await requireAdminPage({ ownerOnly: true });
  const [{ t, locale }, { items, categories, popular }, sp] = await Promise.all([getI18n(), listAdminMenu(), searchParams]);
  const m = t.admin.menu;
  const popularIds = new Set(popular.map((p) => p.menuItemId));
  const q = sp.q?.trim().toLowerCase();
  const catFilter = sp.category ? Number(sp.category) : null;
  const groups = [...categories.map((c) => ({ id: c.id as number | null, name: pick(c, "name", locale) })), { id: null, name: m.noCategory }];

  return (
    <>
      <PageTitle title={m.title} subtitle={`${items.length}`} actions={<LinkButton href="/admin/menu/new" icon={<PlusIcon size={18} />}>{m.add}</LinkButton>} />
      <form className="mb-5 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <SearchIcon size={18} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted" />
          <input name="q" defaultValue={sp.q} placeholder={m.search} className="h-11 w-full rounded-xl border border-line-strong bg-white ps-10 pe-3 text-sm outline-none focus:border-saffron-500" />
        </div>
        <select name="category" defaultValue={sp.category ?? ""} className="h-11 rounded-xl border border-line-strong bg-white px-3 text-sm">
          <option value="">{m.allCategories}</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{pick(c, "name", locale)}</option>)}
        </select>
        <button className="h-11 rounded-xl bg-ink px-5 text-sm font-semibold text-cream">{t.common.search}</button>
      </form>

      <div className="space-y-6">
        {groups.map((g) => {
          if (catFilter && g.id !== catFilter) return null;
          const list = items.filter((i) => i.categoryId === g.id && (!q || `${i.nameEn} ${i.nameAr}`.toLowerCase().includes(q)));
          if (!list.length) return null;
          return (
            <section key={String(g.id)}>
              <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted">{g.name} · {list.length}</h2>
              <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white shadow-[var(--shadow-card)]">
                {list.map((item, idx) => (
                  <li key={item.id} className="flex items-center gap-3 p-3 sm:gap-4">
                    <FoodImage src={item.imageUrl} alt="" className="size-14 shrink-0 rounded-xl sm:size-16" />
                    <div className="min-w-0 flex-1">
                      <Link href={`/admin/menu/${item.id}`} className="font-bold hover:text-pomegranate-600">{item.nameEn}</Link>
                      <p className="truncate text-sm text-muted" dir="rtl" lang="ar">{item.nameAr}</p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        <span className="text-sm font-bold tabular-nums">{formatKWD(item.price, locale)}</span>
                        {popularIds.has(item.id) && <Badge tone="saffron">★ {m.popular}</Badge>}
                        {!item.isAvailable && <Badge tone="red">{t.common.unavailable}</Badge>}
                      </div>
                    </div>
                    <MenuRowActions id={item.id} available={item.isAvailable} first={idx === 0} last={idx === list.length - 1} />
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </>
  );
}

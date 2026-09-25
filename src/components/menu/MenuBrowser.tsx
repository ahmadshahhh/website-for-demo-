"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDeferredValue, useMemo, useState } from "react";
import { useI18n } from "@/components/providers/I18nProvider";
import { CloseIcon, SearchIcon } from "@/components/ui/icons";
import type { CategoryDTO, MenuItemDTO } from "@/lib/data/menu";
import { fmt } from "@/lib/i18n/config";
import { cn } from "@/lib/cn";
import { MenuCard } from "./MenuCard";

/** Normalise for bilingual search: case, Arabic diacritics and letter variants. */
export function normalizeSearch(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[ً-ٰٟـ]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

export function matches(item: MenuItemDTO, q: string) {
  if (!q) return true;
  const hay = normalizeSearch([item.nameEn, item.nameAr, item.descriptionEn, item.descriptionAr, item.tags.join(" ")].join(" "));
  return normalizeSearch(q).split(/\s+/).every((w) => hay.includes(w));
}

export function MenuBrowser({ categories, items, popularIds }: { categories: CategoryDTO[]; items: MenuItemDTO[]; popularIds: number[] }) {
  const { t, locale } = useI18n();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const deferred = useDeferredValue(query);
  const initialCat = params.get("category") ?? "all";
  const [cat, setCat] = useState(initialCat);
  const popular = useMemo(() => new Set(popularIds), [popularIds]);

  const selectCat = (slug: string) => {
    setCat(slug);
    const next = new URLSearchParams(params);
    if (slug === "all") next.delete("category");
    else next.set("category", slug);
    router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false });
  };

  const chips = [
    { slug: "popular", label: t.menu.popular },
    { slug: "all", label: t.menu.all },
    ...categories.map((c) => ({ slug: c.slug, label: locale === "ar" ? c.nameAr : c.nameEn })),
  ];

  const filtered = useMemo(() => {
    const byCat = (i: MenuItemDTO) => {
      if (cat === "all") return true;
      if (cat === "popular") return popular.has(i.id);
      return categories.find((c) => c.slug === cat)?.id === i.categoryId;
    };
    const list = items.filter((i) => byCat(i) && matches(i, deferred));
    if (cat === "popular") list.sort((a, b) => popularIds.indexOf(a.id) - popularIds.indexOf(b.id));
    return list;
  }, [items, cat, deferred, categories, popular, popularIds]);

  // In "All" without a search, group by category with headings.
  const grouped = cat === "all" && !deferred;

  return (
    <div>
      <div className="sticky top-16 z-20 -mx-4 border-b border-line bg-cream/95 px-4 pt-3 pb-3 backdrop-blur-md sm:-mx-6 sm:px-6 lg:top-[72px] lg:-mx-8 lg:px-8">
        <div className="relative">
          <SearchIcon size={20} className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.menu.searchPlaceholder}
            aria-label={t.menu.searchPlaceholder}
            className="h-12 w-full rounded-2xl border border-line-strong bg-white ps-11 pe-11 text-[0.95rem] outline-none focus:border-saffron-500 focus:ring-4 focus:ring-saffron-100"
          />
          {query && (
            <button onClick={() => setQuery("")} className="absolute end-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted hover:bg-sand" aria-label={t.menu.clearSearch}>
              <CloseIcon size={18} />
            </button>
          )}
        </div>
        <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0" role="tablist" aria-label={t.menu.title}>
          {chips.map((c) => (
            <button
              key={c.slug}
              role="tab"
              aria-selected={cat === c.slug}
              onClick={() => selectCat(c.slug)}
              className={cn(
                "shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
                cat === c.slug ? "border-ink bg-ink text-cream" : "border-line-strong bg-white text-ink-soft hover:border-ink/40",
              )}
            >
              {c.slug === "popular" && "★ "}
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-5 text-sm text-muted" aria-live="polite">{fmt(t.menu.itemsCount, { count: filtered.length })}</p>

      {filtered.length === 0 ? (
        <div className="mt-10 rounded-3xl border border-dashed border-line-strong bg-white/60 p-12 text-center">
          <p className="text-lg font-semibold">{t.menu.noResults}</p>
          <button onClick={() => { setQuery(""); selectCat("all"); }} className="mt-3 font-semibold text-pomegranate-600 hover:underline">
            {t.menu.clearSearch}
          </button>
        </div>
      ) : grouped ? (
        [...categories, { id: null, slug: "more", nameEn: "More", nameAr: "المزيد" }].map((c) => {
          const list = filtered.filter((i) => i.categoryId === c.id);
          if (!list.length) return null;
          return (
            <section key={c.slug} className="mt-8 scroll-mt-40" id={c.slug}>
              <h2 className="heading-md mb-4">{locale === "ar" ? c.nameAr : c.nameEn}</h2>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {list.map((item) => <MenuCard key={item.id} item={item} popular={popular.has(item.id)} />)}
              </div>
            </section>
          );
        })
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((item, i) => <MenuCard key={item.id} item={item} priority={i < 4} popular={popular.has(item.id)} />)}
        </div>
      )}
    </div>
  );
}

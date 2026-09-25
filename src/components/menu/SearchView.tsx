"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "@/components/providers/I18nProvider";
import { CloseIcon, SearchIcon } from "@/components/ui/icons";
import type { MenuItemDTO } from "@/lib/data/menu";
import { fmt } from "@/lib/i18n/config";
import { MenuCard } from "./MenuCard";
import { matches } from "./MenuBrowser";

export function SearchView({ items, popularIds }: { items: MenuItemDTO[]; popularIds: number[] }) {
  const { t } = useI18n();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [q, setQ] = useState(params.get("q") ?? "");
  const deferred = useDeferredValue(q.trim());
  const input = useRef<HTMLInputElement>(null);
  const popular = useMemo(() => new Set(popularIds), [popularIds]);

  useEffect(() => input.current?.focus(), []);
  useEffect(() => {
    const id = setTimeout(() => router.replace(deferred ? `${pathname}?q=${encodeURIComponent(deferred)}` : pathname, { scroll: false }), 300);
    return () => clearTimeout(id);
  }, [deferred, pathname, router]);

  const results = deferred ? items.filter((i) => matches(i, deferred)) : items.filter((i) => popular.has(i.id));

  return (
    <div className="mt-6">
      <div className="relative">
        <SearchIcon size={22} className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-muted" />
        <input
          ref={input}
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t.search.placeholder}
          aria-label={t.search.placeholder}
          className="h-14 w-full rounded-2xl border border-line-strong bg-white ps-12 pe-12 text-lg shadow-[var(--shadow-card)] outline-none focus:border-saffron-500 focus:ring-4 focus:ring-saffron-100"
        />
        {q && (
          <button onClick={() => setQ("")} className="absolute end-3 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-muted hover:bg-sand" aria-label={t.menu.clearSearch}>
            <CloseIcon size={20} />
          </button>
        )}
      </div>
      <p className="mt-3 text-sm text-muted" aria-live="polite">
        {deferred ? fmt(t.search.results, { count: results.length, q: deferred }) : t.search.hint}
      </p>
      {deferred && results.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-dashed border-line-strong bg-white/60 p-12 text-center text-lg font-semibold">{t.menu.noResults}</div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((i) => <MenuCard key={i.id} item={i} popular={popular.has(i.id)} />)}
        </div>
      )}
    </div>
  );
}

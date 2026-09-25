"use client";

import Link from "next/link";
import { useI18n } from "@/components/providers/I18nProvider";
import { Badge } from "@/components/ui/Badge";
import { FoodImage } from "@/components/ui/FoodImage";
import { PlusIcon } from "@/components/ui/icons";
import type { MenuItemDTO } from "@/lib/data/menu";
import { pick } from "@/lib/i18n/config";
import { formatKWD } from "@/lib/money";
import { cn } from "@/lib/cn";
import { defaultOptionIds, useAddToCart } from "./useAddToCart";

export function MenuCard({ item, priority, popular }: { item: MenuItemDTO; priority?: boolean; popular?: boolean }) {
  const { t, locale } = useI18n();
  const addToCart = useAddToCart();
  const name = pick(item, "name", locale);
  const desc = pick(item, "description", locale);
  const hasOptions = item.optionGroups.length > 0;

  return (
    <article
      className={cn(
        "group card flex flex-col overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]",
        !item.isAvailable && "opacity-80",
      )}
    >
      <Link href={`/menu/${item.slug}`} className="relative block aspect-[4/3] overflow-hidden bg-sand" tabIndex={-1} aria-hidden="true">
        <FoodImage src={item.imageUrl} alt={name} priority={priority} className="size-full transition-transform duration-500 group-hover:scale-[1.04]" />
        <div className="absolute start-3 top-3 flex flex-wrap gap-1.5">
          {popular && <Badge tone="dark">★ {t.menu.popular}</Badge>}
          {item.tags.map((tag) => t.menu.tags[tag] && (
            <Badge key={tag} tone={tag === "spicy" ? "red" : tag === "veg" ? "green" : "saffron"} className="bg-white/95 backdrop-blur">
              {t.menu.tags[tag]}
            </Badge>
          ))}
        </div>
        {!item.isAvailable && (
          <div className="absolute inset-0 flex items-center justify-center bg-ink/45">
            <span className="rounded-full bg-white px-3 py-1 text-sm font-bold text-ink">{t.common.soldOut}</span>
          </div>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-[1.05rem] leading-snug font-bold text-ink">
          <Link href={`/menu/${item.slug}`} className="hover:text-pomegranate-600">
            {name}
          </Link>
        </h3>
        <p className="mt-1 line-clamp-2 text-sm text-muted">{desc}</p>
        <div className="mt-auto flex items-center justify-between gap-2 pt-4">
          <span className="text-[1.05rem] font-bold text-ink tabular-nums">{formatKWD(item.price, locale)}</span>
          {!item.isAvailable ? (
            <span className="text-sm font-semibold text-muted">{t.common.unavailable}</span>
          ) : hasOptions ? (
            <Link
              href={`/menu/${item.slug}`}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-saffron-400 px-3.5 text-sm font-bold text-ink transition-colors hover:bg-saffron-300"
            >
              <PlusIcon size={16} /> {t.menu.addToCart}
            </Link>
          ) : (
            <button
              onClick={() => addToCart(item, 1, defaultOptionIds(item))}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-saffron-400 px-3.5 text-sm font-bold text-ink transition-all hover:bg-saffron-300 active:scale-95"
              aria-label={`${t.menu.addToCart}: ${name}`}
            >
              <PlusIcon size={16} /> {t.menu.addToCart}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

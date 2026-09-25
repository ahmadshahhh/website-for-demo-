"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useI18n } from "@/components/providers/I18nProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { FoodImage } from "@/components/ui/FoodImage";
import { CartIcon, CheckIcon, ClockIcon } from "@/components/ui/icons";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import type { MenuItemDTO } from "@/lib/data/menu";
import { fmt, pick } from "@/lib/i18n/config";
import { formatKWD } from "@/lib/money";
import { cn } from "@/lib/cn";
import { defaultOptionIds, useAddToCart } from "./useAddToCart";

export function ItemDetail({ item, categoryName }: { item: MenuItemDTO; categoryName?: string }) {
  const { t, locale } = useI18n();
  const { toast } = useToast();
  const router = useRouter();
  const addToCart = useAddToCart();
  const [qty, setQty] = useState(1);
  const [selected, setSelected] = useState<number[]>(() => defaultOptionIds(item));
  const [missing, setMissing] = useState<number | null>(null);

  const name = pick(item, "name", locale);
  const allOptions = item.optionGroups.flatMap((g) => g.options);
  const unit = item.price + allOptions.filter((o) => selected.includes(o.id)).reduce((s, o) => s + o.priceDelta, 0);

  const toggle = (groupId: number, optionId: number) => {
    const g = item.optionGroups.find((x) => x.id === groupId)!;
    const inGroup = new Set(g.options.map((o) => o.id));
    setMissing(null);
    setSelected((cur) => {
      if (g.maxSelect === 1) return [...cur.filter((id) => !inGroup.has(id)), optionId];
      if (cur.includes(optionId)) return cur.filter((id) => id !== optionId);
      if (cur.filter((id) => inGroup.has(id)).length >= g.maxSelect) return cur;
      return [...cur, optionId];
    });
  };

  const submit = (goToCart: boolean) => {
    for (const g of item.optionGroups) {
      const n = g.options.filter((o) => selected.includes(o.id)).length;
      if (n < g.minSelect) {
        setMissing(g.id);
        toast(fmt(t.menu.chooseRequired, { name: pick(g, "name", locale) }), "error");
        return;
      }
    }
    addToCart(item, qty, selected);
    if (goToCart) router.push("/cart");
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-12">
      <div className="relative overflow-hidden rounded-3xl bg-sand shadow-[var(--shadow-card)]">
        <FoodImage src={item.imageUrl} alt={name} priority className="aspect-[4/3] w-full" />
        {!item.isAvailable && (
          <div className="absolute inset-0 flex items-center justify-center bg-ink/45">
            <span className="rounded-full bg-white px-4 py-1.5 font-bold">{t.common.soldOut}</span>
          </div>
        )}
      </div>

      <div className="flex flex-col">
        {categoryName && <p className="eyebrow">{categoryName}</p>}
        <h1 className="heading-lg mt-2">{name}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {item.isAvailable ? (
            <Badge tone="green"><CheckIcon size={13} /> {t.common.available}</Badge>
          ) : (
            <Badge tone="red"><ClockIcon size={13} /> {t.common.unavailable}</Badge>
          )}
          {item.tags.map((tag) => t.menu.tags[tag] && <Badge key={tag} tone={tag === "spicy" ? "red" : tag === "veg" ? "green" : "saffron"}>{t.menu.tags[tag]}</Badge>)}
        </div>
        <p className="mt-4 text-lg leading-relaxed text-ink-soft">{pick(item, "description", locale)}</p>
        <p className="mt-5 text-2xl font-bold tabular-nums">{formatKWD(item.price, locale)}</p>

        {!item.isAvailable ? (
          <p className="mt-6 rounded-2xl bg-pomegranate-50 p-4 font-medium text-pomegranate-700">{t.menu.unavailableNote}</p>
        ) : (
          <>
            {item.optionGroups.map((g) => (
              <fieldset
                key={g.id}
                className={cn("mt-6 rounded-2xl border bg-white p-4 transition-colors", missing === g.id ? "border-pomegranate-500 ring-4 ring-pomegranate-50" : "border-line")}
              >
                <legend className="px-1 font-bold">{pick(g, "name", locale)}</legend>
                <p className="mb-3 text-sm text-muted">
                  {g.minSelect > 0 ? fmt(t.menu.requiredChoice, { n: g.minSelect }) : fmt(t.menu.optionalChoice, { n: g.maxSelect })}
                </p>
                <div className="space-y-2">
                  {g.options.map((o) => {
                    const on = selected.includes(o.id);
                    return (
                      <label
                        key={o.id}
                        className={cn(
                          "flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-3 transition-colors",
                          on ? "border-saffron-500 bg-saffron-50" : "border-line hover:border-line-strong",
                          !o.isAvailable && "cursor-not-allowed opacity-50",
                        )}
                      >
                        <input
                          type={g.maxSelect === 1 ? "radio" : "checkbox"}
                          name={`group-${g.id}`}
                          checked={on}
                          disabled={!o.isAvailable}
                          onChange={() => toggle(g.id, o.id)}
                          className="size-5 accent-saffron-500"
                        />
                        <span className="flex-1 font-medium">{pick(o, "name", locale)}</span>
                        {o.priceDelta > 0 && <span className="text-sm font-semibold text-muted tabular-nums">+{formatKWD(o.priceDelta, locale)}</span>}
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            ))}

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <span className="text-sm font-semibold text-ink-soft">{t.menu.quantity}</span>
              <QuantityStepper value={qty} onChange={(v) => setQty(Math.max(1, v))} labels={t.menu} />
            </div>

            <div className="sticky bottom-3 z-10 mt-6 flex flex-col gap-3 rounded-2xl bg-cream/95 py-2 backdrop-blur sm:static sm:flex-row sm:bg-transparent sm:p-0">
              <Button size="lg" className="flex-1" onClick={() => submit(false)} icon={<CartIcon size={20} />}>
                {t.menu.addToCart} · <span className="tabular-nums">{formatKWD(unit * qty, locale)}</span>
              </Button>
              <Button size="lg" variant="outline" onClick={() => submit(true)}>
                {t.cart.checkout}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

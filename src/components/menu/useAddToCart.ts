"use client";

import { useCallback } from "react";
import { useCart } from "@/components/providers/CartProvider";
import { useI18n } from "@/components/providers/I18nProvider";
import { useToast } from "@/components/providers/ToastProvider";
import type { MenuItemDTO } from "@/lib/data/menu";
import { pick } from "@/lib/i18n/config";

export function useAddToCart() {
  const { add } = useCart();
  const { toast } = useToast();
  const { t, locale } = useI18n();
  return useCallback(
    (item: MenuItemDTO, quantity = 1, optionIds: number[] = []) => {
      const opts = item.optionGroups.flatMap((g) => g.options).filter((o) => optionIds.includes(o.id));
      add({
        itemId: item.id,
        slug: item.slug,
        nameEn: item.nameEn,
        nameAr: item.nameAr,
        imageUrl: item.imageUrl,
        optionIds,
        quantity,
        unitPrice: item.price + opts.reduce((s, o) => s + o.priceDelta, 0),
        optionNamesEn: opts.map((o) => o.nameEn),
        optionNamesAr: opts.map((o) => o.nameAr),
      });
      toast(`${pick(item, "name", locale)} · ${t.menu.added}`);
    },
    [add, toast, t, locale],
  );
}

/** Default selection: the first available option of every required group. */
export function defaultOptionIds(item: MenuItemDTO): number[] {
  return item.optionGroups.flatMap((g) =>
    g.minSelect > 0 ? g.options.filter((o) => o.isAvailable).slice(0, g.minSelect).map((o) => o.id) : [],
  );
}

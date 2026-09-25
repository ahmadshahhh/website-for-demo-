import "server-only";
import { getDeliveryAreas, getSettings, type RestaurantSettings } from "@/lib/data/settings";
import { getItemsByIds, type MenuItemDTO } from "@/lib/data/menu";
import { lineKey, MAX_LINES, MAX_QTY, type CartLineInput, type Quote, type QuotedLine } from "@/lib/cart/types";
import type { OrderItemOption } from "@/db/schema";
import { applyDiscounts } from "./discounts";

export type PricingContext = {
  orderType: "delivery" | "pickup";
  areaId?: number | null;
};

export type PricedLine = QuotedLine & { menuItem: MenuItemDTO | null; selectedOptions: OrderItemOption[] };

function validateOptions(item: MenuItemDTO, optionIds: number[]): OrderItemOption[] | null {
  const chosen = new Set(optionIds);
  const known = new Set(item.optionGroups.flatMap((g) => g.options.map((o) => o.id)));
  if ([...chosen].some((id) => !known.has(id))) return null;
  const selected: OrderItemOption[] = [];
  for (const g of item.optionGroups) {
    const picks = g.options.filter((o) => chosen.has(o.id));
    if (picks.length < g.minSelect || picks.length > g.maxSelect) return null;
    if (picks.some((o) => !o.isAvailable)) return null;
    selected.push(...picks.map((o) => ({ id: o.id, nameEn: o.nameEn, nameAr: o.nameAr, priceDelta: o.priceDelta })));
  }
  return selected;
}

/**
 * The single source of truth for money. Prices, option deltas, delivery fee,
 * minimum order and discounts are all computed here from the database — the
 * browser only ever sends item ids, option ids and quantities.
 */
export async function priceCart(
  input: CartLineInput[],
  ctx: PricingContext,
  settings?: RestaurantSettings,
): Promise<Omit<Quote, "lines"> & { lines: PricedLine[] }> {
  const s = settings ?? (await getSettings());

  // Merge duplicate lines and clamp quantities.
  const merged = new Map<string, CartLineInput>();
  for (const l of input.slice(0, MAX_LINES)) {
    if (!Number.isInteger(l.itemId) || !Number.isInteger(l.quantity) || l.quantity < 1) continue;
    const optionIds = [...new Set(l.optionIds.filter(Number.isInteger))];
    const key = lineKey(l.itemId, optionIds);
    const prev = merged.get(key);
    merged.set(key, { itemId: l.itemId, optionIds, quantity: Math.min(MAX_QTY, (prev?.quantity ?? 0) + l.quantity) });
  }

  const items = await getItemsByIds([...new Set([...merged.values()].map((l) => l.itemId))]);
  const byId = new Map(items.map((i) => [i.id, i]));

  const lines: PricedLine[] = [...merged.entries()].map(([key, l]) => {
    const item = byId.get(l.itemId) ?? null;
    const base = {
      key,
      itemId: l.itemId,
      quantity: l.quantity,
      optionIds: l.optionIds,
      slug: item?.slug ?? "",
      nameEn: item?.nameEn ?? "Unavailable item",
      nameAr: item?.nameAr ?? "صنف غير متوفر",
      imageUrl: item?.imageUrl ?? null,
      menuItem: item,
    };
    if (!item || !item.isAvailable) {
      return { ...base, optionNamesEn: [], optionNamesAr: [], unitPrice: item?.price ?? 0, lineTotal: 0, problem: "unavailable", selectedOptions: [] };
    }
    const selected = validateOptions(item, l.optionIds);
    if (!selected) {
      return { ...base, optionNamesEn: [], optionNamesAr: [], unitPrice: item.price, lineTotal: 0, problem: "options", selectedOptions: [] };
    }
    const unitPrice = item.price + selected.reduce((sum, o) => sum + o.priceDelta, 0);
    return {
      ...base,
      optionNamesEn: selected.map((o) => o.nameEn),
      optionNamesAr: selected.map((o) => o.nameAr),
      unitPrice,
      lineTotal: unitPrice * l.quantity,
      problem: null,
      selectedOptions: selected,
    };
  });

  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);

  let deliveryFee = 0;
  if (ctx.orderType === "delivery") {
    deliveryFee = s.deliveryFee;
    if (ctx.areaId) {
      const area = (await getDeliveryAreas({ activeOnly: true })).find((a) => a.id === ctx.areaId);
      if (area?.deliveryFee != null) deliveryFee = area.deliveryFee;
    }
  }

  const discount = Math.min(subtotal, applyDiscounts({ subtotal, orderType: ctx.orderType, settings: s }));
  const belowMinimum = ctx.orderType === "delivery" && subtotal < s.minimumOrder;

  return {
    lines,
    subtotal,
    deliveryFee,
    discount,
    total: subtotal + deliveryFee - discount,
    minimumOrder: s.minimumOrder,
    belowMinimum,
    hasProblems: lines.some((l) => l.problem !== null),
  };
}

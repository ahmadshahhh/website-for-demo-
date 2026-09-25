import type { RestaurantSettings } from "@/lib/data/settings";

/**
 * Discount pipeline. Each rule returns an amount in fils; the total discount
 * is their sum (capped at the subtotal by the caller). Coupons, loyalty
 * points or happy-hour rules can be added here without touching checkout.
 */
export type DiscountContext = {
  subtotal: number;
  orderType: "delivery" | "pickup";
  settings: RestaurantSettings;
};

type DiscountRule = (ctx: DiscountContext) => number;

const pickupDiscount: DiscountRule = ({ subtotal, orderType, settings }) =>
  orderType === "pickup" && settings.pickupDiscountPercent > 0
    ? Math.round((subtotal * settings.pickupDiscountPercent) / 100)
    : 0;

const RULES: DiscountRule[] = [pickupDiscount];

export function applyDiscounts(ctx: DiscountContext): number {
  return RULES.reduce((sum, rule) => sum + Math.max(0, rule(ctx)), 0);
}

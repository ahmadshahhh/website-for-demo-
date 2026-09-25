import "server-only";
import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { deliveryAreas, homepageContent, restaurantSettings } from "@/db/schema";

export type RestaurantSettings = typeof restaurantSettings.$inferSelect;
export type HomepageContent = typeof homepageContent.$inferSelect;
export type DeliveryArea = typeof deliveryAreas.$inferSelect;

export async function getSettings(): Promise<RestaurantSettings> {
  const db = await getDb();
  const [row] = await db.select().from(restaurantSettings).where(eq(restaurantSettings.id, 1));
  return row;
}

export async function getHomepageContent(): Promise<HomepageContent> {
  const db = await getDb();
  const [row] = await db.select().from(homepageContent).where(eq(homepageContent.id, 1));
  return row;
}

export async function getDeliveryAreas(opts: { activeOnly?: boolean } = {}) {
  const db = await getDb();
  const rows = await db
    .select()
    .from(deliveryAreas)
    .orderBy(asc(deliveryAreas.sortOrder), asc(deliveryAreas.id));
  return opts.activeOnly ? rows.filter((a) => a.isActive) : rows;
}

/** Only the fields the storefront needs — safe to pass to client components. */
export type PublicSettings = Pick<
  RestaurantSettings,
  | "nameEn"
  | "nameAr"
  | "logoUrl"
  | "phone"
  | "whatsapp"
  | "email"
  | "addressEn"
  | "addressAr"
  | "mapsUrl"
  | "instagram"
  | "openingHours"
  | "isOpen"
  | "closedMessageEn"
  | "closedMessageAr"
  | "deliveryEnabled"
  | "pickupEnabled"
  | "deliveryFee"
  | "minimumOrder"
  | "deliveryTimeMin"
  | "deliveryTimeMax"
  | "pickupTime"
  | "pickupDiscountPercent"
  | "cashEnabled"
  | "onlinePaymentEnabled"
>;

export function toPublicSettings(s: RestaurantSettings): PublicSettings {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, updatedAt, ...rest } = s;
  return rest;
}

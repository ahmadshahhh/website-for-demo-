/**
 * Saffron Yard database schema (SQLite / libSQL via Drizzle ORM).
 *
 * Conventions
 * - Money is stored as integer FILS (1 KWD = 1000 fils) — never floats.
 * - Every customer-facing text field has an English and an Arabic column.
 * - Timestamps are unix epoch milliseconds.
 * - Orders snapshot item names/prices so later menu edits never rewrite history.
 */
import { sql } from "drizzle-orm";
import {
  blob,
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

const now = sql`(unixepoch() * 1000)`;
const createdAt = () => integer("created_at", { mode: "number" }).notNull().default(now);
const updatedAt = () => integer("updated_at", { mode: "number" }).notNull().default(now);

/* ─────────────────────────────── Users ─────────────────────────────── */

export const adminUsers = sqliteTable("admin_users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  /** owner: full access · staff: orders only (enforced in lib/auth/admin). */
  role: text("role", { enum: ["owner", "staff"] }).notNull().default("owner"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  mustChangePassword: integer("must_change_password", { mode: "boolean" }).notNull().default(false),
  lastLoginAt: integer("last_login_at", { mode: "number" }),
  createdAt: createdAt(),
});

export const customers = sqliteTable("customers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  /** Normalised Kuwait mobile, digits only, e.g. 96550001234. */
  phone: text("phone").notNull().unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  preferredLocale: text("preferred_locale", { enum: ["en", "ar"] }).notNull().default("en"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const customerAddresses = sqliteTable(
  "customer_addresses",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    customerId: integer("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    label: text("label").notNull().default("Home"),
    areaId: integer("area_id").references(() => deliveryAreas.id, { onDelete: "set null" }),
    block: text("block").notNull(),
    street: text("street").notNull(),
    building: text("building").notNull(),
    floor: text("floor"),
    apartment: text("apartment"),
    instructions: text("instructions"),
    isDefault: integer("is_default", { mode: "boolean" }).notNull().default(false),
    createdAt: createdAt(),
  },
  (t) => [index("addresses_customer_idx").on(t.customerId)],
);

/** Opaque session tokens. Only the SHA-256 of the token is stored. */
export const sessions = sqliteTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    subjectType: text("subject_type", { enum: ["customer", "admin"] }).notNull(),
    subjectId: integer("subject_id").notNull(),
    expiresAt: integer("expires_at", { mode: "number" }).notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("sessions_subject_idx").on(t.subjectType, t.subjectId)],
);

/* ─────────────────────────────── Menu ─────────────────────────────── */

export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  nameEn: text("name_en").notNull(),
  nameAr: text("name_ar").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: createdAt(),
});

export const menuItems = sqliteTable(
  "menu_items",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    slug: text("slug").notNull().unique(),
    categoryId: integer("category_id").references(() => categories.id, { onDelete: "set null" }),
    nameEn: text("name_en").notNull(),
    nameAr: text("name_ar").notNull(),
    descriptionEn: text("description_en").notNull().default(""),
    descriptionAr: text("description_ar").notNull().default(""),
    /** Price in fils. */
    price: integer("price").notNull(),
    imageUrl: text("image_url"),
    isAvailable: integer("is_available", { mode: "boolean" }).notNull().default(true),
    /** Hidden items are kept for order history but not shown on the site. */
    isArchived: integer("is_archived", { mode: "boolean" }).notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    /** Optional dietary/marketing tags, comma separated (e.g. "spicy,veg"). */
    tags: text("tags").notNull().default(""),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("menu_items_category_idx").on(t.categoryId)],
);

/**
 * Customisation (ready for future use; the storefront and pricing engine
 * already honour it). A group is e.g. "Size" (single choice, required) or
 * "Extras" (multi choice, optional). Option prices are fils deltas.
 */
export const optionGroups = sqliteTable("option_groups", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  menuItemId: integer("menu_item_id")
    .notNull()
    .references(() => menuItems.id, { onDelete: "cascade" }),
  nameEn: text("name_en").notNull(),
  nameAr: text("name_ar").notNull(),
  minSelect: integer("min_select").notNull().default(0),
  maxSelect: integer("max_select").notNull().default(1),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const options = sqliteTable("options", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  groupId: integer("group_id")
    .notNull()
    .references(() => optionGroups.id, { onDelete: "cascade" }),
  nameEn: text("name_en").notNull(),
  nameAr: text("name_ar").notNull(),
  priceDelta: integer("price_delta").notNull().default(0),
  isAvailable: integer("is_available", { mode: "boolean" }).notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
});

/** Homepage featured items (the storefront shows the first 6). */
export const popularItems = sqliteTable("popular_items", {
  menuItemId: integer("menu_item_id")
    .primaryKey()
    .references(() => menuItems.id, { onDelete: "cascade" }),
  sortOrder: integer("sort_order").notNull().default(0),
});

/* ───────────────────────── Restaurant settings ───────────────────────── */

export type OpeningHours = { day: number; open: string; close: string; closed: boolean }[];

/** Single-row table (id = 1). */
export const restaurantSettings = sqliteTable("restaurant_settings", {
  id: integer("id").primaryKey(),
  nameEn: text("name_en").notNull(),
  nameAr: text("name_ar").notNull(),
  logoUrl: text("logo_url"),
  phone: text("phone").notNull().default(""),
  whatsapp: text("whatsapp").notNull().default(""),
  email: text("email").notNull().default(""),
  addressEn: text("address_en").notNull().default(""),
  addressAr: text("address_ar").notNull().default(""),
  mapsUrl: text("maps_url").notNull().default(""),
  instagram: text("instagram").notNull().default(""),
  openingHours: text("opening_hours", { mode: "json" }).$type<OpeningHours>().notNull(),
  isOpen: integer("is_open", { mode: "boolean" }).notNull().default(true),
  closedMessageEn: text("closed_message_en").notNull().default(""),
  closedMessageAr: text("closed_message_ar").notNull().default(""),
  deliveryEnabled: integer("delivery_enabled", { mode: "boolean" }).notNull().default(true),
  pickupEnabled: integer("pickup_enabled", { mode: "boolean" }).notNull().default(true),
  /** Default delivery fee in fils (an area may override it). */
  deliveryFee: integer("delivery_fee").notNull().default(500),
  /** Minimum subtotal for delivery orders, in fils. */
  minimumOrder: integer("minimum_order").notNull().default(3000),
  deliveryTimeMin: integer("delivery_time_min").notNull().default(35),
  deliveryTimeMax: integer("delivery_time_max").notNull().default(50),
  pickupTime: integer("pickup_time").notNull().default(20),
  /** Percentage discount on pickup orders (0 = off). */
  pickupDiscountPercent: integer("pickup_discount_percent").notNull().default(0),
  cashEnabled: integer("cash_enabled", { mode: "boolean" }).notNull().default(true),
  onlinePaymentEnabled: integer("online_payment_enabled", { mode: "boolean" }).notNull().default(true),
  updatedAt: updatedAt(),
});

/** Single-row table (id = 1): editable homepage copy and imagery. */
export const homepageContent = sqliteTable("homepage_content", {
  id: integer("id").primaryKey(),
  heroTitleEn: text("hero_title_en").notNull(),
  heroTitleAr: text("hero_title_ar").notNull(),
  taglineEn: text("tagline_en").notNull(),
  taglineAr: text("tagline_ar").notNull(),
  heroImageUrl: text("hero_image_url"),
  aboutTitleEn: text("about_title_en").notNull(),
  aboutTitleAr: text("about_title_ar").notNull(),
  aboutEn: text("about_en").notNull(),
  aboutAr: text("about_ar").notNull(),
  aboutImageUrl: text("about_image_url"),
  updatedAt: updatedAt(),
});

export const deliveryAreas = sqliteTable("delivery_areas", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  nameEn: text("name_en").notNull(),
  nameAr: text("name_ar").notNull(),
  /** Overrides the default delivery fee when set (fils). */
  deliveryFee: integer("delivery_fee"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
});

/* ─────────────────────────────── Orders ─────────────────────────────── */

export const ORDER_STATUSES = [
  "received",
  "accepted",
  "preparing",
  "ready",
  "out_for_delivery",
  "delivered",
  "picked_up",
  "cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_STATUSES = ["unpaid", "pending", "paid", "failed", "refunded"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const orders = sqliteTable(
  "orders",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    /** Unguessable public reference, e.g. SY-7K3M-Q9XD-2P. */
    trackingId: text("tracking_id").notNull().unique(),
    /** Client-generated key; a repeated submit returns the same order. */
    idempotencyKey: text("idempotency_key").notNull().unique(),
    customerId: integer("customer_id").references(() => customers.id, { onDelete: "set null" }),
    isGuest: integer("is_guest", { mode: "boolean" }).notNull(),
    customerName: text("customer_name").notNull(),
    phone: text("phone").notNull(),
    email: text("email"),
    orderType: text("order_type", { enum: ["delivery", "pickup"] }).notNull(),
    areaId: integer("area_id"),
    areaName: text("area_name"),
    block: text("block"),
    street: text("street"),
    building: text("building"),
    floor: text("floor"),
    apartment: text("apartment"),
    instructions: text("instructions"),
    subtotal: integer("subtotal").notNull(),
    deliveryFee: integer("delivery_fee").notNull().default(0),
    discount: integer("discount").notNull().default(0),
    total: integer("total").notNull(),
    paymentMethod: text("payment_method", { enum: ["cash", "online"] }).notNull(),
    paymentStatus: text("payment_status", { enum: PAYMENT_STATUSES }).notNull(),
    status: text("status", { enum: ORDER_STATUSES }).notNull().default("received"),
    cancelReason: text("cancel_reason"),
    locale: text("locale", { enum: ["en", "ar"] }).notNull().default("en"),
    /** False until a staff member opens it — drives the "new order" alert. */
    seenByStaff: integer("seen_by_staff", { mode: "boolean" }).notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("orders_customer_idx").on(t.customerId),
    index("orders_status_idx").on(t.status),
    index("orders_created_idx").on(t.createdAt),
    index("orders_phone_idx").on(t.phone),
  ],
);

export type OrderItemOption = { id: number; nameEn: string; nameAr: string; priceDelta: number };

export const orderItems = sqliteTable(
  "order_items",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    orderId: integer("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    menuItemId: integer("menu_item_id").references(() => menuItems.id, { onDelete: "set null" }),
    nameEn: text("name_en").notNull(),
    nameAr: text("name_ar").notNull(),
    imageUrl: text("image_url"),
    /** Unit price including selected option deltas, fils. */
    unitPrice: integer("unit_price").notNull(),
    quantity: integer("quantity").notNull(),
    options: text("options", { mode: "json" }).$type<OrderItemOption[]>().notNull(),
    lineTotal: integer("line_total").notNull(),
  },
  (t) => [index("order_items_order_idx").on(t.orderId)],
);

export const orderStatusHistory = sqliteTable(
  "order_status_history",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    orderId: integer("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    status: text("status", { enum: ORDER_STATUSES }).notNull(),
    note: text("note"),
    /** "customer" | "system" | "admin:<id>" */
    actor: text("actor").notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("status_history_order_idx").on(t.orderId)],
);

/**
 * One row per payment attempt. Holds only gateway references and amounts —
 * never card numbers, CVV, expiry or any other cardholder data.
 */
export const payments = sqliteTable(
  "payments",
  {
    id: text("id").primaryKey(),
    orderId: integer("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(),
    method: text("method", { enum: ["cash", "online"] }).notNull(),
    amount: integer("amount").notNull(),
    currency: text("currency").notNull().default("KWD"),
    status: text("status", { enum: PAYMENT_STATUSES }).notNull(),
    providerReference: text("provider_reference"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("payments_order_idx").on(t.orderId)],
);

/* ─────────────────────────────── Infra ─────────────────────────────── */

/** Uploaded images, stored in the database so they survive redeploys. */
export const media = sqliteTable("media", {
  id: text("id").primaryKey(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  data: blob("data", { mode: "buffer" }).notNull(),
  createdAt: createdAt(),
});

/** Fixed-window rate limiting shared across server instances. */
export const rateLimits = sqliteTable(
  "rate_limits",
  {
    bucket: text("bucket").notNull(),
    key: text("key").notNull(),
    count: integer("count").notNull().default(0),
    windowStart: integer("window_start", { mode: "number" }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.bucket, t.key] })],
);

export const appSecrets = sqliteTable("app_secrets", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

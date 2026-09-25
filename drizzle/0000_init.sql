CREATE TABLE IF NOT EXISTS `admin_users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`password_hash` text NOT NULL,
	`role` text DEFAULT 'owner' NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`must_change_password` integer DEFAULT false NOT NULL,
	`last_login_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `admin_users_email_unique` ON `admin_users` (`email`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `app_secrets` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`name_en` text NOT NULL,
	`name_ar` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `categories_slug_unique` ON `categories` (`slug`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `customer_addresses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`customer_id` integer NOT NULL,
	`label` text DEFAULT 'Home' NOT NULL,
	`area_id` integer,
	`block` text NOT NULL,
	`street` text NOT NULL,
	`building` text NOT NULL,
	`floor` text,
	`apartment` text,
	`instructions` text,
	`is_default` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`area_id`) REFERENCES `delivery_areas`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `addresses_customer_idx` ON `customer_addresses` (`customer_id`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `customers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`phone` text NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`preferred_locale` text DEFAULT 'en' NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `customers_phone_unique` ON `customers` (`phone`);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `customers_email_unique` ON `customers` (`email`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `delivery_areas` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name_en` text NOT NULL,
	`name_ar` text NOT NULL,
	`delivery_fee` integer,
	`is_active` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `homepage_content` (
	`id` integer PRIMARY KEY NOT NULL,
	`hero_title_en` text NOT NULL,
	`hero_title_ar` text NOT NULL,
	`tagline_en` text NOT NULL,
	`tagline_ar` text NOT NULL,
	`hero_image_url` text,
	`about_title_en` text NOT NULL,
	`about_title_ar` text NOT NULL,
	`about_en` text NOT NULL,
	`about_ar` text NOT NULL,
	`about_image_url` text,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `media` (
	`id` text PRIMARY KEY NOT NULL,
	`mime_type` text NOT NULL,
	`size` integer NOT NULL,
	`data` blob NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `menu_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`category_id` integer,
	`name_en` text NOT NULL,
	`name_ar` text NOT NULL,
	`description_en` text DEFAULT '' NOT NULL,
	`description_ar` text DEFAULT '' NOT NULL,
	`price` integer NOT NULL,
	`image_url` text,
	`is_available` integer DEFAULT true NOT NULL,
	`is_archived` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`tags` text DEFAULT '' NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `menu_items_slug_unique` ON `menu_items` (`slug`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `menu_items_category_idx` ON `menu_items` (`category_id`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `option_groups` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`menu_item_id` integer NOT NULL,
	`name_en` text NOT NULL,
	`name_ar` text NOT NULL,
	`min_select` integer DEFAULT 0 NOT NULL,
	`max_select` integer DEFAULT 1 NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`menu_item_id`) REFERENCES `menu_items`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `options` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`group_id` integer NOT NULL,
	`name_en` text NOT NULL,
	`name_ar` text NOT NULL,
	`price_delta` integer DEFAULT 0 NOT NULL,
	`is_available` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`group_id`) REFERENCES `option_groups`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `order_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` integer NOT NULL,
	`menu_item_id` integer,
	`name_en` text NOT NULL,
	`name_ar` text NOT NULL,
	`image_url` text,
	`unit_price` integer NOT NULL,
	`quantity` integer NOT NULL,
	`options` text NOT NULL,
	`line_total` integer NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`menu_item_id`) REFERENCES `menu_items`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `order_items_order_idx` ON `order_items` (`order_id`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `order_status_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` integer NOT NULL,
	`status` text NOT NULL,
	`note` text,
	`actor` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `status_history_order_idx` ON `order_status_history` (`order_id`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `orders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tracking_id` text NOT NULL,
	`idempotency_key` text NOT NULL,
	`customer_id` integer,
	`is_guest` integer NOT NULL,
	`customer_name` text NOT NULL,
	`phone` text NOT NULL,
	`email` text,
	`order_type` text NOT NULL,
	`area_id` integer,
	`area_name` text,
	`block` text,
	`street` text,
	`building` text,
	`floor` text,
	`apartment` text,
	`instructions` text,
	`subtotal` integer NOT NULL,
	`delivery_fee` integer DEFAULT 0 NOT NULL,
	`discount` integer DEFAULT 0 NOT NULL,
	`total` integer NOT NULL,
	`payment_method` text NOT NULL,
	`payment_status` text NOT NULL,
	`status` text DEFAULT 'received' NOT NULL,
	`cancel_reason` text,
	`locale` text DEFAULT 'en' NOT NULL,
	`seen_by_staff` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `orders_tracking_id_unique` ON `orders` (`tracking_id`);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `orders_idempotency_key_unique` ON `orders` (`idempotency_key`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `orders_customer_idx` ON `orders` (`customer_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `orders_status_idx` ON `orders` (`status`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `orders_created_idx` ON `orders` (`created_at`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `orders_phone_idx` ON `orders` (`phone`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `payments` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` integer NOT NULL,
	`provider` text NOT NULL,
	`method` text NOT NULL,
	`amount` integer NOT NULL,
	`currency` text DEFAULT 'KWD' NOT NULL,
	`status` text NOT NULL,
	`provider_reference` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `payments_order_idx` ON `payments` (`order_id`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `popular_items` (
	`menu_item_id` integer PRIMARY KEY NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`menu_item_id`) REFERENCES `menu_items`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `rate_limits` (
	`bucket` text NOT NULL,
	`key` text NOT NULL,
	`count` integer DEFAULT 0 NOT NULL,
	`window_start` integer NOT NULL,
	PRIMARY KEY(`bucket`, `key`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `restaurant_settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`name_en` text NOT NULL,
	`name_ar` text NOT NULL,
	`logo_url` text,
	`phone` text DEFAULT '' NOT NULL,
	`whatsapp` text DEFAULT '' NOT NULL,
	`email` text DEFAULT '' NOT NULL,
	`address_en` text DEFAULT '' NOT NULL,
	`address_ar` text DEFAULT '' NOT NULL,
	`maps_url` text DEFAULT '' NOT NULL,
	`instagram` text DEFAULT '' NOT NULL,
	`opening_hours` text NOT NULL,
	`is_open` integer DEFAULT true NOT NULL,
	`closed_message_en` text DEFAULT '' NOT NULL,
	`closed_message_ar` text DEFAULT '' NOT NULL,
	`delivery_enabled` integer DEFAULT true NOT NULL,
	`pickup_enabled` integer DEFAULT true NOT NULL,
	`delivery_fee` integer DEFAULT 500 NOT NULL,
	`minimum_order` integer DEFAULT 3000 NOT NULL,
	`delivery_time_min` integer DEFAULT 35 NOT NULL,
	`delivery_time_max` integer DEFAULT 50 NOT NULL,
	`pickup_time` integer DEFAULT 20 NOT NULL,
	`pickup_discount_percent` integer DEFAULT 0 NOT NULL,
	`cash_enabled` integer DEFAULT true NOT NULL,
	`online_payment_enabled` integer DEFAULT true NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`subject_type` text NOT NULL,
	`subject_id` integer NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `sessions_subject_idx` ON `sessions` (`subject_type`,`subject_id`);
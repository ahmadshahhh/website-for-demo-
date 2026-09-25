# Saffron Yard — Online Ordering Platform

A complete restaurant ordering system for **Saffron Yard** (Kuwait): customer
website, customer accounts, guest checkout, live order tracking, and a
separate restaurant admin panel. Fully bilingual — **English | العربية** — with
proper right-to-left layout in Arabic.

Built with Next.js 16 (App Router, Server Actions), TypeScript, Tailwind CSS v4,
Drizzle ORM and SQLite/libSQL.

---

## Contents

1. [Run it locally](#run-it-locally)
2. [Admin panel](#admin-panel)
3. [What's included](#whats-included)
4. [How ordering works](#how-ordering-works)
5. [Security](#security)
6. [Payments](#payments)
7. [Images](#images)
8. [Database](#database)
9. [Deploying](#deploying)
10. [Project structure](#project-structure)
11. [Extending](#extending)

---

## Run it locally

Requires Node.js 20.9+.

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. No configuration is needed: on first request the
app creates the database (`data/saffron-yard.db`), applies migrations and seeds
the menu, categories, delivery areas, settings and the first admin account.

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / server |
| `npm run typecheck` | TypeScript |
| `npm run lint` | ESLint |
| `npm run check` | Typecheck + lint + build |
| `npm run db:generate` | Create a new SQL migration after editing `src/db/schema.ts` |
| `npm run db:migrate` | Apply migrations to `DATABASE_URL` (local file or Turso) |
| `npm run db:studio` | Browse the database in Drizzle Studio |

Copy `.env.example` to `.env.local` to override anything (database URL, admin
credentials, signing secret, payment provider, site URL).

## Admin panel

Go to **`/admin`** (there is also a "Staff login" link in the footer).

Default first-run login — **change the password immediately** (a banner
reminds you until you do, under *Admin → My Account*):

```
Email:    admin@saffronyard.kw
Password: ChangeMe-Saffron-2026
```

Set `ADMIN_EMAIL` / `ADMIN_PASSWORD` before the first start to choose your own.

## What's included

**Customer website** (English + Arabic, mobile-first)

- Home — hero, exactly 6 featured popular items, features, about, delivery &
  pickup info, contact/location, opening hours, footer
- Menu — 29 dishes, search, category chips (Popular, All, Starters, Main
  Course, Burgers, Pizza, Rice, Drinks, Desserts), availability
- Item detail page — large photo, description, price, availability, quantity,
  customisation options (e.g. pizza size, burger extras)
- Search page (bilingual, tolerant of Arabic spelling variants)
- Cart — images, quantity steppers, remove, subtotal, delivery fee, total;
  prices re-checked by the server
- Checkout — log in / sign up **or continue as guest**; delivery (area, block,
  street, building, floor, apartment, instructions) or pickup; cash or online
  payment; saved addresses for signed-in customers
- Order confirmation + live tracking with a status timeline
- Track Order (tracking ID + phone), Log in, Sign up, My Account (profile,
  saved addresses, current & previous orders, order details, reorder, logout),
  About, Contact
- Language switcher in the header — choice is remembered (cookie, and on the
  customer profile)

**Admin panel** (also bilingual)

- Dashboard — new / active / today's / completed orders, today's sales, menu
  item count, popular items, restaurant open/closed switch, quick actions,
  latest orders, best sellers
- Orders — tabs (New, Active, Completed, Cancelled, All), search, live refresh
  every 10 s, **sound + badge alert for new orders**, full order view with
  customer (guest/registered), phone, address, items, totals, payment method &
  status, order time; accept, advance status, cancel with reason, mark paid,
  call / WhatsApp the customer, print
- Menu items — add, edit, delete, upload images, price, English/Arabic names
  and descriptions, category, popular flag, available/unavailable toggle,
  reorder, customisation option groups
- Popular items — add, remove, reorder (homepage shows the first 6)
- Categories — add, edit, delete, reorder, show/hide (English + Arabic)
- Customers — registered customers with order counts and spend; guest orders
  grouped by phone; customer detail with addresses and order history (no
  passwords or payment data are ever shown)
- Homepage content — hero headline, tagline, hero image, about text & image
- Delivery areas — add/edit/delete, per-area fee override
- Settings — name, logo, phone, WhatsApp, email, address, Google Maps link,
  Instagram, opening hours, open/closed + message, delivery fee, minimum order,
  delivery/pickup times, pickup availability, pickup discount, payment methods

## How ordering works

```
Browse → Item → (Options) → Cart → Login / Sign up / Guest → Delivery or Pickup
→ Cash or Online → Place Order → Admin alerted → Accept → Preparing → Ready
→ Out for Delivery / Ready for Pickup → Delivered / Picked Up
```

When a customer presses **Place Order** (`src/lib/orders/service.ts`):

1. All input is validated with Zod (Kuwait mobile numbers are normalised).
2. The restaurant must be open, and the chosen order type and payment method
   enabled.
3. Every item and option is re-checked for availability.
4. Prices, option charges, delivery fee (per area), minimum order and discounts
   are **recalculated on the server** — the browser only sends item ids and
   quantities.
5. The order, its items (snapshotted names/prices), a status-history entry and
   a payment record are written in one transaction.
6. An unguessable tracking ID is generated (e.g. `SY-7K3M-Q9XD-2P`).
7. The customer sees the confirmation page; the admin panel picks the order up
   within seconds (badge, chime, toast, tab-title counter).

Duplicate orders from repeated clicks are impossible: the button locks, and
each checkout carries an idempotency key that is unique in the database — a
retry returns the original order.

**Status flows**

| Delivery (admin → customer) | Pickup (admin → customer) |
| --- | --- |
| New → Order Received | New → Order Received |
| Accepted → Confirmed | Accepted → Confirmed |
| Preparing | Preparing |
| Ready | Ready for Pickup |
| Out for Delivery | Picked Up |
| Delivered | |

The customer's tracking page refreshes automatically every 15 seconds.

## Security

- Passwords hashed with **scrypt** (Node built-in), constant-time verification,
  dummy-hash comparison for unknown accounts.
- Sessions are random 256-bit tokens in **httpOnly, SameSite=Lax, Secure (in
  production)** cookies; only a SHA-256 of the token is stored. Separate
  customer and admin sessions; admin sessions expire after 12 hours. Changing a
  password signs out other devices.
- Every admin page, Server Action and API route checks the admin session on the
  server (`src/lib/auth/guards.ts`); owner-only areas are enforced for staff
  accounts. `proxy.ts` only does optimistic redirects.
- Customer data is always queried by the signed-in customer's id — another
  customer's order or address is indistinguishable from a missing one.
- **Orders are never accessible by order number.** A guest must present
  tracking ID **and** phone number; success adds the order to a signed
  (HMAC-SHA256) httpOnly cookie. Tracking IDs have ~49 bits of CSPRNG
  randomness.
- **Rate limiting** (stored in the database, so it holds across restarts and
  instances): guest tracking per IP and per tracking ID, customer and admin
  login, sign-up, order placement.
- Server-side price calculation, Zod validation on every input, uploaded
  images verified by magic bytes (JPEG/PNG/WebP only — no SVG), served with
  `nosniff` and a locked-down CSP.
- Security headers: `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`,
  `Permissions-Policy`; `X-Powered-By` removed. Server Actions have Next.js's
  built-in origin (CSRF) check.
- No card data is ever collected or stored (see Payments).

## Payments

Cash on delivery / pay at pickup works out of the box.

Online payment uses a pluggable gateway interface
(`src/lib/payments/types.ts`). The customer is always **redirected to the
gateway's hosted page**, so card numbers and CVV never touch this app; only
gateway references, amounts and statuses are stored (`payments` table).

The built-in `simulator` provider is a clearly-labelled test gateway
(`/pay/[id]`) with "approve" / "decline" buttons. Outcomes are HMAC-signed, so a
forged callback is rejected. Failed or abandoned payments can be retried from
the order page.

**Connecting a real Kuwait gateway** (KNET via MyFatoorah, Tap, UPayments,
Hesabe, …):

1. Add `src/lib/payments/providers/<name>.ts` implementing `PaymentProvider`:
   `initiate()` creates the payment with the gateway and returns its hosted-page
   URL; `verifyCallback()` verifies the gateway's signature (or re-queries the
   payment by id) and returns `paid` / `failed`.
2. Register it in `src/lib/payments/registry.ts`.
3. Set `PAYMENT_PROVIDER=<name>` plus the gateway's keys, and point the
   gateway's callback/webhook at `https://<your-domain>/api/payments/<name>/callback`.

## Images

The seeded menu uses **real food photography from Unsplash** (free for
commercial use under the [Unsplash License](https://unsplash.com/license)).
On first start the server downloads each photo into its own database (see
`src/db/localize-images.ts`), so the live site serves every image itself and
doesn't depend on Unsplash. If a download fails (e.g. no internet access), the
Unsplash URL is kept and retried on the next start. Set `LOCALIZE_IMAGES=0` to
turn this off.

The stock photos are placeholders. Replace them with photos of your own dishes
in **Admin → Menu Items → Edit → Upload image** (and **Admin → Homepage** for the
hero/about images). Uploads are stored in the database, so they survive
redeploys.

## Database

SQLite locally, [libSQL/Turso](https://turso.tech) in production (same code,
same migrations). Schema: `src/db/schema.ts`; migrations: `drizzle/`.

Tables: `admin_users`, `customers`, `customer_addresses`, `sessions`,
`categories`, `menu_items`, `option_groups`, `options`, `popular_items`,
`restaurant_settings`, `homepage_content`, `delivery_areas`, `orders`,
`order_items`, `order_status_history`, `payments`, `media`, `rate_limits`,
`app_secrets`.

Money is stored as integer **fils** (1 KWD = 1000 fils) — never floats.

## Deploying

**Any Node host with a persistent disk** (VPS, Railway, Render, Fly.io):
`npm ci && npm run build && npm start`. Keep the `data/` directory on a
persistent volume, or set `DATABASE_URL` to Turso.

**Vercel + Turso:**

1. In Vercel → Project → Settings → Environment Variables add, for
   **Production and Preview**:

   | Name | Value |
   | --- | --- |
   | `DATABASE_URL` | `libsql://<db>-<org>.turso.io` (`turso db show <db> --url`) |
   | `DATABASE_AUTH_TOKEN` | a **read-write** token (`turso db tokens create <db>`) |
   | `AUTH_SECRET` | output of `openssl rand -base64 32` |
   | `ADMIN_EMAIL` | the owner's email |
   | `ADMIN_PASSWORD` | a strong password (used only when the first admin is created) |
   | `NEXT_PUBLIC_SITE_URL` | `https://your-domain.com` (optional; defaults to the Vercel URL) |

   `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` (the names Vercel's Turso
   integration creates) also work.
2. Redeploy (environment changes only apply to new deployments).
3. Open **`/api/health`** on the deployed site. It reports which variables are
   set (never their values), whether Turso is reachable, whether all 19 tables
   exist and whether seed data is present — or the exact error if not.

Tables and seed data are created automatically on the first request. The
migration is idempotent, so it also works on a database whose tables were
created earlier with `drizzle-kit push` or `npm run db:migrate`, and several
instances starting at once can't collide. To create the tables yourself:

```bash
DATABASE_URL=libsql://<db>-<org>.turso.io DATABASE_AUTH_TOKEN=<token> npm run db:migrate
```

(`npm run db:studio` with the same variables opens Drizzle Studio.)

Uploads are limited to 4 MB per image (Vercel's request limit is 4.5 MB).

## Project structure

```
src/
  app/
    (store)/            customer website (home, menu, cart, checkout, order,
                        track, account, login, signup, about, contact, pay)
    admin/              admin login + (panel)/ pages and Server Actions
    actions/            customer Server Actions (auth, cart, checkout, track, account)
    api/                media, payment callbacks, admin new-order pulse
  components/           UI kit, store, menu, cart, checkout, order, account, admin
  db/                   schema, client (auto-migrate), seed data, image localiser
  lib/
    auth/               password hashing, sessions, guards
    orders/             pricing, discounts, status flows, tracking IDs, access, service
    payments/           gateway interface, registry, simulator
    i18n/               English + Arabic dictionaries, locale helpers
    data/               read models for store and admin
  proxy.ts              optimistic auth redirects
drizzle/                SQL migrations
```

## Extending

The code is organised so common next steps don't need a rebuild:

- **Coupons / loyalty** — add a rule to `src/lib/orders/discounts.ts`; the
  checkout, order totals and admin already show discounts.
- **Payment gateways** — see [Payments](#payments).
- **Delivery drivers** — add a `drivers` table and an `out_for_delivery` hook in
  `updateOrderStatusAction`; the status history already records who changed what.
- **Notifications (SMS / WhatsApp / email)** — hook into `placeOrder` and
  `updateOrderStatusAction`; orders store the customer's language.
- **Analytics** — orders, items and status history are all timestamped;
  `src/lib/data/admin.ts` shows the query style.
- **Staff accounts** — `admin_users.role` supports `staff` (orders, customers
  and dashboard only).
- **More item customisation** — option groups (min/max selections, price
  deltas) are already supported end to end and editable per item in the admin.

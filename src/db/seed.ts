import { sql } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import { hashPassword } from "@/lib/auth/password";
import type { DB } from "./index";
import * as s from "./schema";
import {
  seedAreas,
  seedCategories,
  seedItems,
  seedOpeningHours,
  seedOptionGroups,
  seedPopular,
  seedPhotos,
  unsplash,
  heroPhoto,
  aboutPhoto,
} from "./seed-data";

const SEED_MARKER = "seed_version";
const SEED_VERSION = "1";

/**
 * First-run seed. Runs once per database:
 * - A marker row in app_secrets records that seeding happened, so nothing the
 *   restaurant later edits or deletes is ever re-created.
 * - Every row has an explicit id and is inserted with ON CONFLICT DO NOTHING in
 *   ONE atomic batch, so several server instances starting at the same moment
 *   (normal on Vercel) can't collide or duplicate data — and it is a single
 *   round-trip to Turso.
 */
export async function seedDatabase(db: DB) {
  const [state] = await db
    .select({
      marker: sql<number>`(select count(*) from ${s.appSecrets} where ${s.appSecrets.key} = ${SEED_MARKER})`,
      settings: sql<number>`(select count(*) from ${s.restaurantSettings})`,
    })
    .from(sql`(select 1)`);
  if (Number(state.marker) > 0) return;

  const marker = db.insert(s.appSecrets).values({ key: SEED_MARKER, value: SEED_VERSION }).onConflictDoNothing();

  // A database seeded by an earlier version of the app: just record the marker.
  if (Number(state.settings) > 0) {
    await marker;
    return;
  }

  const catId = new Map(seedCategories.map((c, i) => [c.slug, i + 1]));
  const itemRows = seedItems.map((item, i) => ({
    id: i + 1,
    slug: item.slug,
    categoryId: catId.get(item.category) ?? null,
    nameEn: item.nameEn,
    nameAr: item.nameAr,
    descriptionEn: item.descriptionEn,
    descriptionAr: item.descriptionAr,
    price: item.price,
    imageUrl: seedPhotos[item.slug] ? unsplash(seedPhotos[item.slug]) : null,
    isAvailable: item.isAvailable ?? true,
    tags: item.tags ?? "",
    sortOrder: i,
  }));
  const itemId = new Map(itemRows.map((r) => [r.slug, r.id]));

  const groupRows: (typeof s.optionGroups.$inferInsert)[] = [];
  const optionRows: (typeof s.options.$inferInsert)[] = [];
  for (const group of seedOptionGroups) {
    for (const item of itemRows.filter((r) => r.categoryId === catId.get(group.categorySlug))) {
      const groupId = groupRows.length + 1;
      groupRows.push({ id: groupId, menuItemId: item.id, nameEn: group.nameEn, nameAr: group.nameAr, minSelect: group.minSelect, maxSelect: group.maxSelect });
      group.options.forEach((o, i) => optionRows.push({ ...o, id: optionRows.length + 1, groupId, sortOrder: i }));
    }
  }

  const adminEmail = (process.env.ADMIN_EMAIL || "admin@saffronyard.kw").toLowerCase().trim();
  const adminPassword = process.env.ADMIN_PASSWORD || "ChangeMe-Saffron-2026";

  const statements: [BatchItem<"sqlite">, ...BatchItem<"sqlite">[]] = [
    db.insert(s.restaurantSettings).values({
      id: 1,
      nameEn: "Saffron Yard",
      nameAr: "ساحة الزعفران",
      logoUrl: null,
      phone: "+965 2222 7788",
      whatsapp: "96550007788",
      email: "hello@saffronyard.kw",
      addressEn: "Salem Al Mubarak Street, Block 5, Salmiya, Kuwait",
      addressAr: "شارع سالم المبارك، قطعة ٥، السالمية، الكويت",
      mapsUrl: "https://maps.google.com/?q=Salem+Al+Mubarak+Street+Salmiya+Kuwait",
      instagram: "saffronyard.kw",
      openingHours: seedOpeningHours,
      isOpen: true,
      closedMessageEn: "We're closed right now. You can browse the menu and order when we reopen.",
      closedMessageAr: "نحن مغلقون حالياً. يمكنك تصفح القائمة والطلب عند إعادة الافتتاح.",
      deliveryFee: 500,
      minimumOrder: 3000,
      deliveryTimeMin: 35,
      deliveryTimeMax: 50,
      pickupTime: 20,
      pickupDiscountPercent: 10,
    }).onConflictDoNothing(),
    db.insert(s.homepageContent).values({
      id: 1,
      heroTitleEn: "Slow-cooked flavour, delivered fast.",
      heroTitleAr: "نكهات مطهوة على مهل، تصلك بسرعة.",
      taglineEn:
        "Charcoal grills, saffron rice and Kuwaiti favourites — made fresh in our Salmiya kitchen and at your door in under an hour.",
      taglineAr:
        "مشاوي على الفحم وأرز بالزعفران وأطباق كويتية مفضلة، تُحضّر طازجة في مطبخنا بالسالمية وتصلك في أقل من ساعة.",
      heroImageUrl: unsplash(heroPhoto, 1600),
      aboutTitleEn: "A courtyard kitchen with a saffron heart",
      aboutTitleAr: "مطبخ الساحة بقلب من الزعفران",
      aboutEn:
        "Saffron Yard started with a simple idea: the dishes we grew up sharing in family courtyards deserve the same care as any fine-dining plate. We marinate overnight, grill over real charcoal and bloom our saffron by hand every morning. Whether you're feeding the whole diwaniya or ordering lunch for one, every box leaves our kitchen the way we'd serve it at home.",
      aboutAr:
        "بدأت ساحة الزعفران بفكرة بسيطة: الأطباق التي كبرنا ونحن نتشاركها في ساحات البيوت تستحق العناية نفسها التي تحظى بها أرقى المطاعم. نتبّل اللحوم طوال الليل، ونشويها على الفحم الحقيقي، وننقع الزعفران بأيدينا كل صباح. سواء كنت تطلب للديوانية كلها أو غداءً لشخص واحد، يخرج كل طلب من مطبخنا كما نقدمه في بيوتنا.",
      aboutImageUrl: unsplash(aboutPhoto),
    }).onConflictDoNothing(),
    db
      .insert(s.deliveryAreas)
      .values(seedAreas.map((a, i) => ({ ...a, id: i + 1, deliveryFee: a.deliveryFee ?? null, sortOrder: i })))
      .onConflictDoNothing(),
    db
      .insert(s.categories)
      .values(seedCategories.map((c, i) => ({ ...c, id: i + 1, sortOrder: i })))
      .onConflictDoNothing(),
    db.insert(s.menuItems).values(itemRows).onConflictDoNothing(),
    db
      .insert(s.popularItems)
      .values(seedPopular.filter((slug) => itemId.has(slug)).map((slug, i) => ({ menuItemId: itemId.get(slug)!, sortOrder: i })))
      .onConflictDoNothing(),
    db
      .insert(s.adminUsers)
      .values({
        email: adminEmail,
        name: "Restaurant Owner",
        passwordHash: await hashPassword(adminPassword),
        role: "owner",
        mustChangePassword: !process.env.ADMIN_PASSWORD,
      })
      .onConflictDoNothing(),
    marker,
  ];
  if (groupRows.length) statements.push(db.insert(s.optionGroups).values(groupRows).onConflictDoNothing());
  if (optionRows.length) statements.push(db.insert(s.options).values(optionRows).onConflictDoNothing());

  await db.batch(statements);
}

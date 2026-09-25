import { count } from "drizzle-orm";
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

/**
 * Idempotent first-run seed. Each block only runs when its table is empty,
 * so it never overwrites anything the restaurant has edited.
 */
export async function seedDatabase(db: DB) {
  const [{ n: settingsCount }] = await db.select({ n: count() }).from(s.restaurantSettings);
  if (settingsCount === 0) {
    await db.insert(s.restaurantSettings).values({
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
    });
  }

  const [{ n: homeCount }] = await db.select({ n: count() }).from(s.homepageContent);
  if (homeCount === 0) {
    await db.insert(s.homepageContent).values({
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
    });
  }

  const [{ n: areaCount }] = await db.select({ n: count() }).from(s.deliveryAreas);
  if (areaCount === 0) {
    await db.insert(s.deliveryAreas).values(
      seedAreas.map((a, i) => ({ ...a, deliveryFee: a.deliveryFee ?? null, sortOrder: i })),
    );
  }

  const [{ n: catCount }] = await db.select({ n: count() }).from(s.categories);
  if (catCount === 0) {
    const cats = await db
      .insert(s.categories)
      .values(seedCategories.map((c, i) => ({ ...c, sortOrder: i })))
      .returning({ id: s.categories.id, slug: s.categories.slug });
    const catId = new Map(cats.map((c) => [c.slug, c.id]));

    const items = await db
      .insert(s.menuItems)
      .values(
        seedItems.map((item, i) => ({
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
        })),
      )
      .returning({ id: s.menuItems.id, slug: s.menuItems.slug, categoryId: s.menuItems.categoryId });
    const itemId = new Map(items.map((i) => [i.slug, i.id]));

    await db
      .insert(s.popularItems)
      .values(seedPopular.map((slug, i) => ({ menuItemId: itemId.get(slug)!, sortOrder: i })));

    for (const group of seedOptionGroups) {
      const cid = catId.get(group.categorySlug);
      for (const item of items.filter((i) => i.categoryId === cid)) {
        const [g] = await db
          .insert(s.optionGroups)
          .values({
            menuItemId: item.id,
            nameEn: group.nameEn,
            nameAr: group.nameAr,
            minSelect: group.minSelect,
            maxSelect: group.maxSelect,
          })
          .returning({ id: s.optionGroups.id });
        await db.insert(s.options).values(group.options.map((o, i) => ({ ...o, groupId: g.id, sortOrder: i })));
      }
    }
  }

  const [{ n: adminCount }] = await db.select({ n: count() }).from(s.adminUsers);
  if (adminCount === 0) {
    const email = (process.env.ADMIN_EMAIL || "admin@saffronyard.kw").toLowerCase().trim();
    const password = process.env.ADMIN_PASSWORD || "ChangeMe-Saffron-2026";
    await db.insert(s.adminUsers).values({
      email,
      name: "Restaurant Owner",
      passwordHash: await hashPassword(password),
      role: "owner",
      mustChangePassword: !process.env.ADMIN_PASSWORD,
    });
  }
}

"use server";

import { eq, max } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "@/db";
import { deliveryAreas, homepageContent, restaurantSettings, type OpeningHours } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/guards";
import { saveImage } from "@/lib/media";
import { parseKWD } from "@/lib/money";

export type SettingsState = { ok?: boolean; error?: string; fields?: Record<string, string> } | null;

const refresh = () => revalidatePath("/", "layout");
const str = (f: FormData, k: string, maxLen = 300) => String(f.get(k) ?? "").trim().slice(0, maxLen);
const on = (f: FormData, k: string) => f.get(k) === "on";
const int = (f: FormData, k: string, lo: number, hi: number) => {
  const n = Number(f.get(k));
  return Number.isFinite(n) ? Math.max(lo, Math.min(hi, Math.round(n))) : lo;
};

async function imageField(form: FormData, field: string, current: string | null): Promise<string | null | "bad"> {
  const file = form.get(`${field}File`);
  if (file instanceof File && file.size > 0) return (await saveImage(Buffer.from(await file.arrayBuffer()))) ?? "bad";
  if (form.get(`${field}Remove`) === "1") return null;
  const url = str(form, `${field}Url`, 500);
  if (url) {
    if (url.startsWith("/") && !url.startsWith("//")) return url;
    try {
      return new URL(url).protocol === "https:" ? url : "bad";
    } catch {
      return "bad";
    }
  }
  return current;
}

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

export async function saveSettingsAction(_: SettingsState, form: FormData): Promise<SettingsState> {
  await requireAdmin({ ownerOnly: true });
  const db = await getDb();
  const [current] = await db.select().from(restaurantSettings).where(eq(restaurantSettings.id, 1));
  const fields: Record<string, string> = {};

  const deliveryFee = parseKWD(str(form, "deliveryFee"));
  const minimumOrder = parseKWD(str(form, "minimumOrder"));
  if (deliveryFee === null) fields.deliveryFee = "badPrice";
  if (minimumOrder === null) fields.minimumOrder = "badPrice";
  if (!str(form, "nameEn") ) fields.nameEn = "required";
  if (!str(form, "nameAr")) fields.nameAr = "required";
  const whatsapp = str(form, "whatsapp").replace(/\D/g, "");
  const mapsUrl = str(form, "mapsUrl", 500);
  if (mapsUrl && !/^https:\/\//.test(mapsUrl)) fields.mapsUrl = "url";

  const hours: OpeningHours = [0, 1, 2, 3, 4, 5, 6].map((day) => ({
    day,
    open: str(form, `open_${day}`) || "11:00",
    close: str(form, `close_${day}`) || "23:00",
    closed: on(form, `closed_${day}`),
  }));
  if (hours.some((h) => !TIME.test(h.open) || !TIME.test(h.close))) fields.hours = "time";

  const logoUrl = await imageField(form, "logo", current.logoUrl);
  if (logoUrl === "bad") fields.logo = "badImage";
  if (Object.keys(fields).length) return { fields };

  const etaMin = int(form, "deliveryTimeMin", 5, 240);
  await db
    .update(restaurantSettings)
    .set({
      nameEn: str(form, "nameEn", 80),
      nameAr: str(form, "nameAr", 80),
      logoUrl: logoUrl as string | null,
      phone: str(form, "phone", 30),
      whatsapp,
      email: str(form, "email", 120),
      addressEn: str(form, "addressEn"),
      addressAr: str(form, "addressAr"),
      mapsUrl,
      instagram: str(form, "instagram", 60).replace(/^@/, ""),
      openingHours: hours,
      isOpen: on(form, "isOpen"),
      closedMessageEn: str(form, "closedMessageEn"),
      closedMessageAr: str(form, "closedMessageAr"),
      deliveryEnabled: on(form, "deliveryEnabled"),
      pickupEnabled: on(form, "pickupEnabled"),
      deliveryFee: deliveryFee!,
      minimumOrder: minimumOrder!,
      deliveryTimeMin: etaMin,
      deliveryTimeMax: Math.max(etaMin, int(form, "deliveryTimeMax", 5, 300)),
      pickupTime: int(form, "pickupTime", 5, 240),
      pickupDiscountPercent: int(form, "pickupDiscountPercent", 0, 50),
      cashEnabled: on(form, "cashEnabled"),
      onlinePaymentEnabled: on(form, "onlinePaymentEnabled"),
      updatedAt: Date.now(),
    })
    .where(eq(restaurantSettings.id, 1));
  refresh();
  return { ok: true };
}

export async function setOpenAction(isOpen: boolean) {
  await requireAdmin();
  const db = await getDb();
  await db.update(restaurantSettings).set({ isOpen, updatedAt: Date.now() }).where(eq(restaurantSettings.id, 1));
  refresh();
}

export async function saveHomepageAction(_: SettingsState, form: FormData): Promise<SettingsState> {
  await requireAdmin({ ownerOnly: true });
  const db = await getDb();
  const [current] = await db.select().from(homepageContent).where(eq(homepageContent.id, 1));
  const heroImageUrl = await imageField(form, "heroImage", current.heroImageUrl);
  const aboutImageUrl = await imageField(form, "aboutImage", current.aboutImageUrl);
  const fields: Record<string, string> = {};
  if (heroImageUrl === "bad") fields.heroImage = "badImage";
  if (aboutImageUrl === "bad") fields.aboutImage = "badImage";
  for (const k of ["heroTitleEn", "heroTitleAr", "taglineEn", "taglineAr", "aboutTitleEn", "aboutTitleAr", "aboutEn", "aboutAr"]) {
    if (!str(form, k)) fields[k] = "required";
  }
  if (Object.keys(fields).length) return { fields };
  await db
    .update(homepageContent)
    .set({
      heroTitleEn: str(form, "heroTitleEn", 120),
      heroTitleAr: str(form, "heroTitleAr", 120),
      taglineEn: str(form, "taglineEn", 400),
      taglineAr: str(form, "taglineAr", 400),
      heroImageUrl: heroImageUrl as string | null,
      aboutTitleEn: str(form, "aboutTitleEn", 120),
      aboutTitleAr: str(form, "aboutTitleAr", 120),
      aboutEn: str(form, "aboutEn", 3000),
      aboutAr: str(form, "aboutAr", 3000),
      aboutImageUrl: aboutImageUrl as string | null,
      updatedAt: Date.now(),
    })
    .where(eq(homepageContent.id, 1));
  refresh();
  return { ok: true };
}

const areaSchema = z.object({ nameEn: z.string().trim().min(1).max(60), nameAr: z.string().trim().min(1).max(60) });

export async function saveAreaAction(id: number | null, _: SettingsState, form: FormData): Promise<SettingsState> {
  await requireAdmin({ ownerOnly: true });
  const parsed = areaSchema.safeParse({ nameEn: form.get("nameEn"), nameAr: form.get("nameAr") });
  if (!parsed.success) return { error: "required" };
  const feeRaw = str(form, "deliveryFee");
  const deliveryFee = feeRaw ? parseKWD(feeRaw) : null;
  if (feeRaw && deliveryFee === null) return { error: "badPrice" };
  const db = await getDb();
  if (id) {
    await db.update(deliveryAreas).set({ ...parsed.data, deliveryFee, isActive: on(form, "isActive") }).where(eq(deliveryAreas.id, id));
  } else {
    const [{ m }] = await db.select({ m: max(deliveryAreas.sortOrder) }).from(deliveryAreas);
    await db.insert(deliveryAreas).values({ ...parsed.data, deliveryFee, sortOrder: (m ?? 0) + 1 });
  }
  refresh();
  return { ok: true };
}

export async function deleteAreaAction(id: number) {
  await requireAdmin({ ownerOnly: true });
  const db = await getDb();
  await db.delete(deliveryAreas).where(eq(deliveryAreas.id, id));
  refresh();
}

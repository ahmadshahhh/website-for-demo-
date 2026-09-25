import { asc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { CheckoutView } from "@/components/checkout/CheckoutView";
import { getDb } from "@/db";
import { customerAddresses } from "@/db/schema";
import { getCurrentCustomer } from "@/lib/auth/session";
import { getDeliveryAreas, getSettings, toPublicSettings } from "@/lib/data/settings";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.checkout.title, robots: { index: false } };
}

export default async function CheckoutPage() {
  const [{ t }, settings, areas, customer] = await Promise.all([
    getI18n(),
    getSettings(),
    getDeliveryAreas({ activeOnly: true }),
    getCurrentCustomer(),
  ]);
  let addresses: (typeof customerAddresses.$inferSelect)[] = [];
  if (customer) {
    const db = await getDb();
    addresses = await db
      .select()
      .from(customerAddresses)
      .where(eq(customerAddresses.customerId, customer.id))
      .orderBy(asc(customerAddresses.id));
  }
  return (
    <div className="container-page py-8 sm:py-10">
      <h1 className="heading-lg mb-6">{t.checkout.title}</h1>
      <CheckoutView
        settings={toPublicSettings(settings)}
        areas={areas.map((a) => ({ id: a.id, nameEn: a.nameEn, nameAr: a.nameAr }))}
        customer={customer ? { name: customer.name, phone: customer.phone, email: customer.email } : null}
        addresses={addresses.map((a) => ({
          id: a.id,
          label: a.label,
          areaId: a.areaId,
          block: a.block,
          street: a.street,
          building: a.building,
          floor: a.floor ?? "",
          apartment: a.apartment ?? "",
          instructions: a.instructions ?? "",
          isDefault: a.isDefault,
        }))}
      />
    </div>
  );
}

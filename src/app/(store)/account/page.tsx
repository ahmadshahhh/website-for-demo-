import { asc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { AddressBook, PasswordForm, ProfileForm } from "@/components/account/AccountForms";
import { OrderRow } from "@/components/account/OrderRow";
import { getDb } from "@/db";
import { customerAddresses } from "@/db/schema";
import { requireCustomerPage } from "@/lib/auth/guards";
import { getDeliveryAreas } from "@/lib/data/settings";
import { getI18n } from "@/lib/i18n/server";
import { formatPhone } from "@/lib/phone";
import { isFinal } from "@/lib/orders/status";
import { getCustomerOrders } from "@/lib/orders/service";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.account.title, robots: { index: false } };
}

export default async function AccountPage() {
  const me = await requireCustomerPage("/account");
  const db = await getDb();
  const [{ t, locale }, addresses, areas, orders] = await Promise.all([
    getI18n(),
    db.select().from(customerAddresses).where(eq(customerAddresses.customerId, me.id)).orderBy(asc(customerAddresses.id)),
    getDeliveryAreas({ activeOnly: true }),
    getCustomerOrders(me.id),
  ]);
  const current = orders.filter((o) => !isFinal(o.status));
  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
      <div className="space-y-6">
        <section className="card p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold">{t.account.current}</h2>
            <Link href="/account/orders" className="text-sm font-semibold text-pomegranate-600 hover:underline">{t.common.viewAll}</Link>
          </div>
          {current.length === 0 ? (
            <p className="text-muted">{t.account.noCurrent}</p>
          ) : (
            <ul className="space-y-3">{current.map((o) => <OrderRow key={o.id} order={o} t={t} locale={locale} />)}</ul>
          )}
        </section>
        <section className="card p-5 sm:p-6">
          <h2 className="mb-4 text-lg font-bold">{t.account.addresses}</h2>
          <AddressBook
            addresses={addresses.map((a) => ({ id: a.id, label: a.label, areaId: a.areaId, block: a.block, street: a.street, building: a.building, floor: a.floor, apartment: a.apartment, isDefault: a.isDefault }))}
            areas={areas.map((a) => ({ id: a.id, nameEn: a.nameEn, nameAr: a.nameAr }))}
          />
        </section>
      </div>
      <div className="space-y-6">
        <section className="card p-5 sm:p-6">
          <h2 className="mb-4 text-lg font-bold">{t.account.profile}</h2>
          <ProfileForm name={me.name} phone={formatPhone(me.phone).replace("+965 ", "")} email={me.email} />
        </section>
        <section className="card p-5 sm:p-6">
          <h2 className="mb-4 text-lg font-bold">{t.account.changePassword}</h2>
          <PasswordForm />
        </section>
      </div>
    </div>
  );
}

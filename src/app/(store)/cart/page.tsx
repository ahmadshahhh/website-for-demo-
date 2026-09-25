import type { Metadata } from "next";
import { CartView } from "@/components/cart/CartView";
import { getSettings } from "@/lib/data/settings";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.cart.title };
}

export default async function CartPage() {
  const [{ t }, s] = await Promise.all([getI18n(), getSettings()]);
  return (
    <div className="container-page py-8 sm:py-10">
      <h1 className="heading-lg mb-6">{t.cart.title}</h1>
      <CartView deliveryEnabled={s.deliveryEnabled} />
    </div>
  );
}

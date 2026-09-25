import { notFound } from "next/navigation";
import { OrderDetails } from "@/components/order/OrderDetails";
import { requireCustomerPage } from "@/lib/auth/guards";
import { getSettings } from "@/lib/data/settings";
import { getI18n } from "@/lib/i18n/server";
import { loadOrderByTracking } from "@/lib/orders/service";
import { normalizeTrackingId } from "@/lib/orders/tracking";

export default async function AccountOrderPage({ params }: { params: Promise<{ trackingId: string }> }) {
  const { trackingId: raw } = await params;
  const me = await requireCustomerPage("/account/orders");
  const trackingId = normalizeTrackingId(decodeURIComponent(raw));
  const order = trackingId ? await loadOrderByTracking(trackingId) : null;
  // Ownership check: another customer's order is indistinguishable from a missing one.
  if (!order || order.customerId !== me.id) notFound();
  const [{ t, locale }, settings] = await Promise.all([getI18n(), getSettings()]);
  return <OrderDetails order={order} settings={settings} t={t} locale={locale} canReorder />;
}

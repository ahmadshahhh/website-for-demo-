import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OrderDetails } from "@/components/order/OrderDetails";
import { getCurrentCustomer } from "@/lib/auth/session";
import { getSettings } from "@/lib/data/settings";
import { getI18n } from "@/lib/i18n/server";
import { normalizeTrackingId } from "@/lib/orders/tracking";
import { getViewableOrder } from "@/lib/orders/service";

/** Show the "thank you" banner for a couple of minutes after placing. */
function isRecent(ms: number) {
  return Date.now() - ms < 2 * 60_000;
}

export const metadata: Metadata = { robots: { index: false } };

type Props = { params: Promise<{ trackingId: string }>; searchParams: Promise<{ new?: string }> };

/**
 * Confirmation + live tracking. Only the owning customer or a browser that
 * proved ownership (placed it, or verified tracking ID + phone) can see it —
 * everyone else is sent to the verification form, which reveals nothing.
 */
export default async function OrderPage({ params, searchParams }: Props) {
  const { trackingId: raw } = await params;
  const trackingId = normalizeTrackingId(decodeURIComponent(raw));
  if (!trackingId) redirect("/track");
  const [{ locale, t }, order, settings, customer] = await Promise.all([
    getI18n(),
    getViewableOrder(trackingId),
    getSettings(),
    getCurrentCustomer(),
  ]);
  if (!order) redirect(`/track?id=${encodeURIComponent(trackingId)}`);
  const { new: isNew } = await searchParams;
  const fresh = isNew === "1" || isRecent(order.createdAt);
  return (
    <div className="container-page py-8 sm:py-10">
      <OrderDetails
        order={order}
        settings={settings}
        t={t}
        locale={locale}
        isNew={fresh}
        canReorder={!!customer && order.customerId === customer.id}
      />
    </div>
  );
}

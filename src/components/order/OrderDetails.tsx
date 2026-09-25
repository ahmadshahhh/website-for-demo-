import { Badge } from "@/components/ui/Badge";
import { FoodImage } from "@/components/ui/FoodImage";
import { AlertIcon, BagIcon, CheckIcon, PhoneIcon, PinIcon, TruckIcon, WhatsAppIcon } from "@/components/ui/icons";
import type { RestaurantSettings } from "@/lib/data/settings";
import { fmt, pick, type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { formatKWD } from "@/lib/money";
import type { OrderView } from "@/lib/orders/service";
import { isFinal, statusKey } from "@/lib/orders/status";
import { maskPhone } from "@/lib/phone";
import { AutoRefresh } from "./AutoRefresh";
import { CopyTrackingId, ReorderButton, RetryPaymentButton } from "./OrderActions";
import { StatusTimeline } from "./StatusTimeline";

function formatTime(ms: number, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-KW" : "en-GB", {
    timeZone: "Asia/Kuwait",
    hour: "numeric",
    minute: "2-digit",
    day: "numeric",
    month: "short",
  }).format(ms);
}

/** Full order view: confirmation banner, live timeline, items and totals. */
export function OrderDetails({
  order,
  settings: s,
  t,
  locale,
  isNew,
  canReorder,
}: {
  order: OrderView;
  settings: RestaurantSettings;
  t: Dictionary;
  locale: Locale;
  isNew?: boolean;
  canReorder?: boolean;
}) {
  const cancelled = order.status === "cancelled";
  const live = !isFinal(order.status);
  const times: Record<string, string> = {};
  for (const h of order.history) times[h.status] = formatTime(h.createdAt, locale);
  const key = statusKey(order.orderType, order.status) as keyof Dictionary["orderStatus"];
  const needsPayment = order.paymentMethod === "online" && (order.paymentStatus === "pending" || order.paymentStatus === "failed") && !cancelled;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {live && <AutoRefresh seconds={15} />}

      {isNew && (
        <div className="animate-fade-up rounded-3xl bg-leaf-50 p-6 text-center sm:p-8">
          <span className="mx-auto flex size-16 animate-pop items-center justify-center rounded-full bg-leaf text-white">
            <CheckIcon size={32} />
          </span>
          <h1 className="heading-lg mt-4">{t.confirmation.title}</h1>
          <p className="mx-auto mt-2 max-w-lg text-ink-soft">{t.confirmation.subtitle}</p>
        </div>
      )}

      {needsPayment && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-saffron-300 bg-saffron-50 p-4">
          <p className="flex items-center gap-2 font-semibold text-saffron-700">
            <AlertIcon size={18} /> {order.paymentStatus === "failed" ? t.confirmation.paymentFailed : t.confirmation.paymentPending}
          </p>
          <RetryPaymentButton trackingId={order.trackingId} />
        </div>
      )}
      {order.paymentMethod === "online" && order.paymentStatus === "paid" && isNew && (
        <p className="rounded-2xl bg-leaf-50 p-4 text-center font-semibold text-leaf">{t.confirmation.paid}</p>
      )}

      {/* Tracking card */}
      <section className="overflow-hidden rounded-3xl bg-white shadow-[var(--shadow-card)] ring-1 ring-line">
        <div className="flex flex-wrap items-center justify-between gap-4 bg-pomegranate-900 px-5 py-5 text-cream sm:px-8">
          <div>
            <p className="text-sm text-cream/70">{t.confirmation.trackingId}</p>
            <p className="flex items-center gap-3 font-mono text-2xl font-bold tracking-wider text-saffron-300">
              <span className="ltr-nums">{order.trackingId}</span>
              <CopyTrackingId id={order.trackingId} />
            </p>
            {isNew && <p className="mt-1 max-w-md text-xs text-cream/60">{t.confirmation.keepSafe}</p>}
          </div>
          <div className="text-end text-sm">
            <p className="text-cream/70">{fmt(t.track.placedAt, { time: formatTime(order.createdAt, locale) })}</p>
            <p className="mt-1 inline-flex items-center gap-1.5 font-semibold">
              {order.orderType === "delivery" ? <TruckIcon size={16} /> : <BagIcon size={16} />}
              {order.orderType === "delivery" ? t.checkout.delivery : t.checkout.pickup}
            </p>
          </div>
        </div>

        <div className="p-5 sm:p-8">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-muted">{t.track.orderStatus}</p>
              <p className={`text-2xl font-extrabold ${cancelled ? "text-pomegranate-600" : "text-ink"}`}>{t.orderStatus[key]}</p>
              <p className="mt-1 text-ink-soft">{t.orderStatusHint[key]}</p>
            </div>
            {live && (
              <div className="text-end text-sm">
                <p className="font-semibold">
                  {order.orderType === "delivery"
                    ? fmt(t.track.estimated, { min: s.deliveryTimeMin, max: s.deliveryTimeMax })
                    : fmt(t.track.estimatedPickup, { time: s.pickupTime })}
                </p>
                <p className="mt-1 inline-flex items-center gap-1.5 text-leaf">
                  <span className="size-2 animate-pulse rounded-full bg-leaf" /> {t.track.live}
                </p>
              </div>
            )}
          </div>
          {cancelled ? (
            <div className="rounded-2xl bg-pomegranate-50 p-4 text-pomegranate-700">
              <p className="font-bold">{t.track.cancelled}</p>
              {order.cancelReason && <p className="mt-1">{fmt(t.track.cancelReason, { reason: order.cancelReason })}</p>}
            </div>
          ) : (
            <StatusTimeline type={order.orderType} status={order.status} labels={t.orderStatus} hints={t.orderStatusHint} times={times} />
          )}
        </div>
      </section>

      {/* Details */}
      <div className="grid gap-6 md:grid-cols-[1.3fr_1fr]">
        <section className="card p-5 sm:p-6">
          <h2 className="mb-4 text-lg font-bold">{t.track.items}</h2>
          <ul className="divide-y divide-line">
            {order.items.map((it) => (
              <li key={it.id} className="flex items-center gap-3 py-3 first:pt-0">
                <FoodImage src={it.imageUrl} alt="" className="size-14 shrink-0 rounded-xl" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold"><span className="text-muted">{it.quantity}×</span> {pick(it, "name", locale)}</p>
                  {it.options.length > 0 && <p className="text-sm text-muted">{it.options.map((o) => pick(o, "name", locale)).join(" · ")}</p>}
                </div>
                <span className="font-semibold tabular-nums">{formatKWD(it.lineTotal, locale)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-2 border-t border-line pt-4 text-[0.95rem]">
            <div className="flex justify-between"><dt className="text-muted">{t.cart.subtotal}</dt><dd className="tabular-nums">{formatKWD(order.subtotal, locale)}</dd></div>
            {order.orderType === "delivery" && <div className="flex justify-between"><dt className="text-muted">{t.cart.deliveryFee}</dt><dd className="tabular-nums">{formatKWD(order.deliveryFee, locale)}</dd></div>}
            {order.discount > 0 && <div className="flex justify-between text-leaf"><dt>{t.cart.discount}</dt><dd className="tabular-nums">−{formatKWD(order.discount, locale)}</dd></div>}
            <div className="flex justify-between border-t border-line pt-2 text-lg font-extrabold"><dt>{t.cart.total}</dt><dd className="tabular-nums">{formatKWD(order.total, locale)}</dd></div>
          </dl>
        </section>

        <div className="space-y-6">
          <section className="card p-5 sm:p-6">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
              <PinIcon size={19} className="text-pomegranate-600" />
              {order.orderType === "delivery" ? t.track.deliveryTo : t.track.pickupAt}
            </h2>
            {order.orderType === "delivery" ? (
              <p className="text-ink-soft">
                {order.customerName}
                <br />
                {order.areaName?.split(" / ")[locale === "ar" ? 1 : 0]}, {t.checkout.block} {order.block}, {t.checkout.street} {order.street}, {t.checkout.building} {order.building}
                {order.floor && `, ${t.checkout.floor} ${order.floor}`}
                {order.apartment && `, ${t.checkout.apartment} ${order.apartment}`}
                <br />
                <span className="ltr-nums">{maskPhone(order.phone)}</span>
              </p>
            ) : (
              <p className="text-ink-soft">{pick(s, "name", locale)}<br />{pick(s, "address", locale)}</p>
            )}
            <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
              <Badge tone="neutral">{t.paymentMethod[order.paymentMethod]}</Badge>
              <Badge tone={order.paymentStatus === "paid" ? "green" : order.paymentStatus === "failed" ? "red" : "saffron"}>{t.paymentStatus[order.paymentStatus]}</Badge>
            </div>
          </section>

          <section className="card p-5 sm:p-6">
            <h2 className="mb-3 text-lg font-bold">{t.track.needHelp}</h2>
            <div className="flex flex-wrap gap-2">
              {s.phone && (
                <a href={`tel:${s.phone.replace(/\s/g, "")}`} className="inline-flex h-10 items-center gap-2 rounded-xl border border-line-strong px-4 text-sm font-semibold hover:bg-sand">
                  <PhoneIcon size={16} /> {t.track.callUs}
                </a>
              )}
              {s.whatsapp && (
                <a
                  href={`https://wa.me/${s.whatsapp}?text=${encodeURIComponent(`${t.confirmation.trackingId}: ${order.trackingId}`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-line-strong px-4 text-sm font-semibold hover:bg-sand"
                >
                  <WhatsAppIcon size={16} /> {t.track.whatsapp}
                </a>
              )}
            </div>
            {canReorder && (
              <div className="mt-4 border-t border-line pt-4">
                <ReorderButton trackingId={order.trackingId} />
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

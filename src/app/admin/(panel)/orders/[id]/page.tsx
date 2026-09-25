import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderControls, MarkSeen, PrintButton } from "@/components/admin/OrderControls";
import { OrderStatusBadge, Panel, PaymentBadge, formatDateTime } from "@/components/admin/ui";
import { AutoRefresh } from "@/components/order/AutoRefresh";
import { StatusTimeline } from "@/components/order/StatusTimeline";
import { Badge } from "@/components/ui/Badge";
import { ArrowIcon, BagIcon, PhoneIcon, PinIcon, TruckIcon, WhatsAppIcon } from "@/components/ui/icons";
import { requireAdminPage } from "@/lib/auth/guards";
import { pick } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";
import { formatKWD } from "@/lib/money";
import { loadOrderById } from "@/lib/orders/service";
import { isFinal, nextStatus, statusKey } from "@/lib/orders/status";
import { formatPhone } from "@/lib/phone";

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();
  const { id } = await params;
  const order = /^\d+$/.test(id) ? await loadOrderById(Number(id)) : null;
  if (!order) notFound();
  const { t, locale } = await getI18n();
  const o = t.admin.orders;
  const next = nextStatus(order.orderType, order.status);
  const nextLabel = next ? t.admin.adminStatus[statusKey(order.orderType, next) as keyof typeof t.admin.adminStatus] : null;
  const phoneDigits = order.phone;
  const waText = encodeURIComponent(`${locale === "ar" ? "مرحباً" : "Hello"} ${order.customerName}, Saffron Yard — ${o.order} ${order.trackingId}`);

  return (
    <>
      {!order.seenByStaff && <MarkSeen orderId={order.id} />}
      {!isFinal(order.status) && <AutoRefresh seconds={15} />}
      <Link href="/admin/orders" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink no-print">
        <ArrowIcon size={16} className="rotate-180" /> {o.title}
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex flex-wrap items-center gap-3 text-3xl font-extrabold">
            {o.order} #{order.id}
            <OrderStatusBadge status={order.status} type={order.orderType} t={t} />
          </h1>
          <p className="mt-1 text-muted">
            {o.trackingId}: <span className="font-mono font-bold text-ink ltr-nums">{order.trackingId}</span> · {formatDateTime(order.createdAt, locale)}
          </p>
        </div>
        <PrintButton label={o.print} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <Panel className="no-print">
            {isFinal(order.status) ? (
              <p className="font-semibold text-muted">{o.finished}</p>
            ) : (
              <OrderControls
                orderId={order.id}
                isNew={order.status === "received"}
                next={next}
                nextLabel={nextLabel}
                canMarkPaid={order.paymentStatus !== "paid"}
              />
            )}
            {order.status !== "cancelled" && (
              <div className="mt-6 border-t border-line pt-6">
                <StatusTimeline type={order.orderType} status={order.status} labels={{ ...t.orderStatus, ...t.admin.adminStatus }} />
              </div>
            )}
            {order.status === "cancelled" && order.cancelReason && <p className="mt-3 text-pomegranate-700">{order.cancelReason}</p>}
          </Panel>

          <Panel title={o.items}>
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-muted">
                <tr><th className="pb-2 text-start">{o.items}</th><th className="pb-2 text-center">{o.qty}</th><th className="pb-2 text-end">{o.total}</th></tr>
              </thead>
              <tbody className="divide-y divide-line">
                {order.items.map((it) => (
                  <tr key={it.id}>
                    <td className="py-3">
                      <p className="font-bold">{it.nameEn} <span className="font-normal text-muted">/ {it.nameAr}</span></p>
                      {it.options.length > 0 && <p className="text-xs text-muted">{it.options.map((x) => pick(x, "name", locale)).join(" · ")}</p>}
                      <p className="text-xs text-muted tabular-nums">{formatKWD(it.unitPrice, locale)}</p>
                    </td>
                    <td className="py-3 text-center text-lg font-extrabold">× {it.quantity}</td>
                    <td className="py-3 text-end font-bold tabular-nums">{formatKWD(it.lineTotal, locale)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <dl className="mt-4 space-y-1.5 border-t border-line pt-4 text-sm">
              <div className="flex justify-between"><dt className="text-muted">{o.subtotal}</dt><dd className="tabular-nums">{formatKWD(order.subtotal, locale)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">{o.deliveryFee}</dt><dd className="tabular-nums">{formatKWD(order.deliveryFee, locale)}</dd></div>
              {order.discount > 0 && <div className="flex justify-between text-leaf"><dt>{o.discount}</dt><dd className="tabular-nums">−{formatKWD(order.discount, locale)}</dd></div>}
              <div className="flex justify-between border-t border-line pt-2 text-lg font-extrabold"><dt>{o.total}</dt><dd className="tabular-nums">{formatKWD(order.total, locale)}</dd></div>
            </dl>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title={o.customer}>
            <p className="text-lg font-bold">{order.customerName}</p>
            <div className="mt-1 flex flex-wrap gap-2">
              <Badge tone={order.isGuest ? "neutral" : "blue"}>{order.isGuest ? t.common.guest : t.common.registered}</Badge>
              {order.customerId && <Link href={`/admin/customers/${order.customerId}`} className="text-sm font-semibold text-pomegranate-600 hover:underline">{t.admin.customers.history} →</Link>}
            </div>
            <p className="mt-3 font-semibold ltr-nums">{formatPhone(order.phone)}</p>
            {order.email && <p className="text-sm text-muted">{order.email}</p>}
            <div className="mt-4 flex flex-wrap gap-2 no-print">
              <a href={`tel:+${phoneDigits}`} className="inline-flex h-10 items-center gap-2 rounded-xl bg-ink px-4 text-sm font-semibold text-cream"><PhoneIcon size={16} /> {o.call}</a>
              <a href={`https://wa.me/${phoneDigits}?text=${waText}`} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#1f8f4e] px-4 text-sm font-semibold text-white"><WhatsAppIcon size={16} /> {o.whatsapp}</a>
            </div>
          </Panel>

          <Panel title={order.orderType === "delivery" ? o.address : o.type}>
            {order.orderType === "delivery" ? (
              <div className="space-y-1">
                <p className="flex items-center gap-2 font-bold"><TruckIcon size={18} /> {t.checkout.delivery}</p>
                <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                  <dt className="text-muted">{o.area}</dt><dd className="font-semibold">{order.areaName}</dd>
                  <dt className="text-muted">{o.block}</dt><dd className="font-semibold">{order.block}</dd>
                  <dt className="text-muted">{o.street}</dt><dd className="font-semibold">{order.street}</dd>
                  <dt className="text-muted">{o.building}</dt><dd className="font-semibold">{order.building}</dd>
                  {order.floor && <><dt className="text-muted">{o.floor}</dt><dd className="font-semibold">{order.floor}</dd></>}
                  {order.apartment && <><dt className="text-muted">{o.apt}</dt><dd className="font-semibold">{order.apartment}</dd></>}
                </dl>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`Block ${order.block} Street ${order.street} ${order.areaName?.split(" / ")[0]} Kuwait`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-pomegranate-600 hover:underline no-print"
                >
                  <PinIcon size={15} /> Google Maps
                </a>
              </div>
            ) : (
              <p className="flex items-center gap-2 font-bold"><BagIcon size={18} /> {o.pickup}</p>
            )}
            {order.instructions && (
              <div className="mt-4 rounded-xl bg-saffron-50 p-3 text-sm">
                <p className="font-bold text-saffron-700">{o.notes}</p>
                <p className="mt-0.5">{order.instructions}</p>
              </div>
            )}
          </Panel>

          <Panel title={o.payment}>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-muted">{o.paymentMethod}</dt><dd className="font-semibold">{t.paymentMethod[order.paymentMethod]}</dd></div>
              <div className="flex items-center justify-between"><dt className="text-muted">{o.paymentStatus}</dt><dd><PaymentBadge status={order.paymentStatus} t={t} /></dd></div>
            </dl>
          </Panel>

          <Panel title={o.history}>
            <ol className="space-y-2 text-sm">
              {order.history.map((h) => (
                <li key={h.id} className="flex justify-between gap-3">
                  <span className="font-semibold">{t.admin.adminStatus[statusKey(order.orderType, h.status) as keyof typeof t.admin.adminStatus]}{h.note && <span className="font-normal text-muted"> — {h.note}</span>}</span>
                  <span className="shrink-0 text-muted tabular-nums">{formatDateTime(h.createdAt, locale, { timeStyle: "short" })}</span>
                </li>
              ))}
            </ol>
          </Panel>
        </div>
      </div>
    </>
  );
}

import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { Badge } from "@/components/ui/Badge";
import { ShieldIcon } from "@/components/ui/icons";
import { getDb } from "@/db";
import { orders, payments } from "@/db/schema";
import { getI18n } from "@/lib/i18n/server";
import { formatKWD } from "@/lib/money";
import { signSimulatorOutcome, verifySimulatorLink } from "@/lib/payments/providers/simulator";

export const metadata: Metadata = { robots: { index: false } };

/**
 * Hosted page of the built-in TEST gateway. A real gateway replaces this with
 * its own page (KNET etc.). It never collects card details.
 */
export default async function PayPage({ params, searchParams }: { params: Promise<{ paymentId: string }>; searchParams: Promise<{ sig?: string }> }) {
  const [{ paymentId }, { sig }, { t, locale }] = await Promise.all([params, searchParams, getI18n()]);
  const db = await getDb();
  const valid = !!sig && /^[0-9a-f-]{36}$/.test(paymentId) && (await verifySimulatorLink(paymentId, sig));
  const [payment] = valid ? await db.select().from(payments).where(eq(payments.id, paymentId)) : [];
  const [order] = payment ? await db.select({ trackingId: orders.trackingId }).from(orders).where(eq(orders.id, payment.orderId)) : [];

  if (!payment || !order || payment.status !== "pending") {
    return (
      <div className="container-page max-w-md py-20 text-center">
        <p className="text-lg font-semibold">{t.pay.invalid}</p>
      </div>
    );
  }
  const [okSig, failSig] = await Promise.all([signSimulatorOutcome(paymentId, "paid"), signSimulatorOutcome(paymentId, "failed")]);
  const outcome = (o: "paid" | "failed", s: string, label: string, cls: string) => (
    <form method="post" action="/api/payments/simulator/callback">
      <input type="hidden" name="paymentId" value={paymentId} />
      <input type="hidden" name="outcome" value={o} />
      <input type="hidden" name="sig" value={s} />
      <button className={`h-12 w-full rounded-xl font-bold ${cls}`}>{label}</button>
    </form>
  );
  return (
    <div className="container-page max-w-md py-12">
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between bg-ink px-6 py-4 text-cream">
          <span className="flex items-center gap-2 font-bold"><ShieldIcon size={20} /> {t.pay.title}</span>
          <Badge tone="saffron">{t.pay.testMode}</Badge>
        </div>
        <div className="space-y-5 p-6">
          <p className="rounded-xl bg-saffron-50 p-3 text-sm text-saffron-700">{t.pay.testBody}</p>
          <dl className="space-y-2">
            <div className="flex justify-between"><dt className="text-muted">{t.pay.order}</dt><dd className="ltr-nums font-mono font-bold">{order.trackingId}</dd></div>
            <div className="flex justify-between text-lg"><dt className="text-muted">{t.pay.amount}</dt><dd className="font-extrabold tabular-nums">{formatKWD(payment.amount, locale)}</dd></div>
          </dl>
          <div className="space-y-2">
            {outcome("paid", okSig, t.pay.approve, "bg-leaf text-white hover:opacity-90")}
            {outcome("failed", failSig, t.pay.decline, "border border-line-strong bg-white hover:bg-sand")}
          </div>
        </div>
      </div>
    </div>
  );
}

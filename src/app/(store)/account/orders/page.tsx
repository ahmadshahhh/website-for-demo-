import type { Metadata } from "next";
import { OrderRow } from "@/components/account/OrderRow";
import { LinkButton } from "@/components/ui/Button";
import { requireCustomerPage } from "@/lib/auth/guards";
import { getI18n } from "@/lib/i18n/server";
import { isFinal } from "@/lib/orders/status";
import { getCustomerOrders } from "@/lib/orders/service";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.account.orders, robots: { index: false } };
}

export default async function OrdersPage() {
  const me = await requireCustomerPage("/account/orders");
  const [{ t, locale }, orders] = await Promise.all([getI18n(), getCustomerOrders(me.id)]);
  const current = orders.filter((o) => !isFinal(o.status));
  const previous = orders.filter((o) => isFinal(o.status));
  if (orders.length === 0) {
    return (
      <div className="card p-10 text-center">
        <p className="text-lg font-semibold">{t.account.noOrders}</p>
        <LinkButton href="/menu" className="mt-5">{t.account.startOrder}</LinkButton>
      </div>
    );
  }
  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 text-lg font-bold">{t.account.current}</h2>
        {current.length ? <ul className="space-y-3">{current.map((o) => <OrderRow key={o.id} order={o} t={t} locale={locale} />)}</ul> : <p className="text-muted">{t.account.noCurrent}</p>}
      </section>
      {previous.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-bold">{t.account.previous}</h2>
          <ul className="space-y-3">{previous.map((o) => <OrderRow key={o.id} order={o} t={t} locale={locale} />)}</ul>
        </section>
      )}
    </div>
  );
}

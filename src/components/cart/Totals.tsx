"use client";

import { useI18n } from "@/components/providers/I18nProvider";
import type { Quote } from "@/lib/cart/types";
import { formatKWD } from "@/lib/money";

export function Totals({ quote, showDelivery = true, deliveryNote }: { quote: Quote; showDelivery?: boolean; deliveryNote?: string }) {
  const { t, locale } = useI18n();
  const row = "flex items-center justify-between gap-4";
  return (
    <dl className="space-y-2.5 text-[0.95rem]">
      <div className={row}>
        <dt className="text-muted">{t.cart.subtotal}</dt>
        <dd className="font-semibold tabular-nums">{formatKWD(quote.subtotal, locale)}</dd>
      </div>
      {showDelivery && (
        <div className={row}>
          <dt className="text-muted">{t.cart.deliveryFee}</dt>
          <dd className="font-semibold tabular-nums">{deliveryNote ?? formatKWD(quote.deliveryFee, locale)}</dd>
        </div>
      )}
      {quote.discount > 0 && (
        <div className={`${row} text-leaf`}>
          <dt>{t.cart.discount}</dt>
          <dd className="font-semibold tabular-nums">−{formatKWD(quote.discount, locale)}</dd>
        </div>
      )}
      <div className={`${row} border-t border-line pt-3 text-lg`}>
        <dt className="font-bold">{t.cart.total}</dt>
        <dd className="font-extrabold tabular-nums">{formatKWD(quote.total, locale)}</dd>
      </div>
    </dl>
  );
}

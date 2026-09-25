"use client";

import Link from "next/link";
import { useCart } from "@/components/providers/CartProvider";
import { useI18n } from "@/components/providers/I18nProvider";
import { LinkButton } from "@/components/ui/Button";
import { FoodImage } from "@/components/ui/FoodImage";
import { AlertIcon, ArrowIcon, CartIcon, TrashIcon } from "@/components/ui/icons";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { Spinner } from "@/components/ui/Spinner";
import { fmt, pick } from "@/lib/i18n/config";
import { formatKWD } from "@/lib/money";
import { cn } from "@/lib/cn";
import { Totals } from "./Totals";
import { useQuote } from "./useQuote";

export function CartView({ deliveryEnabled }: { deliveryEnabled: boolean }) {
  const { t, locale } = useI18n();
  const { lines, hydrated, setQuantity, remove } = useCart();
  const { quote, loading } = useQuote(deliveryEnabled ? "delivery" : "pickup", null);

  if (!hydrated) {
    return <div className="flex justify-center py-24 text-muted"><Spinner size={28} /></div>;
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <span className="mx-auto flex size-20 items-center justify-center rounded-full bg-saffron-100 text-saffron-700">
          <CartIcon size={36} />
        </span>
        <h2 className="heading-md mt-6">{t.cart.empty}</h2>
        <p className="mt-2 text-muted">{t.cart.emptyBody}</p>
        <LinkButton href="/menu" size="lg" className="mt-6">{t.cart.browseMenu}</LinkButton>
      </div>
    );
  }

  const problems = new Map(quote?.lines.map((l) => [l.key, l]) ?? []);

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <ul className="space-y-3">
        {lines.map((l) => {
          const q = problems.get(l.key);
          const bad = q?.problem;
          const unit = q && !bad ? q.unitPrice : l.unitPrice;
          const opts = locale === "ar" ? l.optionNamesAr : l.optionNamesEn;
          return (
            <li key={l.key} className={cn("card flex gap-3 p-3 sm:gap-4 sm:p-4", bad && "border-pomegranate-500/50 bg-pomegranate-50/40")}>
              <Link href={`/menu/${l.slug}`} className="shrink-0 overflow-hidden rounded-xl bg-sand">
                <FoodImage src={l.imageUrl} alt={pick(l, "name", locale)} className="size-20 sm:size-24" />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link href={`/menu/${l.slug}`} className="font-bold leading-snug hover:text-pomegranate-600">{pick(l, "name", locale)}</Link>
                    {opts.length > 0 && <p className="mt-0.5 text-sm text-muted">{opts.join(" · ")}</p>}
                    <p className="mt-0.5 text-sm text-muted tabular-nums">{formatKWD(unit, locale)}</p>
                  </div>
                  <button onClick={() => remove(l.key)} className="-me-1 flex size-9 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-pomegranate-50 hover:text-pomegranate-600" aria-label={`${t.cart.remove}: ${pick(l, "name", locale)}`}>
                    <TrashIcon size={18} />
                  </button>
                </div>
                {bad && (
                  <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-pomegranate-600">
                    <AlertIcon size={15} /> {bad === "unavailable" ? t.common.unavailable : t.menu.options}
                  </p>
                )}
                <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                  <QuantityStepper size="sm" value={l.quantity} onChange={(v) => setQuantity(l.key, v)} labels={t.menu} trashAtMin />
                  <span className="font-bold tabular-nums">{formatKWD(unit * l.quantity, locale)}</span>
                </div>
              </div>
            </li>
          );
        })}
        <li>
          <Link href="/menu" className="inline-flex items-center gap-1.5 py-2 font-semibold text-pomegranate-600 hover:underline">
            <ArrowIcon size={16} className="rotate-180" /> {t.cart.continueShopping}
          </Link>
        </li>
      </ul>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="card p-5 sm:p-6">
          <h2 className="mb-4 text-lg font-bold">{t.checkout.summary}</h2>
          {!quote ? (
            <div className="flex items-center gap-2 py-6 text-muted"><Spinner /> {t.cart.updating}</div>
          ) : (
            <div className={cn("transition-opacity", loading && "opacity-60")}>
              <Totals quote={quote} />
              <p className="mt-2 text-xs text-muted">{t.cart.deliveryFeeNote}</p>
              {quote.hasProblems && <p className="mt-4 rounded-xl bg-pomegranate-50 p-3 text-sm font-medium text-pomegranate-700">{t.cart.unavailableItems}</p>}
              {deliveryEnabled && quote.belowMinimum && (
                <p className="mt-4 rounded-xl bg-saffron-50 p-3 text-sm font-medium text-saffron-700">{fmt(t.cart.minimumOrder, { min: formatKWD(quote.minimumOrder, locale) })}</p>
              )}
            </div>
          )}
          <LinkButton
            href="/checkout"
            size="lg"
            className={cn("mt-5 w-full", (!quote || quote.hasProblems) && "pointer-events-none opacity-55")}
            aria-disabled={!quote || quote.hasProblems}
          >
            {t.cart.checkout} <ArrowIcon size={18} />
          </LinkButton>
        </div>
      </aside>
    </div>
  );
}

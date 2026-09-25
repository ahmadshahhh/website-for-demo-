"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/components/providers/CartProvider";
import { useI18n } from "@/components/providers/I18nProvider";
import { CartIcon, ChevronIcon } from "@/components/ui/icons";
import { fmt } from "@/lib/i18n/config";
import { formatKWD } from "@/lib/money";

const HIDDEN = ["/cart", "/checkout", "/order", "/pay", "/login", "/signup"];

/** Sticky "view cart" bar on phones, like native food-ordering apps. */
export function MobileCartBar() {
  const { lines, count, hydrated } = useCart();
  const { t, locale } = useI18n();
  const pathname = usePathname();
  if (!hydrated || count === 0 || HIDDEN.some((p) => pathname.startsWith(p))) return null;
  const total = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden no-print">
      <Link
        href="/cart"
        className="flex animate-fade-up items-center gap-3 rounded-2xl bg-ink px-4 py-3.5 text-cream shadow-[var(--shadow-lift)]"
      >
        <span className="relative flex size-9 items-center justify-center rounded-xl bg-saffron-400 text-ink">
          <CartIcon size={19} />
          <span className="absolute -end-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-pomegranate-600 px-1 text-[0.7rem] font-bold text-white">{count}</span>
        </span>
        <span className="flex-1 font-semibold">{t.cart.viewCart}</span>
        <span className="text-sm text-cream/70">{fmt(t.cart.itemsInCart, { count })}</span>
        <span className="font-bold tabular-nums">{formatKWD(total, locale)}</span>
        <ChevronIcon size={18} />
      </Link>
    </div>
  );
}

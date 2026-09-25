import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { BagIcon, ChevronIcon, TruckIcon } from "@/components/ui/icons";
import type { orders } from "@/db/schema";
import { fmt, type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { formatKWD } from "@/lib/money";
import { isFinal, statusKey } from "@/lib/orders/status";

type Row = typeof orders.$inferSelect & { itemCount: number };

export function OrderRow({ order: o, t, locale }: { order: Row; t: Dictionary; locale: Locale }) {
  const key = statusKey(o.orderType, o.status) as keyof Dictionary["orderStatus"];
  const date = new Intl.DateTimeFormat(locale === "ar" ? "ar-KW" : "en-GB", { timeZone: "Asia/Kuwait", dateStyle: "medium", timeStyle: "short" }).format(o.createdAt);
  return (
    <li>
      <Link href={`/account/orders/${o.trackingId}`} className="flex items-center gap-3 rounded-2xl border border-line bg-white p-3.5 transition-colors hover:border-line-strong hover:bg-sand/40 sm:gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-sand text-ink-soft">
          {o.orderType === "delivery" ? <TruckIcon size={20} /> : <BagIcon size={20} />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2 font-bold">
            <span className="ltr-nums font-mono text-sm">{o.trackingId}</span>
            <Badge tone={o.status === "cancelled" ? "red" : isFinal(o.status) ? "green" : "saffron"}>{t.orderStatus[key]}</Badge>
          </p>
          <p className="mt-0.5 text-sm text-muted">{date} · {fmt(t.account.items, { count: o.itemCount })}</p>
        </div>
        <span className="font-bold tabular-nums">{formatKWD(o.total, locale)}</span>
        <ChevronIcon size={18} className="text-muted" />
      </Link>
    </li>
  );
}

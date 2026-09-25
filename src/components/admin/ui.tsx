import type { ReactNode } from "react";
import { Badge } from "@/components/ui/Badge";
import type { OrderStatus, PaymentStatus } from "@/db/schema";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { statusKey, type OrderType } from "@/lib/orders/status";
import { cn } from "@/lib/cn";

export function PageTitle({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ title, children, className, actions }: { title?: ReactNode; children: ReactNode; className?: string; actions?: ReactNode }) {
  return (
    <section className={cn("rounded-2xl border border-line bg-white p-5 shadow-[var(--shadow-card)]", className)}>
      {(title || actions) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="text-lg font-bold">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

const STATUS_TONE: Record<OrderStatus, "saffron" | "red" | "green" | "neutral" | "dark" | "blue"> = {
  received: "red",
  accepted: "blue",
  preparing: "saffron",
  ready: "saffron",
  out_for_delivery: "blue",
  delivered: "green",
  picked_up: "green",
  cancelled: "neutral",
};

export function OrderStatusBadge({ status, type, t }: { status: OrderStatus; type: OrderType; t: Dictionary }) {
  const key = statusKey(type, status) as keyof Dictionary["admin"]["adminStatus"];
  return <Badge tone={STATUS_TONE[status]}>{t.admin.adminStatus[key]}</Badge>;
}

export function PaymentBadge({ status, t }: { status: PaymentStatus; t: Dictionary }) {
  return <Badge tone={status === "paid" ? "green" : status === "failed" ? "red" : status === "pending" ? "saffron" : "neutral"}>{t.paymentStatus[status]}</Badge>;
}

export function formatDateTime(ms: number, locale: Locale, opts: Intl.DateTimeFormatOptions = { dateStyle: "medium", timeStyle: "short" }) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-KW" : "en-GB", { timeZone: "Asia/Kuwait", ...opts }).format(ms);
}

export function timeAgo(ms: number, locale: Locale) {
  const rtf = new Intl.RelativeTimeFormat(locale === "ar" ? "ar" : "en", { numeric: "auto" });
  const diff = (ms - Date.now()) / 1000;
  const abs = Math.abs(diff);
  if (abs < 60) return rtf.format(Math.round(diff), "second");
  if (abs < 3600) return rtf.format(Math.round(diff / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), "hour");
  return rtf.format(Math.round(diff / 86400), "day");
}

"use client";

import { useEffect, useState, useTransition } from "react";
import { markOrderSeenAction, markPaidAction, updateOrderStatusAction } from "@/app/admin/actions/orders";
import { useI18n } from "@/components/providers/I18nProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { Button } from "@/components/ui/Button";
import { CheckIcon, CloseIcon, PrinterIcon } from "@/components/ui/icons";
import type { OrderStatus } from "@/db/schema";
import { fmt } from "@/lib/i18n/config";

export function OrderControls({
  orderId,
  isNew,
  next,
  nextLabel,
  canMarkPaid,
}: {
  orderId: number;
  isNew: boolean;
  next: OrderStatus | null;
  nextLabel: string | null;
  canMarkPaid: boolean;
}) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [pending, start] = useTransition();
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState("");
  const o = t.admin.orders;

  const run = (fn: () => Promise<{ ok: boolean }>) =>
    start(async () => {
      const res = await fn().catch(() => ({ ok: false }));
      toast(res.ok ? o.updated : t.common.somethingWrong, res.ok ? "success" : "error");
      if (res.ok) setCancelling(false);
    });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {next && (
          <Button size="lg" variant={isNew ? "secondary" : "primary"} loading={pending} icon={<CheckIcon size={19} />} onClick={() => run(() => updateOrderStatusAction(orderId, next))} className={isNew ? "animate-pulse-ring" : ""}>
            {isNew ? o.accept : fmt(o.advance, { status: nextLabel ?? "" })}
          </Button>
        )}
        {canMarkPaid && (
          <Button size="lg" variant="outline" disabled={pending} onClick={() => run(() => markPaidAction(orderId))}>{o.markPaid}</Button>
        )}
        <Button size="lg" variant="danger" disabled={pending} icon={<CloseIcon size={18} />} onClick={() => setCancelling((v) => !v)}>{o.cancel}</Button>
      </div>
      {cancelling && (
        <div className="animate-slide-in rounded-2xl border border-pomegranate-100 bg-pomegranate-50 p-4">
          <p className="text-sm font-semibold text-pomegranate-700">{o.cancelConfirm}</p>
          <input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} placeholder={o.cancelReason} className="mt-3 h-11 w-full rounded-xl border border-line-strong bg-white px-3 text-sm outline-none focus:border-pomegranate-500" />
          <div className="mt-3 flex gap-2">
            <Button variant="secondary" loading={pending} onClick={() => run(() => updateOrderStatusAction(orderId, "cancelled", reason))}>{o.cancel}</Button>
            <Button variant="ghost" onClick={() => setCancelling(false)}>{t.common.back}</Button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Opening an order acknowledges it (clears the "new" alert). */
export function MarkSeen({ orderId }: { orderId: number }) {
  useEffect(() => {
    markOrderSeenAction(orderId).catch(() => {});
  }, [orderId]);
  return null;
}

export function PrintButton({ label }: { label: string }) {
  return (
    <Button variant="outline" icon={<PrinterIcon size={17} />} onClick={() => window.print()} className="no-print">
      {label}
    </Button>
  );
}

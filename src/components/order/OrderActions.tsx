"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { reorderAction } from "@/app/actions/account";
import { retryPaymentAction } from "@/app/actions/checkout";
import { useCart } from "@/components/providers/CartProvider";
import { useI18n } from "@/components/providers/I18nProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { Button } from "@/components/ui/Button";
import { CopyIcon, RefreshIcon } from "@/components/ui/icons";

export function CopyTrackingId({ id }: { id: string }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(id);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        } catch {}
      }}
      className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1 text-xs font-semibold hover:bg-white/20"
    >
      <CopyIcon size={14} /> {copied ? t.common.copied : t.common.copy}
    </button>
  );
}

export function RetryPaymentButton({ trackingId }: { trackingId: string }) {
  const { t } = useI18n();
  const { toast } = useToast();
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      loading={pending}
      onClick={() =>
        start(async () => {
          const url = await retryPaymentAction(trackingId);
          if (!url) return toast(t.common.somethingWrong, "error");
          if (/^https?:\/\//.test(url)) window.location.assign(url);
          else router.push(url);
        })
      }
    >
      {t.confirmation.completePayment}
    </Button>
  );
}

export function ReorderButton({ trackingId, variant = "outline" }: { trackingId: string; variant?: "outline" | "primary" }) {
  const { t } = useI18n();
  const { toast } = useToast();
  const { add } = useCart();
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      variant={variant}
      loading={pending}
      icon={<RefreshIcon size={17} />}
      onClick={() =>
        start(async () => {
          const lines = await reorderAction(trackingId).catch(() => []);
          if (!lines.length) return toast(t.common.unavailable, "error");
          lines.forEach((l) => add(l));
          toast(t.track.reordered);
          router.push("/cart");
        })
      }
    >
      {t.track.reorder}
    </Button>
  );
}

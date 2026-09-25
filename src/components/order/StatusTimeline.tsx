import type { OrderStatus } from "@/db/schema";
import { CheckIcon } from "@/components/ui/icons";
import { STATUS_FLOW, statusKey, type OrderType } from "@/lib/orders/status";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { cn } from "@/lib/cn";

type Labels = Dictionary["orderStatus"];

/** Visual progress: vertical on phones, horizontal on larger screens. */
export function StatusTimeline({
  type,
  status,
  labels,
  hints,
  times,
}: {
  type: OrderType;
  status: OrderStatus;
  labels: Labels;
  hints?: Dictionary["orderStatusHint"];
  times?: Partial<Record<OrderStatus, string>>;
}) {
  const flow = STATUS_FLOW[type];
  const current = flow.indexOf(status);
  return (
    <ol className="relative grid gap-0 sm:grid-flow-col sm:auto-cols-fr" aria-label="Order progress">
      {flow.map((s, i) => {
        const done = i < current || (i === current && (s === "delivered" || s === "picked_up"));
        const active = i === current && !done;
        const key = statusKey(type, s) as keyof Labels;
        return (
          <li key={s} className="relative flex gap-4 pb-6 last:pb-0 sm:flex-col sm:items-center sm:gap-2 sm:pb-0 sm:text-center" aria-current={active ? "step" : undefined}>
            {i < flow.length - 1 && (
              <span
                aria-hidden
                className={cn(
                  "absolute start-[19px] top-10 h-[calc(100%-2.5rem)] w-0.5 sm:start-[calc(50%+22px)] sm:top-[19px] sm:h-0.5 sm:w-[calc(100%-44px)]",
                  i < current ? "bg-saffron-500" : "bg-line",
                )}
              />
            )}
            <span
              className={cn(
                "relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold transition-all",
                done && "border-saffron-500 bg-saffron-500 text-white",
                active && "animate-pulse-ring border-saffron-500 bg-white text-saffron-600",
                !done && !active && "border-line bg-white text-muted",
              )}
            >
              {done ? <CheckIcon size={18} /> : i + 1}
            </span>
            <span className="min-w-0 pt-1.5 sm:pt-0">
              <span className={cn("block font-bold leading-tight", !done && !active && "text-muted")}>{labels[key]}</span>
              {times?.[s] && <span className="mt-0.5 block text-xs text-muted tabular-nums">{times[s]}</span>}
              {active && hints && <span className="mt-1 block text-sm text-ink-soft sm:hidden">{hints[key as keyof typeof hints]}</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

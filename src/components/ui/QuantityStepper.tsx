"use client";

import { MinusIcon, PlusIcon, TrashIcon } from "./icons";
import { cn } from "@/lib/cn";

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 50,
  size = "md",
  labels,
  trashAtMin = false,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  size?: "sm" | "md";
  labels: { decrease: string; increase: string; quantity: string };
  trashAtMin?: boolean;
}) {
  const btn = cn(
    "flex items-center justify-center rounded-lg text-ink transition-colors hover:bg-sand disabled:opacity-40",
    size === "sm" ? "size-8" : "size-10",
  );
  const showTrash = trashAtMin && value <= min;
  return (
    <div className="inline-flex items-center gap-1 rounded-xl border border-line-strong bg-white p-0.5" role="group" aria-label={labels.quantity}>
      <button type="button" className={btn} onClick={() => onChange(value - 1)} disabled={!trashAtMin && value <= min} aria-label={labels.decrease}>
        {showTrash ? <TrashIcon size={16} className="text-pomegranate-600" /> : <MinusIcon size={16} />}
      </button>
      <span className={cn("text-center font-bold tabular-nums", size === "sm" ? "w-6 text-sm" : "w-8")} aria-live="polite">
        {value}
      </span>
      <button type="button" className={btn} onClick={() => onChange(value + 1)} disabled={value >= max} aria-label={labels.increase}>
        <PlusIcon size={16} />
      </button>
    </div>
  );
}

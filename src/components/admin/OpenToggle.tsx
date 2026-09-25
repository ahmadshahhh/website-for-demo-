"use client";

import { useTransition } from "react";
import { setOpenAction } from "@/app/admin/actions/settings";
import { useI18n } from "@/components/providers/I18nProvider";
import { cn } from "@/lib/cn";

/** Big open/closed switch — closing immediately stops new orders. */
export function OpenToggle({ isOpen }: { isOpen: boolean }) {
  const { t } = useI18n();
  const [pending, start] = useTransition();
  const d = t.admin.dashboard;
  return (
    <button
      type="button"
      role="switch"
      aria-checked={isOpen}
      disabled={pending}
      onClick={() => start(() => setOpenAction(!isOpen))}
      className={cn(
        "flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-start transition-colors",
        isOpen ? "border-leaf bg-leaf-50" : "border-pomegranate-500 bg-pomegranate-50",
        pending && "opacity-60",
      )}
    >
      <span className={cn("relative h-8 w-14 shrink-0 rounded-full transition-colors", isOpen ? "bg-leaf" : "bg-pomegranate-500")}>
        <span className={cn("absolute top-1 size-6 rounded-full bg-white shadow transition-all", isOpen ? "start-7" : "start-1")} />
      </span>
      <span>
        <span className={cn("block text-lg font-extrabold", isOpen ? "text-leaf" : "text-pomegranate-600")}>{isOpen ? d.open : d.closed}</span>
        <span className="text-sm text-muted">{isOpen ? d.closeRestaurant : d.openRestaurant}</span>
      </span>
    </button>
  );
}

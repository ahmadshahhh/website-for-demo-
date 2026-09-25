"use client";

import Link from "next/link";
import { useTransition } from "react";
import { moveMenuItemAction, toggleAvailabilityAction } from "@/app/admin/actions/menu";
import { useI18n } from "@/components/providers/I18nProvider";
import { ArrowDownIcon, ArrowUpIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

export function Switch({ checked, onChange, disabled, label }: { checked: boolean; onChange: () => void; disabled?: boolean; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onChange}
      className={cn("relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-50", checked ? "bg-leaf" : "bg-line-strong")}
    >
      <span className={cn("absolute top-1 size-5 rounded-full bg-white shadow transition-all", checked ? "start-6" : "start-1")} />
    </button>
  );
}

export function MoveButtons({ onMove, first, last, disabled }: { onMove: (d: "up" | "down") => void; first: boolean; last: boolean; disabled?: boolean }) {
  const { t } = useI18n();
  const btn = "flex size-8 items-center justify-center rounded-lg text-muted hover:bg-sand hover:text-ink disabled:opacity-30";
  return (
    <div className="flex flex-col">
      <button type="button" className={btn} disabled={first || disabled} onClick={() => onMove("up")} aria-label={t.admin.menu.moveUp}><ArrowUpIcon size={16} /></button>
      <button type="button" className={btn} disabled={last || disabled} onClick={() => onMove("down")} aria-label={t.admin.menu.moveDown}><ArrowDownIcon size={16} /></button>
    </div>
  );
}

export function MenuRowActions({ id, available, first, last }: { id: number; available: boolean; first: boolean; last: boolean }) {
  const { t } = useI18n();
  const [pending, start] = useTransition();
  return (
    <div className={cn("flex items-center gap-2 sm:gap-3", pending && "opacity-60")}>
      <label className="hidden text-xs font-semibold text-muted sm:block">{t.admin.menu.available}</label>
      <Switch checked={available} disabled={pending} label={t.admin.menu.available} onChange={() => start(() => toggleAvailabilityAction(id))} />
      <MoveButtons first={first} last={last} disabled={pending} onMove={(d) => start(() => moveMenuItemAction(id, d))} />
      <Link href={`/admin/menu/${id}`} className="hidden h-9 items-center rounded-lg border border-line-strong px-3 text-sm font-semibold hover:bg-sand sm:inline-flex">{t.common.edit}</Link>
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { addPopularAction, movePopularAction, removePopularAction } from "@/app/admin/actions/menu";
import { useI18n } from "@/components/providers/I18nProvider";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { FoodImage } from "@/components/ui/FoodImage";
import { PlusIcon, TrashIcon } from "@/components/ui/icons";
import { pick } from "@/lib/i18n/config";
import { formatKWD } from "@/lib/money";
import { cn } from "@/lib/cn";
import { MoveButtons } from "./MenuRowActions";

type Sel = { id: number; nameEn: string; nameAr: string; imageUrl: string | null; price: number; isAvailable: boolean };

export function PopularManager({ selected, candidates }: { selected: Sel[]; candidates: { id: number; nameEn: string; nameAr: string }[] }) {
  const { t, locale } = useI18n();
  const p = t.admin.popular;
  const [pending, start] = useTransition();
  const [choice, setChoice] = useState("");
  return (
    <div className={cn("space-y-5", pending && "opacity-70")}>
      <div className="flex flex-wrap gap-2 rounded-2xl border border-line bg-white p-4 shadow-[var(--shadow-card)]">
        <select value={choice} onChange={(e) => setChoice(e.target.value)} className="h-11 min-w-56 flex-1 rounded-xl border border-line-strong bg-white px-3 text-sm">
          <option value="">{p.choose}</option>
          {candidates.map((c) => <option key={c.id} value={c.id}>{pick(c, "name", locale)}</option>)}
        </select>
        <Button disabled={!choice} loading={pending} icon={<PlusIcon size={16} />} onClick={() => start(async () => { await addPopularAction(Number(choice)); setChoice(""); })}>{p.add}</Button>
      </div>
      {selected.length === 0 ? (
        <p className="text-muted">{p.empty}</p>
      ) : (
        <ol className="space-y-2">
          {selected.map((s, i) => (
            <li key={s.id}>
              {i === 6 && <p className="mb-2 mt-4 text-xs font-bold uppercase tracking-wide text-muted">{p.notShown}</p>}
              <div className={cn("flex items-center gap-3 rounded-2xl border bg-white p-3 shadow-[var(--shadow-card)]", i < 6 ? "border-saffron-300" : "border-line opacity-70")}>
                <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold", i < 6 ? "bg-saffron-400 text-ink" : "bg-sand text-muted")}>{i + 1}</span>
                <FoodImage src={s.imageUrl} alt="" className="size-14 shrink-0 rounded-xl" />
                <div className="min-w-0 flex-1">
                  <p className="font-bold">{pick(s, "name", locale)}</p>
                  <p className="text-sm text-muted tabular-nums">{formatKWD(s.price, locale)} {i < 6 && <Badge tone="saffron" className="ms-1">{p.onHomepage}</Badge>} {!s.isAvailable && <Badge tone="red">{t.common.unavailable}</Badge>}</p>
                </div>
                <MoveButtons first={i === 0} last={i === selected.length - 1} disabled={pending} onMove={(d) => start(() => movePopularAction(s.id, d))} />
                <button disabled={pending} onClick={() => start(() => removePopularAction(s.id))} className="flex size-10 items-center justify-center rounded-lg text-muted hover:bg-pomegranate-50 hover:text-pomegranate-600" aria-label={p.remove}>
                  <TrashIcon size={17} />
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

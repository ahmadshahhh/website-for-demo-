"use client";

import { useActionState, useState, useTransition } from "react";
import { deleteAreaAction, saveAreaAction } from "@/app/admin/actions/settings";
import { useI18n } from "@/components/providers/I18nProvider";
import { Button } from "@/components/ui/Button";
import { PlusIcon, TrashIcon } from "@/components/ui/icons";
import { filsToInput } from "@/lib/money";
import { useSavedToast } from "./useSavedToast";

type Area = { id: number; nameEn: string; nameAr: string; deliveryFee: number | null; isActive: boolean };
const inp = "h-10 rounded-lg border border-line-strong bg-white px-3 text-sm outline-none focus:border-saffron-500";

function Row({ a }: { a: Area }) {
  const { t } = useI18n();
  const [state, action, saving] = useActionState(saveAreaAction.bind(null, a.id), null);
  const [pending, start] = useTransition();
  useSavedToast(state);
  return (
    <li className="flex flex-wrap items-center gap-2 p-3">
      <form action={action} className="flex flex-1 flex-wrap items-center gap-2">
        <input name="nameEn" defaultValue={a.nameEn} required className={`${inp} min-w-36 flex-1`} dir="ltr" aria-label={t.admin.areas.nameEn} />
        <input name="nameAr" defaultValue={a.nameAr} required className={`${inp} min-w-36 flex-1`} dir="rtl" aria-label={t.admin.areas.nameAr} />
        <input name="deliveryFee" defaultValue={a.deliveryFee != null ? filsToInput(a.deliveryFee) : ""} placeholder={t.admin.areas.fee} title={t.admin.areas.feeHint} className={`${inp} w-32`} dir="ltr" inputMode="decimal" />
        <label className="flex items-center gap-2 text-sm font-semibold text-ink-soft">
          <input type="checkbox" name="isActive" defaultChecked={a.isActive} className="size-4 accent-saffron-500" /> {t.admin.areas.active}
        </label>
        <Button size="sm" variant="outline" className="h-10" loading={saving}>{t.common.save}</Button>
      </form>
      <button disabled={pending} onClick={() => confirm(t.admin.areas.deleteConfirm) && start(() => deleteAreaAction(a.id))} className="flex size-10 items-center justify-center rounded-lg text-muted hover:bg-pomegranate-50 hover:text-pomegranate-600" aria-label={t.common.delete}>
        <TrashIcon size={17} />
      </button>
    </li>
  );
}

export function AreaManager({ areas }: { areas: Area[] }) {
  const { t } = useI18n();
  const [state, action, pending] = useActionState(saveAreaAction.bind(null, null), null);
  useSavedToast(state);
  const [key, setKey] = useState(0);
  const [last, setLast] = useState(state);
  if (state !== last) {
    setLast(state);
    if (state?.ok) setKey((k) => k + 1);
  }
  return (
    <div className="space-y-5">
      <form key={key} action={action} className="flex flex-wrap gap-2 rounded-2xl border border-line bg-white p-4 shadow-[var(--shadow-card)]">
        <input name="nameEn" required placeholder={t.admin.areas.nameEn} className={`${inp} min-w-40 flex-1`} dir="ltr" />
        <input name="nameAr" required placeholder={t.admin.areas.nameAr} className={`${inp} min-w-40 flex-1`} dir="rtl" />
        <input name="deliveryFee" placeholder={t.admin.areas.fee} title={t.admin.areas.feeHint} className={`${inp} w-36`} dir="ltr" inputMode="decimal" />
        <Button className="h-10" loading={pending} icon={<PlusIcon size={16} />}>{t.admin.areas.add}</Button>
      </form>
      <p className="text-sm text-muted">{t.admin.areas.feeHint}</p>
      <ul className="divide-y divide-line rounded-2xl border border-line bg-white shadow-[var(--shadow-card)]">
        {areas.map((a) => <Row key={a.id} a={a} />)}
      </ul>
    </div>
  );
}

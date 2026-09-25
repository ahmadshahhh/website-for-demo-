"use client";

import { useActionState, useState, useTransition } from "react";
import { deleteCategoryAction, moveCategoryAction, saveCategoryAction } from "@/app/admin/actions/menu";
import { useI18n } from "@/components/providers/I18nProvider";
import { Button } from "@/components/ui/Button";
import { PlusIcon, TrashIcon } from "@/components/ui/icons";
import { MoveButtons } from "./MenuRowActions";
import { useSavedToast } from "./useSavedToast";

type Cat = { id: number; nameEn: string; nameAr: string; isActive: boolean; items: number };
const inp = "h-10 w-full rounded-lg border border-line-strong bg-white px-3 text-sm outline-none focus:border-saffron-500";

function Row({ c, first, last }: { c: Cat; first: boolean; last: boolean }) {
  const { t } = useI18n();
  const [state, action, saving] = useActionState(saveCategoryAction.bind(null, c.id), null);
  const [pending, start] = useTransition();
  useSavedToast(state);
  return (
    <li className="flex flex-wrap items-center gap-3 p-3">
      <MoveButtons first={first} last={last} disabled={pending} onMove={(d) => start(() => moveCategoryAction(c.id, d))} />
      <form action={action} className="flex flex-1 flex-wrap items-center gap-2">
        <input name="nameEn" defaultValue={c.nameEn} required className={`${inp} min-w-36 flex-1`} dir="ltr" aria-label={t.admin.categories.nameEn} />
        <input name="nameAr" defaultValue={c.nameAr} required className={`${inp} min-w-36 flex-1`} dir="rtl" lang="ar" aria-label={t.admin.categories.nameAr} />
        <label className="flex items-center gap-2 text-sm font-semibold text-ink-soft">
          <input type="checkbox" name="isActive" defaultChecked={c.isActive} className="size-4 accent-saffron-500" /> {t.admin.categories.active}
        </label>
        <span className="text-xs text-muted">{c.items} {t.admin.categories.items}</span>
        <Button size="sm" variant="outline" className="h-10" loading={saving}>{t.common.save}</Button>
      </form>
      <button
        disabled={pending}
        onClick={() => confirm(t.admin.categories.deleteConfirm) && start(() => deleteCategoryAction(c.id))}
        className="flex size-10 items-center justify-center rounded-lg text-muted hover:bg-pomegranate-50 hover:text-pomegranate-600"
        aria-label={t.common.delete}
      >
        <TrashIcon size={17} />
      </button>
    </li>
  );
}

export function CategoryManager({ categories }: { categories: Cat[] }) {
  const { t } = useI18n();
  const [state, action, pending] = useActionState(saveCategoryAction.bind(null, null), null);
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
        <input name="nameEn" required placeholder={t.admin.categories.nameEn} className={`${inp} min-w-40 flex-1`} dir="ltr" />
        <input name="nameAr" required placeholder={t.admin.categories.nameAr} className={`${inp} min-w-40 flex-1`} dir="rtl" />
        <Button className="h-10" loading={pending} icon={<PlusIcon size={16} />}>{t.admin.categories.add}</Button>
      </form>
      {categories.length === 0 ? (
        <p className="text-muted">{t.admin.categories.empty}</p>
      ) : (
        <ul className="divide-y divide-line rounded-2xl border border-line bg-white shadow-[var(--shadow-card)]">
          {categories.map((c, i) => <Row key={c.id} c={c} first={i === 0} last={i === categories.length - 1} />)}
        </ul>
      )}
    </div>
  );
}

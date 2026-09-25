"use client";

import { useActionState, useTransition } from "react";
import { addOptionAction, addOptionGroupAction, deleteOptionAction, deleteOptionGroupAction, toggleOptionAction } from "@/app/admin/actions/menu";
import { useI18n } from "@/components/providers/I18nProvider";
import { Button } from "@/components/ui/Button";
import { PlusIcon, TrashIcon } from "@/components/ui/icons";
import type { OptionGroupDTO } from "@/lib/data/menu";
import { formatKWD } from "@/lib/money";
import { Switch } from "./MenuRowActions";

const inp = "h-10 rounded-lg border border-line-strong bg-white px-3 text-sm outline-none focus:border-saffron-500";

function AddOption({ groupId }: { groupId: number }) {
  const { t } = useI18n();
  const [, action, pending] = useActionState(addOptionAction.bind(null, groupId), null);
  return (
    <form action={action} className="mt-3 flex flex-wrap gap-2">
      <input name="nameEn" required placeholder={t.admin.menu.nameEn} className={`${inp} min-w-32 flex-1`} dir="ltr" />
      <input name="nameAr" required placeholder={t.admin.menu.nameAr} className={`${inp} min-w-32 flex-1`} dir="rtl" />
      <input name="price" placeholder="+0.250" className={`${inp} w-24`} dir="ltr" inputMode="decimal" />
      <Button size="sm" className="h-10" loading={pending} icon={<PlusIcon size={15} />}>{t.common.add}</Button>
    </form>
  );
}

export function OptionsEditor({ itemId, groups }: { itemId: number; groups: OptionGroupDTO[] }) {
  const { t, locale } = useI18n();
  const [pending, start] = useTransition();
  const [, addGroup, adding] = useActionState(addOptionGroupAction.bind(null, itemId), null);
  return (
    <div className="space-y-4">
      {groups.map((g) => (
        <div key={g.id} className="rounded-2xl border border-line p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="font-bold">{g.nameEn} / <span lang="ar">{g.nameAr}</span> <span className="text-xs font-normal text-muted">(min {g.minSelect} · max {g.maxSelect})</span></p>
            <button disabled={pending} onClick={() => confirm(t.common.delete + "?") && start(() => deleteOptionGroupAction(g.id))} className="flex size-8 items-center justify-center rounded-lg text-muted hover:bg-pomegranate-50 hover:text-pomegranate-600" aria-label={t.common.delete}><TrashIcon size={16} /></button>
          </div>
          <ul className="mt-2 divide-y divide-line">
            {g.options.map((o) => (
              <li key={o.id} className="flex items-center gap-3 py-2 text-sm">
                <span className="flex-1">{o.nameEn} / <span lang="ar">{o.nameAr}</span></span>
                <span className="tabular-nums text-muted">+{formatKWD(o.priceDelta, locale)}</span>
                <Switch checked={o.isAvailable} disabled={pending} label={t.admin.menu.available} onChange={() => start(() => toggleOptionAction(o.id))} />
                <button disabled={pending} onClick={() => start(() => deleteOptionAction(o.id))} className="flex size-8 items-center justify-center rounded-lg text-muted hover:bg-pomegranate-50 hover:text-pomegranate-600" aria-label={t.common.delete}><TrashIcon size={15} /></button>
              </li>
            ))}
          </ul>
          <AddOption groupId={g.id} />
        </div>
      ))}
      <form action={addGroup} className="flex flex-wrap items-end gap-2 rounded-2xl border border-dashed border-line-strong p-4">
        <input name="nameEn" required placeholder={`${t.admin.menu.nameEn} (Size)`} className={`${inp} min-w-36 flex-1`} dir="ltr" />
        <input name="nameAr" required placeholder={`${t.admin.menu.nameAr} (الحجم)`} className={`${inp} min-w-36 flex-1`} dir="rtl" />
        <label className="text-xs font-semibold text-muted">min<input name="minSelect" type="number" min={0} max={10} defaultValue={0} className={`${inp} ms-1 w-16`} /></label>
        <label className="text-xs font-semibold text-muted">max<input name="maxSelect" type="number" min={1} max={10} defaultValue={1} className={`${inp} ms-1 w-16`} /></label>
        <Button size="sm" variant="dark" className="h-10" loading={adding} icon={<PlusIcon size={15} />}>{t.common.add}</Button>
      </form>
    </div>
  );
}

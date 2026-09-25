"use client";

import { useActionForm } from "@/components/useActionForm";
import { useTransition } from "react";
import { deleteMenuItemAction, saveMenuItemAction } from "@/app/admin/actions/menu";
import { useI18n } from "@/components/providers/I18nProvider";
import { Button } from "@/components/ui/Button";
import { Checkbox, Input, Select, Textarea } from "@/components/ui/Field";
import { TrashIcon } from "@/components/ui/icons";
import type { CategoryDTO } from "@/lib/data/menu";
import { pick } from "@/lib/i18n/config";
import { filsToInput } from "@/lib/money";
import { ImageField } from "./ImageField";
import { Panel } from "./ui";
import { useSavedToast } from "./useSavedToast";

type Item = {
  id: number;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  price: number;
  categoryId: number | null;
  imageUrl: string | null;
  isAvailable: boolean;
  tags: string;
  isPopular: boolean;
};

export function MenuItemForm({ categories, item }: { categories: CategoryDTO[]; item: Item | null }) {
  const { t, locale } = useI18n();
  const m = t.admin.menu;
  const [state, onSubmit, pending] = useActionForm(saveMenuItemAction.bind(null, item?.id ?? null), null);
  const [deleting, startDelete] = useTransition();
  useSavedToast(state, item ? m.updated : m.created);
  const f = state?.fields ?? {};
  const req = (k: string) => (f[k] ? t.common.required : undefined);

  return (
    <form onSubmit={onSubmit} className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
      <div className="space-y-6">
        <Panel>
          <div className="grid gap-4 md:grid-cols-2">
            <Input label={m.nameEn} name="nameEn" defaultValue={item?.nameEn} required maxLength={80} error={req("nameEn")} dir="ltr" />
            <Input label={m.nameAr} name="nameAr" defaultValue={item?.nameAr} required maxLength={80} error={req("nameAr")} dir="rtl" lang="ar" />
            <Textarea label={m.descEn} name="descriptionEn" defaultValue={item?.descriptionEn} maxLength={500} dir="ltr" />
            <Textarea label={m.descAr} name="descriptionAr" defaultValue={item?.descriptionAr} maxLength={500} dir="rtl" lang="ar" />
          </div>
        </Panel>
        <Panel>
          <ImageField name="image" label={m.image} current={item?.imageUrl ?? null} error={f.image} />
        </Panel>
      </div>
      <div className="space-y-6">
        <Panel>
          <div className="space-y-4">
            <Input label={m.price} name="price" inputMode="decimal" defaultValue={item ? filsToInput(item.price) : ""} placeholder="2.750" required dir="ltr" error={f.price && m.badPrice} />
            <Select label={m.category} name="categoryId" defaultValue={item?.categoryId ?? categories[0]?.id ?? 0}>
              {categories.map((c) => <option key={c.id} value={c.id}>{pick(c, "name", locale)}</option>)}
              <option value={0}>{m.noCategory}</option>
            </Select>
            <Input label={m.tags} hint={m.tagsHint} name="tags" defaultValue={item?.tags} dir="ltr" />
            <div className="flex flex-col gap-3 rounded-xl bg-sand/60 p-4">
              <Checkbox label={m.available} name="isAvailable" defaultChecked={item?.isAvailable ?? true} />
              <Checkbox label={`★ ${m.popular}`} name="isPopular" defaultChecked={item?.isPopular ?? false} />
            </div>
          </div>
        </Panel>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" size="lg" loading={pending} className="flex-1">{t.common.save}</Button>
          {item && (
            <Button
              type="button"
              size="lg"
              variant="danger"
              loading={deleting}
              icon={<TrashIcon size={18} />}
              onClick={() => confirm(m.deleteConfirm) && startDelete(() => deleteMenuItemAction(item.id))}
            >
              {t.common.delete}
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}

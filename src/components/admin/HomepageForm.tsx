"use client";

import { useActionForm } from "@/components/useActionForm";
import { saveHomepageAction } from "@/app/admin/actions/settings";
import { useI18n } from "@/components/providers/I18nProvider";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Field";
import type { HomepageContent } from "@/lib/data/settings";
import { ImageField } from "./ImageField";
import { Panel } from "./ui";
import { useSavedToast } from "./useSavedToast";

export function HomepageForm({ home }: { home: HomepageContent }) {
  const { t } = useI18n();
  const h = t.admin.homepage;
  const [state, onSubmit, pending] = useActionForm(saveHomepageAction, null);
  useSavedToast(state);
  const f = state?.fields ?? {};
  const req = (k: string) => (f[k] ? t.common.required : undefined);
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Panel title={h.hero}>
        <div className="grid gap-4 md:grid-cols-2">
          <Input label={h.heroTitleEn} name="heroTitleEn" defaultValue={home.heroTitleEn} dir="ltr" error={req("heroTitleEn")} />
          <Input label={h.heroTitleAr} name="heroTitleAr" defaultValue={home.heroTitleAr} dir="rtl" error={req("heroTitleAr")} />
          <Textarea label={h.taglineEn} name="taglineEn" defaultValue={home.taglineEn} dir="ltr" error={req("taglineEn")} />
          <Textarea label={h.taglineAr} name="taglineAr" defaultValue={home.taglineAr} dir="rtl" error={req("taglineAr")} />
        </div>
        <div className="mt-5"><ImageField name="heroImage" label={h.heroImage} current={home.heroImageUrl} error={f.heroImage} /></div>
      </Panel>
      <Panel title={h.about}>
        <div className="grid gap-4 md:grid-cols-2">
          <Input label={h.aboutTitleEn} name="aboutTitleEn" defaultValue={home.aboutTitleEn} dir="ltr" error={req("aboutTitleEn")} />
          <Input label={h.aboutTitleAr} name="aboutTitleAr" defaultValue={home.aboutTitleAr} dir="rtl" error={req("aboutTitleAr")} />
          <Textarea label={h.aboutEn} name="aboutEn" defaultValue={home.aboutEn} dir="ltr" className="[&_textarea]:min-h-40" error={req("aboutEn")} />
          <Textarea label={h.aboutAr} name="aboutAr" defaultValue={home.aboutAr} dir="rtl" className="[&_textarea]:min-h-40" error={req("aboutAr")} />
        </div>
        <div className="mt-5"><ImageField name="aboutImage" label={h.aboutImage} current={home.aboutImageUrl} error={f.aboutImage} /></div>
      </Panel>
      <div className="sticky bottom-4 z-10 flex justify-end">
        <Button type="submit" size="lg" loading={pending} className="shadow-[var(--shadow-lift)]">{t.common.save}</Button>
      </div>
    </form>
  );
}

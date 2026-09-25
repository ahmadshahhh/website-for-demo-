"use client";

import { useActionForm } from "@/components/useActionForm";
import { saveSettingsAction } from "@/app/admin/actions/settings";
import { useI18n } from "@/components/providers/I18nProvider";
import { Button } from "@/components/ui/Button";
import { Checkbox, Input, Textarea } from "@/components/ui/Field";
import type { RestaurantSettings } from "@/lib/data/settings";
import { filsToInput } from "@/lib/money";
import { ImageField } from "./ImageField";
import { Panel } from "./ui";
import { useSavedToast } from "./useSavedToast";

export function SettingsForm({ s }: { s: RestaurantSettings }) {
  const { t } = useI18n();
  const x = t.admin.settings;
  const [state, onSubmit, pending] = useActionForm(saveSettingsAction, null);
  useSavedToast(state, x.saved);
  const f = state?.fields ?? {};
  const hours = [...s.openingHours].sort((a, b) => a.day - b.day);
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title={x.general}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label={x.nameEn} name="nameEn" defaultValue={s.nameEn} required dir="ltr" error={f.nameEn && t.common.required} />
            <Input label={x.nameAr} name="nameAr" defaultValue={s.nameAr} required dir="rtl" error={f.nameAr && t.common.required} />
          </div>
          <div className="mt-4"><ImageField name="logo" label={x.logo} current={s.logoUrl} error={f.logo} /></div>
        </Panel>

        <Panel title={x.status}>
          <div className="space-y-4">
            <Checkbox label={x.isOpen} name="isOpen" defaultChecked={s.isOpen} className="text-base" />
            <Textarea label={x.closedMsgEn} name="closedMessageEn" defaultValue={s.closedMessageEn} dir="ltr" />
            <Textarea label={x.closedMsgAr} name="closedMessageAr" defaultValue={s.closedMessageAr} dir="rtl" />
          </div>
        </Panel>

        <Panel title={x.contact}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label={x.phone} name="phone" defaultValue={s.phone} dir="ltr" />
            <Input label={x.whatsapp} name="whatsapp" defaultValue={s.whatsapp} dir="ltr" inputMode="numeric" />
            <Input label={x.email} name="email" type="email" defaultValue={s.email} dir="ltr" />
            <Input label={x.instagram} name="instagram" defaultValue={s.instagram} dir="ltr" />
            <Textarea label={x.addressEn} name="addressEn" defaultValue={s.addressEn} dir="ltr" />
            <Textarea label={x.addressAr} name="addressAr" defaultValue={s.addressAr} dir="rtl" />
            <Input label={x.maps} name="mapsUrl" defaultValue={s.mapsUrl} dir="ltr" className="sm:col-span-2" error={f.mapsUrl && "https://…"} />
          </div>
        </Panel>

        <Panel title={x.hours}>
          <div className="space-y-2">
            {hours.map((h) => (
              <div key={h.day} className="flex flex-wrap items-center gap-2 text-sm">
                <span className="w-24 font-semibold">{t.days[h.day]}</span>
                <input type="time" name={`open_${h.day}`} defaultValue={h.open} className="h-10 rounded-lg border border-line-strong bg-white px-2" dir="ltr" />
                <span className="text-muted">–</span>
                <input type="time" name={`close_${h.day}`} defaultValue={h.close} className="h-10 rounded-lg border border-line-strong bg-white px-2" dir="ltr" />
                <label className="ms-2 flex items-center gap-1.5 text-muted">
                  <input type="checkbox" name={`closed_${h.day}`} defaultChecked={h.closed} className="accent-pomegranate-600" /> {x.closedDay}
                </label>
              </div>
            ))}
            {f.hours && <p className="text-sm font-semibold text-pomegranate-600">HH:MM</p>}
          </div>
        </Panel>

        <Panel title={x.delivery}>
          <div className="mb-4 flex flex-wrap gap-6">
            <Checkbox label={x.deliveryEnabled} name="deliveryEnabled" defaultChecked={s.deliveryEnabled} />
            <Checkbox label={x.pickupEnabled} name="pickupEnabled" defaultChecked={s.pickupEnabled} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label={x.deliveryFee} name="deliveryFee" defaultValue={filsToInput(s.deliveryFee)} dir="ltr" inputMode="decimal" error={f.deliveryFee && t.admin.menu.badPrice} />
            <Input label={x.minimumOrder} name="minimumOrder" defaultValue={filsToInput(s.minimumOrder)} dir="ltr" inputMode="decimal" error={f.minimumOrder && t.admin.menu.badPrice} />
            <Input label={x.etaMin} name="deliveryTimeMin" type="number" min={5} defaultValue={s.deliveryTimeMin} />
            <Input label={x.etaMax} name="deliveryTimeMax" type="number" min={5} defaultValue={s.deliveryTimeMax} />
            <Input label={x.pickupTime} name="pickupTime" type="number" min={5} defaultValue={s.pickupTime} />
            <Input label={x.pickupDiscount} name="pickupDiscountPercent" type="number" min={0} max={50} defaultValue={s.pickupDiscountPercent} />
          </div>
        </Panel>

        <Panel title={x.payments}>
          <div className="space-y-3">
            <Checkbox label={x.cashEnabled} name="cashEnabled" defaultChecked={s.cashEnabled} />
            <Checkbox label={x.onlineEnabled} name="onlinePaymentEnabled" defaultChecked={s.onlinePaymentEnabled} />
            <p className="text-xs text-muted">{t.checkout.noCardStored}</p>
          </div>
        </Panel>
      </div>
      <div className="sticky bottom-4 z-10 flex justify-end">
        <Button type="submit" size="lg" loading={pending} className="shadow-[var(--shadow-lift)]">{t.common.save}</Button>
      </div>
    </form>
  );
}

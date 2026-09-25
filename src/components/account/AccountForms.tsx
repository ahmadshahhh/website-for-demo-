"use client";

import { useActionForm } from "@/components/useActionForm";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import {
  addAddressAction,
  changePasswordAction,
  deleteAddressAction,
  setDefaultAddressAction,
  updateProfileAction,
} from "@/app/actions/account";
import { useI18n } from "@/components/providers/I18nProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { PinIcon, PlusIcon, TrashIcon } from "@/components/ui/icons";
import { pick } from "@/lib/i18n/config";

function useResultToast(state: { ok?: boolean; error?: string } | null, okMsg: string, errMap: Record<string, string>) {
  const { toast } = useToast();
  const { t } = useI18n();
  const last = useRef(state);
  useEffect(() => {
    if (state === last.current || !state) return;
    last.current = state;
    if (state.ok) toast(okMsg);
    else if (state.error) toast(errMap[state.error] ?? t.common.somethingWrong, "error");
  }, [state, okMsg, errMap, toast, t]);
}

export function ProfileForm({ name, phone, email }: { name: string; phone: string; email: string }) {
  const { t } = useI18n();
  const [state, onSubmit, pending] = useActionForm(updateProfileAction, null);
  useResultToast(state, t.account.profileSaved, { exists: t.auth.exists });
  const f = state?.fields ?? {};
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Input label={t.auth.name} name="name" defaultValue={name} required error={f.name && t.checkout.errors.name} />
      <Input label={t.auth.mobile} name="phone" type="tel" defaultValue={phone} dir="ltr" required error={f.phone && t.checkout.errors.phone} />
      <Input label={t.auth.email} name="email" type="email" defaultValue={email} required error={f.email && t.checkout.errors.email} />
      <Button type="submit" loading={pending}>{t.account.updateProfile}</Button>
    </form>
  );
}

export function PasswordForm() {
  const { t } = useI18n();
  const [state, action, pending] = useActionState(changePasswordAction, null);
  useResultToast(state, t.account.passwordChanged, { wrongPassword: t.account.wrongPassword });
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);
  return (
    <form ref={formRef} action={action} className="space-y-4">
      <Input label={t.account.currentPassword} name="current" type="password" autoComplete="current-password" required />
      <Input label={t.account.newPassword} hint={t.auth.passwordHint} name="next" type="password" autoComplete="new-password" minLength={8} required error={state?.fields?.next && t.auth.weakPassword} />
      <Button type="submit" variant="outline" loading={pending}>{t.account.changePassword}</Button>
    </form>
  );
}

type Addr = { id: number; label: string; areaId: number | null; block: string; street: string; building: string; floor: string | null; apartment: string | null; isDefault: boolean };
type Area = { id: number; nameEn: string; nameAr: string };

export function AddressBook({ addresses, areas }: { addresses: Addr[]; areas: Area[] }) {
  const { t, locale } = useI18n();
  const [adding, setAdding] = useState(addresses.length === 0);
  const [state, action, pending] = useActionState(addAddressAction, null);
  const [busy, start] = useTransition();
  useResultToast(state, t.account.addressSaved, {});
  const [lastState, setLastState] = useState(state);
  if (state !== lastState) {
    setLastState(state);
    if (state?.ok) setAdding(false);
  }
  const f = state?.fields ?? {};
  return (
    <div className="space-y-3">
      {addresses.length === 0 && !adding && <p className="text-muted">{t.account.noAddresses}</p>}
      <ul className="space-y-2">
        {addresses.map((a) => {
          const area = areas.find((x) => x.id === a.areaId);
          return (
            <li key={a.id} className="flex items-start gap-3 rounded-2xl border border-line p-3.5">
              <PinIcon size={18} className="mt-0.5 shrink-0 text-pomegranate-600" />
              <div className="min-w-0 flex-1 text-sm">
                <p className="flex items-center gap-2 font-bold">{a.label} {a.isDefault && <Badge tone="saffron">{t.account.default}</Badge>}</p>
                <p className="text-muted">
                  {area ? pick(area, "name", locale) : ""} · {t.checkout.block} {a.block}, {t.checkout.street} {a.street}, {t.checkout.building} {a.building}
                  {a.floor ? `, ${t.checkout.floor} ${a.floor}` : ""}
                  {a.apartment ? `, ${t.checkout.apartment} ${a.apartment}` : ""}
                </p>
                {!a.isDefault && (
                  <button disabled={busy} onClick={() => start(() => setDefaultAddressAction(a.id))} className="mt-1 text-xs font-semibold text-pomegranate-600 hover:underline">
                    {t.account.makeDefault}
                  </button>
                )}
              </div>
              <button disabled={busy} onClick={() => start(() => deleteAddressAction(a.id))} className="flex size-9 items-center justify-center rounded-lg text-muted hover:bg-pomegranate-50 hover:text-pomegranate-600" aria-label={t.account.removeAddress}>
                <TrashIcon size={17} />
              </button>
            </li>
          );
        })}
      </ul>
      {adding ? (
        <form action={action} className="grid gap-3 rounded-2xl bg-sand/50 p-4 sm:grid-cols-6">
          <Input label={t.account.label} name="label" placeholder={t.account.labelPlaceholder} defaultValue="Home" required className="sm:col-span-2" />
          <Select label={t.checkout.area} name="areaId" required className="sm:col-span-4" defaultValue="" error={f.areaId && t.checkout.errors.area}>
            <option value="" disabled>{t.checkout.selectArea}</option>
            {areas.map((a) => <option key={a.id} value={a.id}>{pick(a, "name", locale)}</option>)}
          </Select>
          <Input label={t.checkout.block} name="block" required className="sm:col-span-2" error={f.block && t.checkout.errors.block} />
          <Input label={t.checkout.street} name="street" required className="sm:col-span-4" error={f.street && t.checkout.errors.street} />
          <Input label={t.checkout.building} name="building" required className="sm:col-span-2" error={f.building && t.checkout.errors.building} />
          <Input label={t.checkout.floor} name="floor" className="sm:col-span-2" />
          <Input label={t.checkout.apartment} name="apartment" className="sm:col-span-2" />
          <div className="flex gap-2 sm:col-span-6">
            <Button type="submit" loading={pending}>{t.common.save}</Button>
            {addresses.length > 0 && <Button type="button" variant="ghost" onClick={() => setAdding(false)}>{t.common.cancel}</Button>}
          </div>
        </form>
      ) : (
        <Button variant="outline" icon={<PlusIcon size={17} />} onClick={() => setAdding(true)}>{t.account.addAddress}</Button>
      )}
    </div>
  );
}

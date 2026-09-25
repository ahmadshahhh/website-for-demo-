"use client";

import { useActionState } from "react";
import { adminChangePasswordAction } from "@/app/admin/actions/auth";
import { useI18n } from "@/components/providers/I18nProvider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";

export function AdminPasswordForm() {
  const { t } = useI18n();
  const a = t.admin.account;
  const [state, action, pending] = useActionState(adminChangePasswordAction, null);
  return (
    <form action={action} className="space-y-4">
      <Input label={a.current} name="current" type="password" autoComplete="current-password" required />
      <Input label={a.next} name="next" type="password" autoComplete="new-password" minLength={10} required />
      {state?.error && <p role="alert" className="rounded-xl bg-pomegranate-50 p-3 text-sm font-semibold text-pomegranate-700">{state.error === "weak" ? a.weak : a.wrong}</p>}
      {state?.ok && <p role="status" className="rounded-xl bg-leaf-50 p-3 text-sm font-semibold text-leaf">{a.changed}</p>}
      <Button type="submit" loading={pending}>{a.changePassword}</Button>
    </form>
  );
}

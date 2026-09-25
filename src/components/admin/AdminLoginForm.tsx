"use client";

import { useActionState } from "react";
import { adminLoginAction } from "@/app/admin/actions/auth";
import { useI18n } from "@/components/providers/I18nProvider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";

export function AdminLoginForm() {
  const { t } = useI18n();
  const [state, action, pending] = useActionState(adminLoginAction, null);
  return (
    <form action={action} className="space-y-4">
      <Input label={t.admin.email} name="email" type="email" autoComplete="username" required dir="ltr" defaultValue={state?.email} key={state?.email} />
      <Input label={t.admin.password} name="password" type="password" autoComplete="current-password" required />
      {state?.error && (
        <p role="alert" className="rounded-xl bg-pomegranate-50 p-3 text-sm font-semibold text-pomegranate-700">
          {state.error === "rateLimited" ? t.common.tooManyAttempts : t.admin.invalid}
        </p>
      )}
      <Button type="submit" size="lg" variant="dark" className="w-full" loading={pending}>{t.admin.signIn}</Button>
    </form>
  );
}

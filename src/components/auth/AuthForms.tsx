"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction, signupAction } from "@/app/actions/auth";
import { useI18n } from "@/components/providers/I18nProvider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";

export function LoginForm({ next }: { next: string }) {
  const { t } = useI18n();
  const [state, action, pending] = useActionState(loginAction, null);
  const err = state?.error === "rateLimited" ? t.common.tooManyAttempts : state?.error ? t.auth.invalid : null;
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <Input label={t.auth.identifier} name="identifier" autoComplete="username" required defaultValue={state?.values?.identifier} />
      <Input label={t.auth.password} name="password" type="password" autoComplete="current-password" required />
      {err && <p role="alert" className="rounded-xl bg-pomegranate-50 p-3 text-sm font-semibold text-pomegranate-700">{err}</p>}
      <Button type="submit" size="lg" className="w-full" loading={pending}>{t.auth.login}</Button>
      <p className="text-center text-sm text-muted">
        {t.auth.noAccount}{" "}
        <Link href={`/signup?next=${encodeURIComponent(next)}`} className="font-semibold text-pomegranate-600 hover:underline">{t.nav.signup}</Link>
      </p>
    </form>
  );
}

export function SignupForm({ next }: { next: string }) {
  const { t } = useI18n();
  const [state, action, pending] = useActionState(signupAction, null);
  const f = state?.fields ?? {};
  const v = state?.values ?? {};
  const err = state?.error === "rateLimited" ? t.common.tooManyAttempts : state?.error === "exists" ? t.auth.exists : null;
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <Input label={t.auth.name} name="name" autoComplete="name" required defaultValue={v.name} error={f.name && t.checkout.errors.name} />
      <Input label={t.auth.mobile} name="phone" type="tel" inputMode="tel" autoComplete="tel" required placeholder="5000 1234" dir="ltr" defaultValue={v.phone} error={f.phone && t.checkout.errors.phone} />
      <Input label={t.auth.email} name="email" type="email" autoComplete="email" required defaultValue={v.email} error={f.email && t.checkout.errors.email} />
      <Input label={t.auth.password} hint={t.auth.passwordHint} name="password" type="password" autoComplete="new-password" required minLength={8} error={f.password && t.auth.weakPassword} />
      {err && <p role="alert" className="rounded-xl bg-pomegranate-50 p-3 text-sm font-semibold text-pomegranate-700">{err}</p>}
      <Button type="submit" size="lg" className="w-full" loading={pending}>{t.auth.signup}</Button>
      <p className="text-center text-sm text-muted">
        {t.auth.haveAccount}{" "}
        <Link href={`/login?next=${encodeURIComponent(next)}`} className="font-semibold text-pomegranate-600 hover:underline">{t.nav.login}</Link>
      </p>
    </form>
  );
}

"use client";

import { useActionState } from "react";
import { verifyTrackingAction } from "@/app/actions/track";
import { useI18n } from "@/components/providers/I18nProvider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";

export function TrackForm({ defaultId }: { defaultId: string }) {
  const { t } = useI18n();
  const [state, action, pending] = useActionState(verifyTrackingAction, null);
  return (
    <form action={action} className="space-y-4">
      <Input
        label={t.track.trackingId}
        name="trackingId"
        required
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        placeholder={t.track.trackingPlaceholder}
        defaultValue={state?.trackingId ?? defaultId}
        dir="ltr"
        className="[&_input]:font-mono [&_input]:uppercase [&_input]:tracking-wider"
      />
      <Input label={t.track.phone} name="phone" type="tel" inputMode="tel" required placeholder="5000 1234" defaultValue={state?.phone ?? ""} dir="ltr" />
      {state?.error && (
        <p role="alert" className="rounded-xl bg-pomegranate-50 p-3 text-sm font-semibold text-pomegranate-700">
          {state.error === "rateLimited" ? t.common.tooManyAttempts : t.track.notFound}
        </p>
      )}
      <Button type="submit" size="lg" className="w-full" loading={pending}>
        {pending ? t.track.checking : t.track.submit}
      </Button>
    </form>
  );
}

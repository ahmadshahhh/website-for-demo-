"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useI18n } from "@/components/providers/I18nProvider";
import { AlertIcon, RefreshIcon } from "@/components/ui/icons";

/** Friendly, bilingual fallback for unexpected errors, with a retry button. */
export function ErrorView({ error, retry, homeHref = "/" }: { error: Error & { digest?: string }; retry: () => void; homeHref?: string }) {
  const { t } = useI18n();
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-6 py-16 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-pomegranate-50 text-pomegranate-600"><AlertIcon size={30} /></span>
      <h1 className="mt-5 text-2xl font-extrabold">{t.common.somethingWrong}</h1>
      {error.digest && <p className="mt-2 font-mono text-xs text-muted">{error.digest}</p>}
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <button onClick={() => retry()} className="inline-flex h-11 items-center gap-2 rounded-xl bg-saffron-400 px-5 font-semibold text-ink hover:bg-saffron-300">
          <RefreshIcon size={18} /> {t.common.retry}
        </button>
        <Link href={homeHref} className="inline-flex h-11 items-center rounded-xl border border-line-strong bg-white px-5 font-semibold hover:bg-sand">{t.notFound.home}</Link>
      </div>
    </div>
  );
}

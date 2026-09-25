"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setLocaleAction } from "@/app/actions/locale";
import { useI18n } from "@/components/providers/I18nProvider";
import { GlobeIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

/** English | العربية toggle. Remembers the choice and flips LTR/RTL instantly. */
export function LanguageSwitcher({ variant = "pill", className }: { variant?: "pill" | "inline" | "dark" | "compact"; className?: string }) {
  const { locale } = useI18n();
  const router = useRouter();
  const [pending, start] = useTransition();

  const choose = (next: "en" | "ar") => {
    if (next === locale || pending) return;
    start(async () => {
      document.documentElement.lang = next;
      document.documentElement.dir = next === "ar" ? "rtl" : "ltr";
      await setLocaleAction(next);
      router.refresh();
    });
  };

  const opt = (code: "en" | "ar", label: string) => (
    <button
      type="button"
      onClick={() => choose(code)}
      aria-pressed={locale === code}
      lang={code}
      className={cn(
        "rounded-full px-2.5 py-1 text-[0.8rem] font-bold transition-colors",
        code === "ar" && "font-arabic text-[0.85rem]",
        locale === code
          ? variant === "dark"
            ? "bg-saffron-400 text-ink"
            : "bg-ink text-cream"
          : variant === "dark"
            ? "text-cream/70 hover:text-cream"
            : "text-ink-soft hover:text-ink",
      )}
    >
      {label}
    </button>
  );

  if (variant === "compact") {
    const other = locale === "ar" ? "en" : "ar";
    return (
      <button
        type="button"
        onClick={() => choose(other)}
        lang={other}
        aria-label={other === "ar" ? "العربية" : "English"}
        className={cn(
          "flex h-9 items-center gap-1 rounded-full border border-line bg-white px-2.5 text-[0.8rem] font-bold text-ink",
          other === "ar" && "font-arabic",
          pending && "opacity-60",
          className,
        )}
      >
        <GlobeIcon size={15} className="text-muted" />
        {other === "ar" ? "العربية" : "EN"}
      </button>
    );
  }

  return (
    <div
      role="group"
      aria-label="Language / اللغة"
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full p-0.5",
        variant === "pill" && "border border-line bg-white",
        variant === "dark" && "border border-white/15 bg-white/5",
        pending && "opacity-60",
        className,
      )}
    >
      <GlobeIcon size={16} className={cn("mx-1", variant === "dark" ? "text-cream/60" : "text-muted")} />
      {opt("en", "English")}
      {opt("ar", "العربية")}
    </div>
  );
}

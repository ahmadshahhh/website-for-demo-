import { formatKWD } from "@/lib/money";
import type { Locale } from "@/lib/i18n/config";

export function Price({ fils, locale, className = "" }: { fils: number; locale: Locale; className?: string }) {
  return <span className={`whitespace-nowrap tabular-nums ${className}`}>{formatKWD(fils, locale)}</span>;
}

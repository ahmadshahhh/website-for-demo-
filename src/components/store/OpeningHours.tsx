import type { OpeningHours as Hours } from "@/db/schema";
import { cn } from "@/lib/cn";

export function OpeningHours({ hours, days, closedLabel, dark = false }: { hours: Hours; days: string[]; closedLabel: string; dark?: boolean }) {
  const today = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kuwait" })).getDay();
  return (
    <ul className="space-y-1.5 text-[0.95rem]">
      {[...hours].sort((a, b) => a.day - b.day).map((h) => (
        <li
          key={h.day}
          className={cn(
            "flex justify-between gap-4 rounded-lg px-2 py-1",
            h.day === today && (dark ? "bg-white/10 font-bold" : "bg-saffron-50 font-bold"),
          )}
        >
          <span>{days[h.day]}</span>
          <span className="ltr-nums tabular-nums">{h.closed ? closedLabel : `${h.open} – ${h.close}`}</span>
        </li>
      ))}
    </ul>
  );
}

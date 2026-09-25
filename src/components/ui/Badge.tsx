import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "saffron" | "red" | "green" | "neutral" | "dark" | "blue";

const tones: Record<Tone, string> = {
  saffron: "bg-saffron-100 text-saffron-700",
  red: "bg-pomegranate-50 text-pomegranate-600",
  green: "bg-leaf-50 text-leaf",
  neutral: "bg-sand text-ink-soft",
  dark: "bg-ink text-cream",
  blue: "bg-sky-50 text-sky-700",
};

export function Badge({ tone = "neutral", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap", tones[tone], className)}>
      {children}
    </span>
  );
}

import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Spinner } from "./Spinner";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "dark";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-saffron-400 text-ink hover:bg-saffron-300 active:bg-saffron-500 shadow-[0_6px_16px_-8px_rgb(199_125_8/0.8)]",
  secondary: "bg-pomegranate-600 text-white hover:bg-pomegranate-500 active:bg-pomegranate-700",
  dark: "bg-ink text-cream hover:bg-ink-soft",
  outline: "border border-line-strong bg-white text-ink hover:border-ink/40 hover:bg-sand/60",
  ghost: "text-ink hover:bg-sand",
  danger: "bg-white text-pomegranate-600 border border-pomegranate-100 hover:bg-pomegranate-50",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm gap-1.5 rounded-lg",
  md: "h-11 px-5 text-[0.95rem] gap-2 rounded-xl",
  lg: "h-13 px-7 text-base gap-2.5 rounded-xl",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", extra?: string) {
  return cn(
    "inline-flex items-center justify-center font-semibold whitespace-nowrap transition-all duration-150 select-none",
    "disabled:pointer-events-none disabled:opacity-55 active:scale-[0.98]",
    variants[variant],
    sizes[size],
    extra,
  );
}

type ButtonProps = ComponentProps<"button"> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
};

export function Button({ variant, size, loading, icon, className, children, disabled, ...rest }: ButtonProps) {
  return (
    <button className={buttonClass(variant, size, className)} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {loading ? <Spinner size={size === "sm" ? 14 : 18} /> : icon}
      {children}
    </button>
  );
}

type LinkButtonProps = ComponentProps<typeof Link> & { variant?: Variant; size?: Size; icon?: ReactNode };

export function LinkButton({ variant, size, icon, className, children, ...rest }: LinkButtonProps) {
  return (
    <Link className={buttonClass(variant, size, className)} {...rest}>
      {icon}
      {children}
    </Link>
  );
}

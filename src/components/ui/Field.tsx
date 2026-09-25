import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

const control =
  "w-full rounded-xl border bg-white px-3.5 text-[0.95rem] text-ink placeholder:text-muted/70 transition-colors outline-none focus:border-saffron-500 focus:ring-4 focus:ring-saffron-100 disabled:bg-sand/50";

export function Label({ children, htmlFor, hint }: { children: ReactNode; htmlFor?: string; hint?: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 flex items-baseline justify-between gap-2 text-sm font-semibold text-ink-soft">
      <span>{children}</span>
      {hint && <span className="text-xs font-normal text-muted">{hint}</span>}
    </label>
  );
}

export function FieldError({ children, id }: { children?: ReactNode; id?: string }) {
  if (!children) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 text-sm font-medium text-pomegranate-600">
      {children}
    </p>
  );
}

type FieldProps = { label?: ReactNode; hint?: ReactNode; error?: ReactNode; className?: string };

export function Input({ label, hint, error, className, id, ...rest }: FieldProps & ComponentProps<"input">) {
  const fid = id ?? rest.name;
  return (
    <div className={className}>
      {label && <Label htmlFor={fid} hint={hint}>{label}</Label>}
      <input
        id={fid}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${fid}-err` : undefined}
        className={cn(control, "h-12", error ? "border-pomegranate-500" : "border-line-strong")}
        {...rest}
      />
      <FieldError id={`${fid}-err`}>{error}</FieldError>
    </div>
  );
}

export function Textarea({ label, hint, error, className, id, ...rest }: FieldProps & ComponentProps<"textarea">) {
  const fid = id ?? rest.name;
  return (
    <div className={className}>
      {label && <Label htmlFor={fid} hint={hint}>{label}</Label>}
      <textarea
        id={fid}
        aria-invalid={error ? true : undefined}
        className={cn(control, "min-h-24 py-3", error ? "border-pomegranate-500" : "border-line-strong")}
        {...rest}
      />
      <FieldError>{error}</FieldError>
    </div>
  );
}

export function Select({ label, hint, error, className, id, children, ...rest }: FieldProps & ComponentProps<"select">) {
  const fid = id ?? rest.name;
  return (
    <div className={className}>
      {label && <Label htmlFor={fid} hint={hint}>{label}</Label>}
      <select
        id={fid}
        aria-invalid={error ? true : undefined}
        className={cn(control, "h-12 appearance-none bg-[length:18px] bg-[position:right_12px_center] bg-no-repeat pe-10 rtl:bg-[position:left_12px_center]", error ? "border-pomegranate-500" : "border-line-strong")}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2375655a' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
        }}
        {...rest}
      >
        {children}
      </select>
      <FieldError>{error}</FieldError>
    </div>
  );
}

export function Checkbox({ label, className, ...rest }: { label: ReactNode; className?: string } & ComponentProps<"input">) {
  return (
    <label className={cn("inline-flex cursor-pointer items-center gap-2.5 text-sm font-medium text-ink-soft", className)}>
      <input type="checkbox" className="size-5 rounded-md accent-saffron-500" {...rest} />
      <span>{label}</span>
    </label>
  );
}

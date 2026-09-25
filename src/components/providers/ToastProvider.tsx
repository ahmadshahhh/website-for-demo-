"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { AlertIcon, CheckIcon, CloseIcon } from "@/components/ui/icons";

type Toast = { id: number; message: string; tone: "success" | "error" | "info" };
type Ctx = { toast: (message: string, tone?: Toast["tone"]) => void };
const ToastCtx = createContext<Ctx>({ toast: () => {} });

let counter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const toast = useCallback(
    (message: string, tone: Toast["tone"] = "success") => {
      const id = ++counter;
      setToasts((t) => [...t.slice(-2), { id, message, tone }]);
      setTimeout(() => dismiss(id), 3800);
    },
    [dismiss],
  );
  const value = useMemo(() => ({ toast }), [toast]);
  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 sm:bottom-6">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto flex w-full max-w-sm animate-fade-up items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold shadow-[var(--shadow-lift)] ${
              t.tone === "error" ? "bg-pomegranate-600 text-white" : t.tone === "info" ? "bg-white text-ink" : "bg-ink text-cream"
            }`}
          >
            <span className={`flex size-7 shrink-0 items-center justify-center rounded-full ${t.tone === "error" ? "bg-white/15" : "bg-saffron-400 text-ink"}`}>
              {t.tone === "error" ? <AlertIcon size={16} /> : <CheckIcon size={16} />}
            </span>
            <span className="flex-1">{t.message}</span>
            <button onClick={() => dismiss(t.id)} className="opacity-60 hover:opacity-100" aria-label="Dismiss">
              <CloseIcon size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);

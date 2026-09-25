"use client";

import { useEffect, useRef } from "react";
import { useI18n } from "@/components/providers/I18nProvider";
import { useToast } from "@/components/providers/ToastProvider";

export function useSavedToast(state: { ok?: boolean; error?: string; fields?: Record<string, string> } | null, message?: string) {
  const { toast } = useToast();
  const { t } = useI18n();
  const last = useRef(state);
  useEffect(() => {
    if (!state || state === last.current) return;
    last.current = state;
    if (state.ok) toast(message ?? t.common.saved);
    else toast(t.checkout.fixErrors, "error");
  }, [state, message, toast, t]);
}

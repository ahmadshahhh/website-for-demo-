"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { lineKey, MAX_LINES, MAX_QTY, type CartLine } from "@/lib/cart/types";

/**
 * The cart lives in localStorage (works for guests, survives refresh) and is
 * synced across tabs. It only holds item ids, option ids, quantities and a
 * display snapshot — the server re-prices everything at checkout.
 */
const KEY = "sy_cart_v1";
const EMPTY: CartLine[] = [];
let cache: CartLine[] | null = null;
const listeners = new Set<() => void>();

function read(): CartLine[] {
  if (cache) return cache;
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || "[]");
    cache = Array.isArray(parsed) ? parsed.filter((l) => l && Number.isInteger(l.itemId) && l.quantity > 0) : [];
  } catch {
    cache = [];
  }
  return cache!;
}

function write(lines: CartLine[]) {
  cache = lines;
  try {
    localStorage.setItem(KEY, JSON.stringify(lines));
  } catch {
    /* storage full / disabled — keep in memory */
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      cb();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

type AddInput = Omit<CartLine, "key" | "quantity"> & { quantity?: number };

type CartCtx = {
  lines: CartLine[];
  count: number;
  hydrated: boolean;
  add: (line: AddInput) => void;
  setQuantity: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  replace: (lines: CartLine[]) => void;
};

const Ctx = createContext<CartCtx | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const lines = useSyncExternalStore(subscribe, read, () => EMPTY);
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false);

  const add = useCallback((input: AddInput) => {
    const key = lineKey(input.itemId, input.optionIds);
    const current = read();
    const existing = current.find((l) => l.key === key);
    const qty = input.quantity ?? 1;
    if (existing) {
      write(current.map((l) => (l.key === key ? { ...l, ...input, key, quantity: Math.min(MAX_QTY, l.quantity + qty) } : l)));
    } else if (current.length < MAX_LINES) {
      write([...current, { ...input, key, quantity: Math.min(MAX_QTY, qty) }]);
    }
  }, []);

  const setQuantity = useCallback((key: string, quantity: number) => {
    if (quantity < 1) write(read().filter((l) => l.key !== key));
    else write(read().map((l) => (l.key === key ? { ...l, quantity: Math.min(MAX_QTY, quantity) } : l)));
  }, []);

  const remove = useCallback((key: string) => write(read().filter((l) => l.key !== key)), []);
  const clear = useCallback(() => write([]), []);
  const replace = useCallback((next: CartLine[]) => write(next.slice(0, MAX_LINES)), []);

  const value = useMemo(
    () => ({ lines, count: lines.reduce((s, l) => s + l.quantity, 0), hydrated, add, setQuantity, remove, clear, replace }),
    [lines, hydrated, add, setQuantity, remove, clear, replace],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useCart outside CartProvider");
  return v;
}

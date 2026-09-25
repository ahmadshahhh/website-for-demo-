"use client";

import { useEffect, useState } from "react";
import { quoteCartAction } from "@/app/actions/cart";
import { useCart } from "@/components/providers/CartProvider";
import type { Quote } from "@/lib/cart/types";

/** Re-prices the cart on the server whenever lines, order type or area change. */
export function useQuote(orderType: "delivery" | "pickup", areaId: number | null) {
  const { lines, hydrated } = useCart();
  const [result, setResult] = useState<{ sig: string; quote: Quote | null } | null>(null);
  const sig = JSON.stringify([lines.map((l) => [l.itemId, l.quantity, l.optionIds]), orderType, areaId]);

  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;
    const id = setTimeout(async () => {
      const q = await quoteCartAction({
        lines: lines.map((l) => ({ itemId: l.itemId, quantity: l.quantity, optionIds: l.optionIds })),
        orderType,
        areaId,
      }).catch(() => null);
      if (!cancelled) setResult({ sig, quote: q });
    }, 150);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig, hydrated]);

  // Keep showing the previous quote (dimmed) while a new one is fetched.
  return { quote: result?.quote ?? null, loading: result?.sig !== sig };
}

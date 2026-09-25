"use server";

import { z } from "zod";
import { MAX_LINES, MAX_QTY, type Quote } from "@/lib/cart/types";
import { priceCart } from "@/lib/orders/pricing";

const schema = z.object({
  lines: z
    .array(
      z.object({
        itemId: z.number().int().positive(),
        quantity: z.number().int().min(1).max(MAX_QTY),
        optionIds: z.array(z.number().int().positive()).max(20),
      }),
    )
    .max(MAX_LINES),
  orderType: z.enum(["delivery", "pickup"]),
  areaId: z.number().int().positive().nullable().optional(),
});

/** Authoritative prices for whatever is in the browser cart. */
export async function quoteCartAction(input: z.input<typeof schema>): Promise<Quote | null> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return null;
  const { lines, orderType, areaId } = parsed.data;
  const q = await priceCart(lines, { orderType, areaId });
  // Strip server-only fields before returning to the client.
  return {
    ...q,
    lines: q.lines.map((l) => ({
      key: l.key,
      itemId: l.itemId,
      quantity: l.quantity,
      optionIds: l.optionIds,
      slug: l.slug,
      nameEn: l.nameEn,
      nameAr: l.nameAr,
      imageUrl: l.imageUrl,
      optionNamesEn: l.optionNamesEn,
      optionNamesAr: l.optionNamesAr,
      unitPrice: l.unitPrice,
      lineTotal: l.lineTotal,
      problem: l.problem,
    })),
  };
}

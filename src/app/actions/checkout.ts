"use server";

import { revalidatePath } from "next/cache";
import { getCurrentCustomer } from "@/lib/auth/session";
import { getLocale } from "@/lib/i18n/server";
import type { PlaceOrderResult } from "@/lib/orders/checkout-schema";
import { placeOrder, retryPayment } from "@/lib/orders/service";
import { clientIp, consumeRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

export async function placeOrderAction(input: unknown): Promise<PlaceOrderResult> {
  if (!(await consumeRateLimit(RATE_LIMITS.placeOrder, await clientIp()))) {
    return { ok: false, error: "rateLimited" };
  }
  const result = await placeOrder(input, await getCurrentCustomer(), await getLocale());
  if (result.ok) revalidatePath("/admin", "layout");
  return result;
}

export async function retryPaymentAction(trackingId: string): Promise<string | null> {
  if (typeof trackingId !== "string" || trackingId.length > 20) return null;
  return retryPayment(trackingId);
}

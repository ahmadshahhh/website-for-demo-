import { z } from "zod";
import { normalizePhone } from "@/lib/phone";
import { MAX_LINES, MAX_QTY } from "@/lib/cart/types";

const text = (max: number) => z.string().trim().max(max);

export const checkoutSchema = z
  .object({
    idempotencyKey: z.string().min(16).max(64).regex(/^[A-Za-z0-9-]+$/),
    orderType: z.enum(["delivery", "pickup"]),
    name: text(80).min(2, "name"),
    phone: z.string().transform((v, ctx) => {
      const n = normalizePhone(v);
      if (!n) {
        ctx.addIssue({ code: "custom", message: "phone" });
        return z.NEVER;
      }
      return n;
    }),
    email: z
      .string()
      .trim()
      .max(120)
      .optional()
      .transform((v) => (v ? v.toLowerCase() : undefined))
      .refine((v) => !v || z.email().safeParse(v).success, "email"),
    areaId: z.coerce.number().int().positive().optional().nullable(),
    block: text(20).optional(),
    street: text(80).optional(),
    building: text(40).optional(),
    floor: text(10).optional(),
    apartment: text(10).optional(),
    instructions: text(300).optional(),
    saveAddress: z.boolean().optional(),
    paymentMethod: z.enum(["cash", "online"]),
    lines: z
      .array(
        z.object({
          itemId: z.number().int().positive(),
          quantity: z.number().int().min(1).max(MAX_QTY),
          optionIds: z.array(z.number().int().positive()).max(20),
        }),
      )
      .min(1, "empty")
      .max(MAX_LINES),
  })
  .superRefine((v, ctx) => {
    if (v.orderType !== "delivery") return;
    if (!v.areaId) ctx.addIssue({ code: "custom", path: ["areaId"], message: "area" });
    if (!v.block) ctx.addIssue({ code: "custom", path: ["block"], message: "block" });
    if (!v.street) ctx.addIssue({ code: "custom", path: ["street"], message: "street" });
    if (!v.building) ctx.addIssue({ code: "custom", path: ["building"], message: "building" });
  });

export type CheckoutInput = z.input<typeof checkoutSchema>;

export type PlaceOrderResult =
  | { ok: true; trackingId: string; redirectUrl: string }
  | {
      ok: false;
      error:
        | "validation"
        | "closed"
        | "unavailable"
        | "options"
        | "minimum"
        | "deliveryOff"
        | "pickupOff"
        | "paymentOff"
        | "empty"
        | "rateLimited"
        | "unknown";
      fields?: Record<string, string>;
      items?: string[];
    };

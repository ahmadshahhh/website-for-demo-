import "server-only";
import { sign, verifySignature } from "@/lib/crypto";
import type { PaymentProvider } from "../types";

/**
 * Built-in test gateway. Its hosted page (/pay/[paymentId]) only offers
 * "approve" / "decline" — it never asks for card details. Outcomes are
 * HMAC-signed so they can't be forged by editing a URL.
 */
export const simulatorProvider: PaymentProvider = {
  id: "simulator",
  async initiate({ paymentId }) {
    const sig = await sign(`pay:${paymentId}`);
    return { redirectUrl: `/pay/${paymentId}?sig=${sig}`, providerReference: `SIM-${paymentId.slice(0, 8)}` };
  },
  async verifyCallback(input) {
    const paymentId = input.get("paymentId") ?? "";
    const outcome = input.get("outcome");
    const sig = input.get("sig") ?? "";
    if (!paymentId || (outcome !== "paid" && outcome !== "failed")) return null;
    if (!(await verifySignature(`pay:${paymentId}:${outcome}`, sig))) return null;
    return { paymentId, status: outcome };
  },
};

export async function signSimulatorOutcome(paymentId: string, outcome: "paid" | "failed") {
  return sign(`pay:${paymentId}:${outcome}`);
}

export async function verifySimulatorLink(paymentId: string, sig: string) {
  return verifySignature(`pay:${paymentId}`, sig);
}

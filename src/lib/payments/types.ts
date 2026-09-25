/**
 * Payment gateway contract. A real Kuwait gateway (KNET via MyFatoorah, Tap,
 * UPayments, Hesabe, …) implements this interface and is registered in
 * ./registry.ts. The customer is always redirected to the gateway's hosted
 * page, so card numbers / CVV never touch this application.
 */
export type InitiateParams = {
  paymentId: string;
  trackingId: string;
  amountFils: number;
  currency: "KWD";
  locale: "en" | "ar";
  customer: { name: string; phone: string; email?: string | null };
  /** Absolute URLs the gateway sends the customer back to. */
  returnUrl: string;
  callbackUrl: string;
};

export type InitiateResult = { redirectUrl: string; providerReference?: string };

export type VerifyResult = { paymentId: string; status: "paid" | "failed"; providerReference?: string };

export interface PaymentProvider {
  id: string;
  initiate(params: InitiateParams): Promise<InitiateResult>;
  /** Verify a gateway callback/webhook. Must check signatures / re-query the gateway. */
  verifyCallback(input: URLSearchParams): Promise<VerifyResult | null>;
}

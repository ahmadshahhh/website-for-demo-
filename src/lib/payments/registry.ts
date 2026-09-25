import "server-only";
import { simulatorProvider } from "./providers/simulator";
import type { PaymentProvider } from "./types";

/**
 * Register real gateways here, e.g.
 *   import { myFatoorahProvider } from "./providers/myfatoorah";
 *   const providers = { simulator: simulatorProvider, myfatoorah: myFatoorahProvider };
 * and set PAYMENT_PROVIDER=myfatoorah.
 */
const providers: Record<string, PaymentProvider> = {
  simulator: simulatorProvider,
};

export function getOnlineProvider(): PaymentProvider {
  const id = process.env.PAYMENT_PROVIDER || "simulator";
  const p = providers[id];
  if (!p) throw new Error(`Unknown PAYMENT_PROVIDER "${id}"`);
  return p;
}

export function getProviderById(id: string): PaymentProvider | undefined {
  return providers[id];
}

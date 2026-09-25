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
  const id = process.env.PAYMENT_PROVIDER?.trim() || "simulator";
  const p = providers[id];
  if (!p) {
    console.error(`Unknown PAYMENT_PROVIDER "${id}" — falling back to the test simulator.`);
    return simulatorProvider;
  }
  return p;
}

export function getProviderById(id: string): PaymentProvider | undefined {
  return providers[id];
}

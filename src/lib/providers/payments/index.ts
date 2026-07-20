import type { PaymentMethodId, PaymentProvider } from "./types";
import { codAdapter } from "./cod.adapter";
import { bankTransferAdapter } from "./bank-transfer.adapter";
import { kuraimiAdapter } from "./kuraimi.adapter";
import { mtnCashAdapter } from "./mtn-cash.adapter";
import { sabafonCashAdapter } from "./sabafon-cash.adapter";
import { hawalaAdapter } from "./hawala.adapter";

export type { PaymentProvider, PaymentMethodId, InitiatePaymentInput, InitiatePaymentResult } from "./types";

const registry: Record<PaymentMethodId, PaymentProvider> = {
  cod: codAdapter,
  bank_transfer: bankTransferAdapter,
  kuraimi: kuraimiAdapter,
  mtn_cash: mtnCashAdapter,
  sabafon_cash: sabafonCashAdapter,
  hawala: hawalaAdapter,
};

export function listPaymentProviders(): PaymentProvider[] {
  return Object.values(registry);
}

export function listEnabledPaymentProviders(): PaymentProvider[] {
  return listPaymentProviders().filter((p) => p.enabled);
}

export function getPaymentProvider(id: PaymentMethodId): PaymentProvider {
  return registry[id];
}

import type { PaymentProvider, InitiatePaymentInput, InitiatePaymentResult } from "./types";

/** TODO: integrate SabaFon Cash API when merchant credentials are provisioned. */
export const sabafonCashAdapter: PaymentProvider = {
  id: "sabafon_cash",
  displayName: "سبأفون كاش",
  requiresManualVerification: true,
  enabled: false,

  async initiate(_input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    return {
      kind: "manual",
      instructions: "الدفع عبر سبأفون كاش — بانتظار تفعيل التكامل.",
      status: "unpaid",
    };
  },

  async verify() {
    return "unpaid" as const;
  },
};

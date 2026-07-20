import type { PaymentProvider, InitiatePaymentInput, InitiatePaymentResult } from "./types";

/** TODO: integrate MTN Cash API when merchant credentials are provisioned. */
export const mtnCashAdapter: PaymentProvider = {
  id: "mtn_cash",
  displayName: "MTN كاش",
  requiresManualVerification: true,
  enabled: false,

  async initiate(_input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    return {
      kind: "manual",
      instructions: "الدفع عبر MTN كاش — بانتظار تفعيل التكامل.",
      status: "unpaid",
    };
  },

  async verify() {
    return "unpaid" as const;
  },
};

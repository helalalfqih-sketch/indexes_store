import type { PaymentProvider, InitiatePaymentInput, InitiatePaymentResult } from "./types";

export const codAdapter: PaymentProvider = {
  id: "cod",
  displayName: "الدفع عند الاستلام",
  requiresManualVerification: false,
  enabled: true,

  async initiate(_input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    return {
      kind: "manual",
      instructions: "سيتم تحصيل المبلغ نقداً عند استلام الطلب.",
      status: "unpaid",
    };
  },

  async verify() {
    return "unpaid" as const;
  },
};

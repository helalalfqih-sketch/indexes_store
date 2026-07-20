import type { PaymentProvider, InitiatePaymentInput, InitiatePaymentResult } from "./types";

/** TODO: integrate Kuraimi wallet API when merchant credentials are provisioned. */
export const kuraimiAdapter: PaymentProvider = {
  id: "kuraimi",
  displayName: "الكريمي جوال",
  requiresManualVerification: true,
  enabled: false, // flip to true once KURAIMI_MERCHANT_* secrets are set

  async initiate(_input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    return {
      kind: "manual",
      instructions: "الدفع عبر الكريمي جوال — بانتظار تفعيل التكامل.",
      status: "unpaid",
    };
  },

  async verify() {
    return "unpaid" as const;
  },
};

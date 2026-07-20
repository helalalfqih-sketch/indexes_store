import type { PaymentProvider, InitiatePaymentInput, InitiatePaymentResult } from "./types";

export const bankTransferAdapter: PaymentProvider = {
  id: "bank_transfer",
  displayName: "حوالة بنكية",
  requiresManualVerification: true,
  enabled: true,

  async initiate(_input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    // TODO: return dynamic bank account details from system settings
    return {
      kind: "manual",
      instructions:
        "يرجى تحويل المبلغ إلى الحساب البنكي المخصص وإرسال إثبات التحويل عبر واتساب.",
      status: "unpaid",
    };
  },

  async verify() {
    return "unpaid" as const;
  },
};

import type { PaymentProvider, InitiatePaymentInput, InitiatePaymentResult } from "./types";

/** الحوالات المالية الداخلية — يتم التأكيد يدوياً عبر لوحة الإدارة. */
export const hawalaAdapter: PaymentProvider = {
  id: "hawala",
  displayName: "حوالة مالية",
  requiresManualVerification: true,
  enabled: true,

  async initiate(_input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    return {
      kind: "manual",
      instructions: "يرجى إرسال المبلغ عبر إحدى شبكات الحوالات وإرفاق رقم الحوالة عبر واتساب.",
      status: "unpaid",
    };
  },

  async verify() {
    return "unpaid" as const;
  },
};

import type { OrderDTO, PaymentStatus } from "@/lib/domain/order";

export type PaymentMethodId =
  | "cod"
  | "bank_transfer"
  | "kuraimi"
  | "mtn_cash"
  | "sabafon_cash"
  | "hawala";

export type InitiatePaymentInput = {
  order: OrderDTO;
  returnUrl?: string;
};

export type InitiatePaymentResult =
  | { kind: "manual"; instructions: string; status: PaymentStatus }
  | { kind: "redirect"; url: string }
  | { kind: "confirmed"; providerRef: string }
  | { kind: "error"; error: string };

export interface PaymentProvider {
  readonly id: PaymentMethodId;
  readonly displayName: string;
  readonly requiresManualVerification: boolean;
  readonly enabled: boolean;

  initiate(input: InitiatePaymentInput): Promise<InitiatePaymentResult>;
  verify(providerRef: string): Promise<PaymentStatus>;
}

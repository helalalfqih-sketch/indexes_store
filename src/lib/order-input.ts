import { z } from "zod";
import { checkoutProductRefSchema } from "@/lib/checkout-product-contract";
import { yemeniPhoneSchema } from "@/lib/validation/phone";
import type { CheckoutQuote } from "@/lib/checkout-quote";

/** Shared server-validated checkout payload for legacy and Shopify paths. */
export const createOrderInput = z.object({
  items: z
    .array(
      z.object({
        productRef: checkoutProductRefSchema,
        quantity: z.number().int().min(1).max(999),
      }),
    )
    .min(1)
    .max(100),
  customerName: z.string().trim().min(2, "الاسم مطلوب (حرفان على الأقل)").max(200),
  customerPhone: yemeniPhoneSchema,
  customerAddress: z.string().trim().min(3, "العنوان مطلوب").max(500),
  customerEmail: z.preprocess(
    (v) => (v === "" || v == null ? undefined : v),
    z.string().trim().email().max(200).optional(),
  ),
  notes: z.string().trim().max(1000).optional(),
  couponCode: z.string().trim().max(60).optional(),
  // discountAmount is NEVER accepted from the client — computed server-side.
  expectedTotal: z.number().nonnegative().optional(),
  paymentProvider: z.string().trim().max(60).optional(),
  /** Client-generated UUID to prevent duplicate order creation. */
  idempotencyKey: z.string().uuid(),
});
export type CreateOrderPayload = z.infer<typeof createOrderInput>;

export interface CreateOrderResult {
  orderId: string;
  total: number;
  currency: string;
  itemsCount: number;
  quote: CheckoutQuote;
}


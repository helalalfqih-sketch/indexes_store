import { z } from "zod";

export const checkoutQuoteSchema = z.object({
  subtotal: z.number().nonnegative(),
  discount: z.number().nonnegative(),
  shipping: z.number().nonnegative(),
  total: z.number().nonnegative(),
  currency: z.literal("YER"),
  couponCode: z.string(),
  freeShippingThreshold: z.number().nonnegative(),
  items: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      quantity: z.number().int().positive(),
      unitPrice: z.number().positive(),
      stock: z.number().int().nonnegative(),
    }),
  ),
});
export type CheckoutQuote = z.infer<typeof checkoutQuoteSchema>;

/** Display/request identity only; never an authority for prices or availability. */
export function checkoutQuoteKey(
  items: Array<{ productRef: { source: string; id: string }; quantity: number }>,
  couponCode: string,
) {
  return JSON.stringify([items, couponCode.trim().toUpperCase()]);
}

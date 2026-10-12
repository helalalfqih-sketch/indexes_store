import { z } from "zod";
import type { CreateOrderInput } from "@/lib/actions/order.actions";
import { checkoutQuoteSchema } from "@/lib/checkout-quote";

/** Opt-in only in an isolated Vercel Preview. Default storefront behavior is unchanged. */
export const SHOPIFY_DRAFT_PREVIEW_ENABLED =
  import.meta.env.VITE_SHOPIFY_DRAFT_ORDER_PREVIEW_ENABLED === "true";

const committedDraftSchema = z
  .object({
    orderId: z.string().uuid(),
    orderNumber: z.string().regex(/^ORD-[0-9A-F]{8}$/),
    total: z.number().finite().nonnegative(),
    currency: z.literal("YER"),
    itemsCount: z.number().int().positive(),
    quote: checkoutQuoteSchema,
    draftOrderId: z.string().regex(/^gid:\/\/shopify\/DraftOrder\/\d+$/),
    draftOrderName: z.string().min(1),
    whatsappReady: z.literal(true),
  })
  .refine((value) => Math.abs(value.total - value.quote.total) <= 0.01, {
    message: "SHOPIFY_DRAFT_TOTAL_UNVERIFIED",
  })
  .refine(
    (value) =>
      value.orderNumber === `ORD-${value.orderId.replace(/-/g, "").slice(0, 8).toUpperCase()}`,
    { message: "SHOPIFY_DRAFT_ORDER_NUMBER_UNVERIFIED" },
  );

export type ConfirmedShopifyDraft = z.infer<typeof committedDraftSchema>;

/** Never open WhatsApp without both committed Supabase and verified Shopify IDs. */
export async function submitShopifyPreviewDraft(
  order: CreateOrderInput,
  turnstileToken: string,
): Promise<ConfirmedShopifyDraft> {
  if (!SHOPIFY_DRAFT_PREVIEW_ENABLED || turnstileToken.length < 20) {
    throw new Error("SHOPIFY_DRAFT_PREVIEW_NOT_READY");
  }
  // Only public checkout fields and the one-use challenge response leave the
  // browser; neither an Admin token nor a Supabase service-role token is sent.
  const response = await fetch("/api/shopify-orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    cache: "no-store",
    body: JSON.stringify({ ...order, turnstileToken }),
  });
  if (!response.ok) throw new Error("SHOPIFY_DRAFT_HANDOFF_NOT_CONFIRMED");
  const result: unknown = await response.json();
  const verified = committedDraftSchema.safeParse(result);
  if (!verified.success || verified.data.itemsCount !== order.items.length) {
    throw new Error("SHOPIFY_DRAFT_HANDOFF_NOT_CONFIRMED");
  }
  return verified.data;
}

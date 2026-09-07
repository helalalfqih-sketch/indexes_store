import { z } from "zod";

const uuidSchema = z.string().uuid();
const shopifyGidSchema = z.string().regex(/^gid:\/\/shopify\/(?:Product|ProductVariant)\/[^/]+$/);

export const checkoutProductRefSchema = z.discriminatedUnion("source", [
  z.object({ source: z.literal("supabase"), id: uuidSchema }),
  z.object({ source: z.literal("fallback"), id: z.string().trim().min(1).max(255) }),
  z.object({ source: z.literal("shopify"), id: shopifyGidSchema }),
]);

export type CheckoutProductRef = z.infer<typeof checkoutProductRefSchema>;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SHOPIFY_GID_PATTERN = /^gid:\/\/shopify\/(?:Product|ProductVariant)\/[^/]+$/;

export function checkoutProductRefFromCatalogProduct(product: {
  id: string;
  shopify_variant_id?: string | null;
  shopifyVariantId?: string | null;
}): CheckoutProductRef {
  const variantId = product.shopify_variant_id ?? product.shopifyVariantId;
  if (variantId && SHOPIFY_GID_PATTERN.test(variantId)) {
    return { source: "shopify", id: variantId };
  }
  if (SHOPIFY_GID_PATTERN.test(product.id)) {
    return { source: "shopify", id: product.id };
  }
  if (UUID_PATTERN.test(product.id)) {
    return { source: "supabase", id: product.id };
  }
  return { source: "fallback", id: product.id };
}

export function requireSupabaseCheckoutProductIds(refs: CheckoutProductRef[]): string[] {
  return refs.map((ref) => {
    if (ref.source !== "supabase") {
      throw new Error(
        ref.source === "shopify"
          ? "Shopify products must use the Shopify checkout flow."
          : "Fallback catalog products cannot be ordered until they are published.",
      );
    }
    return ref.id;
  });
}

export type CheckoutCatalogRow = {
  id: string;
  tenant_id: string;
  is_published: boolean;
};

export function validateTenantCheckoutProducts(
  tenantId: string,
  refs: CheckoutProductRef[],
  rows: CheckoutCatalogRow[],
): void {
  const productIds = requireSupabaseCheckoutProductIds(refs);
  const available = new Set(
    rows.filter((row) => row.tenant_id === tenantId && row.is_published).map((row) => row.id),
  );
  if (productIds.some((id) => !available.has(id))) {
    throw new Error("Some products are unavailable or no longer published.");
  }
}

const committedOrderSchema = z.object({
  orderId: z.string().uuid(),
  total: z.number().nonnegative(),
  currency: z.string().min(1).max(12),
  itemsCount: z.number().int().positive(),
});

export type CommittedCheckoutOrder = z.infer<typeof committedOrderSchema>;

export function assertCheckoutCommit(
  data: unknown,
  error: { message?: string } | null,
  expectedItemsCount: number,
): CommittedCheckoutOrder {
  if (error) throw new Error("Checkout transaction failed.");
  const parsed = committedOrderSchema.safeParse(data);
  if (!parsed.success || parsed.data.itemsCount !== expectedItemsCount) {
    throw new Error("Checkout transaction did not commit every line item.");
  }
  return parsed.data;
}

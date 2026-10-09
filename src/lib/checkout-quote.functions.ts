import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { checkoutProductRefSchema } from "./checkout-product-contract";
import { checkoutQuoteSchema } from "./checkout-quote";

const input = z.object({
  items: z
    .array(
      z.object({
        productRef: checkoutProductRefSchema,
        quantity: z.number().int().min(1).max(999),
      }),
    )
    .min(1)
    .max(100),
  couponCode: z.string().trim().max(60).default(""),
});

/** Read-only quote. No order, mirroring, inventory or messaging side effects. */
export const getCheckoutQuote = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => input.parse(raw))
  .handler(async ({ data }) => {
    const { getSupabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { resolveCurrentTenant } = await import("./saas/tenant-resolver");
    const admin = getSupabaseAdmin();
    const tenantId = await resolveCurrentTenant(admin, {});
    const { data: tenant } = await admin
      .from("tenants")
      .select("status")
      .eq("id", tenantId)
      .maybeSingle();
    if (tenant?.status !== "active") throw new Error("المتجر غير متاح الآن.");
    const refs = data.items.map((item) => item.productRef);
    if (
      refs.some((ref) => ref.source === "fallback") ||
      new Set(refs.map((ref) => `${ref.source}:${ref.id}`)).size !== refs.length
    ) {
      throw new Error("يرجى تحديث منتجات السلة.");
    }
    const localIds = refs.filter((ref) => ref.source === "supabase").map((ref) => ref.id);
    const { data: rows, error } = localIds.length
      ? await admin
          .from("products")
          .select("id,name,price,stock,reserved_stock,currency")
          .eq("tenant_id", tenantId)
          .eq("is_published", true)
          .in("id", localIds)
      : { data: [], error: null };
    if (error) throw new Error("تعذر التحقق من المنتجات.");
    const shopifyIds = refs.filter((ref) => ref.source === "shopify").map((ref) => ref.id);
    const { readYemenCheckoutVariants } = await import("./shopify/yemen-checkout.server");
    const variants = await readYemenCheckoutVariants(shopifyIds);
    const items = data.items.map(({ productRef: ref, quantity }) => {
      const product =
        ref.source === "supabase"
          ? rows?.find((row) => row.id === ref.id)
          : variants.find((row) => row.externalId === ref.id);
      if (
        !product ||
        product.currency !== "YER" ||
        !Number.isFinite(product.price) ||
        product.price <= 0 ||
        product.stock == null ||
        quantity > product.stock - ("reserved_stock" in product ? (product.reserved_stock ?? 0) : 0)
      ) {
        throw new Error("تغير توفر أحد المنتجات أو سعره. يرجى تحديث السلة.");
      }
      return {
        id: ref.id,
        name: product.name,
        quantity,
        unitPrice: product.price,
        stock: product.stock - ("reserved_stock" in product ? (product.reserved_stock ?? 0) : 0),
      };
    });
    const { data: config, error: configError } = await admin
      .from("storefront_settings")
      .select("value")
      .eq("tenant_id", tenantId)
      .eq("key", "cart_config")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (configError) throw new Error("تعذر التحقق من الشحن.");
    // This service-role-only function is also called inside the atomic order transaction.
    const rpc = admin.rpc.bind(admin) as unknown as (
      name: string,
      args: Record<string, unknown>,
    ) => Promise<{ data: Record<string, unknown> | null; error: unknown }>;
    const { data: totals, error: totalsError } = await rpc("checkout_totals_v1", {
      _subtotal: items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
      _coupon_code: data.couponCode,
      _cart_config: config?.value ?? {},
    });
    if (totalsError) throw new Error("تعذر اعتماد السعر أو الكوبون. حاول مرة أخرى.");
    return checkoutQuoteSchema.parse({ ...totals, items });
  });

import type { SupabaseAdminClient } from "@/integrations/supabase/client.server";

const YEMEN_CURRENCY = "YER";
const SHOPIFY_VARIANT_PREFIX = "gid://shopify/ProductVariant/";

type ShopifyCheckoutVariant = {
  id: string;
  sku?: string | null;
  barcode?: string | null;
  availableForSale: boolean;
  quantityAvailable?: number | null;
  price: { amount: string; currencyCode: string };
  compareAtPrice?: { amount: string; currencyCode: string } | null;
  image?: { url: string; altText?: string | null } | null;
  product: {
    id: string;
    handle: string;
    title: string;
    description: string;
    vendor: string;
    tags: string[];
    featuredImage?: { url: string; altText?: string | null } | null;
  };
};

type CheckoutVariantNode = ShopifyCheckoutVariant | null;

export type YemenCheckoutVariant = {
  externalId: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  currency: "YER";
  brand: string | null;
  images: string[];
  stock: number;
  sku: string | null;
  barcode: string | null;
  tags: string[];
};

export function validateYemenCheckoutVariant(
  node: CheckoutVariantNode,
  expectedId: string,
): YemenCheckoutVariant {
  if (!node || node.id !== expectedId || !node.id.startsWith(SHOPIFY_VARIANT_PREFIX)) {
    throw new Error("أحد المنتجات لم يعد متاحًا.");
  }
  if (!node.availableForSale) throw new Error("أحد المنتجات نفد من المخزون.");
  if (node.price.currencyCode !== YEMEN_CURRENCY) {
    throw new Error("هذا المنتج غير مسعّر بالريال اليمني.");
  }
  const price = Number(node.price.amount);
  if (!Number.isFinite(price) || price <= 0) throw new Error("سعر المنتج غير صالح.");

  const compareAt = Number(node.compareAtPrice?.amount);
  const images = [node.image?.url, node.product.featuredImage?.url].filter(
    (value, index, all): value is string => Boolean(value) && all.indexOf(value) === index,
  );
  const availableQuantity = node.quantityAvailable;

  return {
    externalId: node.id,
    slug: `${node.product.handle}-${node.id.slice(SHOPIFY_VARIANT_PREFIX.length)}`,
    name: node.product.title,
    description: node.product.description || node.product.title,
    price,
    compareAtPrice: Number.isFinite(compareAt) && compareAt > price ? compareAt : null,
    currency: YEMEN_CURRENCY,
    brand: node.product.vendor || null,
    images,
    stock:
      typeof availableQuantity === "number" && availableQuantity >= 0 ? availableQuantity : 999,
    sku: node.sku ?? null,
    barcode: node.barcode ?? null,
    tags: node.product.tags,
  };
}

/**
 * Resolve Shopify variant references against Shopify on the server, then mirror
 * their authoritative price and availability into the tenant catalog. The
 * atomic Supabase checkout continues to accept only tenant-scoped UUIDs.
 */
export async function resolveShopifyVariantsForYemenCheckout(
  admin: SupabaseAdminClient,
  tenantId: string,
  variantIds: string[],
): Promise<Map<string, string>> {
  const uniqueIds = [...new Set(variantIds)];
  if (uniqueIds.length === 0) return new Map();

  const { storefront } = await import("@/lib/shopify/catalog.functions");
  const result = await storefront<{ nodes: CheckoutVariantNode[] }>(
    `query CheckoutVariants($ids: [ID!]!) {
      nodes(ids: $ids) {
        ... on ProductVariant {
          id sku barcode availableForSale
          price { amount currencyCode }
          compareAtPrice { amount currencyCode }
          image { url altText }
          product {
            id handle title description vendor tags
            featuredImage { url altText }
          }
        }
      }
    }`,
    { ids: uniqueIds },
  );

  if (result.nodes.length !== uniqueIds.length) {
    throw new Error("تعذر التحقق من جميع منتجات السلة.");
  }

  const resolved = new Map<string, string>();
  for (let index = 0; index < uniqueIds.length; index += 1) {
    const variant = validateYemenCheckoutVariant(result.nodes[index], uniqueIds[index]);
    const productPayload = {
      tenant_id: tenantId,
      external_id: variant.externalId,
      slug: variant.slug,
      name: variant.name,
      description: variant.description,
      price: variant.price,
      old_price: variant.compareAtPrice,
      currency: variant.currency,
      brand: variant.brand,
      images: variant.images,
      stock: variant.stock,
      reserved_stock: 0,
      sku: variant.sku,
      barcode: variant.barcode,
      tags: variant.tags,
      availability: "in stock",
      source_url: null,
      is_published: true,
    };

    const { data: existing, error: lookupError } = await admin
      .from("products")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("external_id", variant.externalId)
      .maybeSingle();
    if (lookupError) throw new Error("تعذر التحقق من المنتج المحلي.");

    let data: { id: string } | null = null;
    let error: { code?: string; message?: string } | null = null;
    if (existing) {
      const updated = await admin
        .from("products")
        .update(productPayload)
        .eq("id", existing.id)
        .eq("tenant_id", tenantId)
        .select("id")
        .single();
      data = updated.data;
      error = updated.error;
    } else {
      const inserted = await admin.from("products").insert(productPayload).select("id").single();
      data = inserted.data;
      error = inserted.error;

      // A simultaneous checkout may have inserted the same variant first.
      if (error?.code === "23505") {
        const retry = await admin
          .from("products")
          .update(productPayload)
          .eq("tenant_id", tenantId)
          .eq("external_id", variant.externalId)
          .select("id")
          .single();
        data = retry.data;
        error = retry.error;
      }
    }
    if (error || !data) {
      console.error("[checkout] Shopify product mirror failed:", error);
      throw new Error("تعذر تجهيز المنتج للطلب داخل اليمن.");
    }
    resolved.set(variant.externalId, data.id);
  }

  return resolved;
}

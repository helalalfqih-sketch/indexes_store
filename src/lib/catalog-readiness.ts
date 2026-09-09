import type { ProductDTO } from "@/lib/domain/product";

const SHOPIFY_VARIANT_GID = /^gid:\/\/shopify\/ProductVariant\/[^/]+$/;

export function isCatalogProductReady(product: ProductDTO): boolean {
  const hasImage = product.images.some(
    (image) => typeof image === "string" && /^https?:\/\//i.test(image.trim()),
  );
  const hasIdentity = Boolean(product.id.trim() && product.slug.trim() && product.name.trim());
  const hasPrice = Number.isFinite(product.price) && product.price > 0;
  const hasCheckoutIdentity =
    !product.shopify_product_id ||
    Boolean(product.shopify_variant_id && SHOPIFY_VARIANT_GID.test(product.shopify_variant_id));

  return (
    product.is_published !== false && hasIdentity && hasPrice && hasImage && hasCheckoutIdentity
  );
}

export function shouldUseDemoCatalog(isDevelopment: boolean): boolean {
  return isDevelopment;
}

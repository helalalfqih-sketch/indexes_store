import type { Product } from "./types";
export function uniqueProducts(products: Product[]): Product[] {
  return [...new Map(products.map((product) => [product.id, product])).values()];
}
export function isCurrentOffer(product: Product, now = Date.now()): boolean {
  return (
    product.priceYER > 0 &&
    product.originalPriceYER > product.priceYER &&
    (!product.dealStart || new Date(product.dealStart).getTime() <= now) &&
    (!product.dealEnd || new Date(product.dealEnd).getTime() > now)
  );
}

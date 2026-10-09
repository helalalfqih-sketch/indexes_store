import type { QueryClient } from "@tanstack/react-query";

/**
 * Production Real-Time Admin ↔ Storefront Cache Invalidation Strategy
 *
 * Ensures that whenever an admin makes a mutation in Supabase (products, categories,
 * inventory, pricing, shipping, payments, CMS, or orders), all affected React Query
 * keys across both the Admin Dashboard and Customer Storefront are immediately invalidated.
 */

export function invalidateCatalogCache(qc: QueryClient) {
  qc.invalidateQueries({ queryKey: ["catalog"] });
  qc.invalidateQueries({ queryKey: ["admin-products"] });
  qc.invalidateQueries({ queryKey: ["allProducts"] });
  qc.invalidateQueries({ queryKey: ["products"] });
  qc.invalidateQueries({ queryKey: ["bestSellers"] });
  qc.invalidateQueries({ queryKey: ["offers"] });
  qc.invalidateQueries({ queryKey: ["globePool"] });
  qc.invalidateQueries({ queryKey: ["product"] });
  qc.invalidateQueries({ queryKey: ["productsByCategory"] });
}

export function invalidateCategoryCache(qc: QueryClient) {
  qc.invalidateQueries({ queryKey: ["admin-categories"] });
  qc.invalidateQueries({ queryKey: ["categories"] });
  qc.invalidateQueries({ queryKey: ["category"] });
  qc.invalidateQueries({ queryKey: ["productsByCategory"] });
  invalidateCatalogCache(qc);
}

export function invalidateInventoryCache(qc: QueryClient) {
  qc.invalidateQueries({ queryKey: ["admin-inventory"] });
  invalidateCatalogCache(qc);
}

export function invalidateCmsCache(qc: QueryClient) {
  qc.invalidateQueries({ queryKey: ["storefront-settings"] });
  qc.invalidateQueries({ queryKey: ["banners"] });
  qc.invalidateQueries({ queryKey: ["shipping-config"] });
  qc.invalidateQueries({ queryKey: ["payment-methods"] });
  invalidateCatalogCache(qc);
}

export function invalidateOrdersCache(qc: QueryClient) {
  qc.invalidateQueries({ queryKey: ["admin-orders"] });
  qc.invalidateQueries({ queryKey: ["my-orders"] });
  qc.invalidateQueries({ queryKey: ["order"] });
}

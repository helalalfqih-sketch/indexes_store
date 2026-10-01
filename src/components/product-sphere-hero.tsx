import React from "react";
import { ProductCard } from "@/components/product-card";
import { productCardQA } from "@/lib/qa/product-card-contract";
import type { Product } from "@/lib/store-data";
import type { LegacyProductShape } from "@/lib/data-adapter";

export function ProductSphereHero({
  products,
}: {
  products?: Array<Product | LegacyProductShape>;
}) {
  return (
    <div
      data-testid="hero-sphere-fallback"
      className="w-full grid grid-cols-2 sm:grid-cols-3 gap-4 p-4"
    >
      {products &&
        products.map((p) => (
          <ProductCard key={p.id} product={p} qa={productCardQA(p, "hero_products")} />
        ))}
    </div>
  );
}

export function ProductGlobeCanvas(_props: {
  products?: Array<Product | LegacyProductShape>;
  paused?: boolean;
  exclusion?: unknown;
}) {
  return null;
}

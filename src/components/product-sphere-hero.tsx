import React from 'react';
import { ProductCard } from '@/components/product-card';

export function ProductSphereHero({ products }: { products?: any[] }) {
  return (
    <div data-testid="hero-sphere-fallback" className="w-full grid grid-cols-2 sm:grid-cols-3 gap-4 p-4">
      {products && products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}

export function ProductGlobeCanvas(props: any) {
  return null;
}
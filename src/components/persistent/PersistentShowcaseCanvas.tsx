import { useRouterState } from "@tanstack/react-router";
import { lazy, Suspense, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { allProductsQueryOptions } from "@/lib/store.queries";
import type { LegacyProductShape } from "@/lib/data-adapter";
import { useAppearance } from "@/components/appearance-provider";

const ProductSphereHero = lazy(() =>
  import("@/components/product-sphere-hero").then((m) => ({ default: m.ProductSphereHero })),
);

export function PersistentShowcaseCanvas() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const cleanPath = pathname.replace(/^\/app/, "") || "/";
  const isHome = cleanPath === "/";

  const { data: allProductsRaw } = useQuery(allProductsQueryOptions());
  const { settings } = useAppearance();

  const products = (allProductsRaw as LegacyProductShape[] | undefined) ?? [];

  // Only run 3D canvas if hero is enabled and there are products
  const shouldRender3D = settings?.hero?.enabled !== false && settings?.hero?.type !== "cinematic";

  if (!shouldRender3D) return null;

  return (
    <div
      data-persistent-canvas="true"
      className={`transition-opacity duration-500 ${
        isHome
          ? "relative z-10 opacity-100 pointer-events-auto"
          : "absolute inset-0 z-[-999] opacity-0 pointer-events-none h-0 overflow-hidden"
      }`}
    >
      <Suspense fallback={null}>
        <ProductSphereHero
          products={products}
          badgeText={settings.hero.badgeText}
          title={settings.hero.title}
          subtitle={settings.hero.subtitle}
          maxProducts={settings.hero.sphereMaxProducts}
          radius={settings.hero.sphereRadius}
          tileScale={settings.hero.sphereTileScale}
          cardShape={settings.hero.sphereCardShape}
          showName={settings.hero.sphereShowName}
          showPrice={settings.hero.sphereShowPrice}
          showParticles={settings.hero.showParticles}
        />
      </Suspense>
    </div>
  );
}

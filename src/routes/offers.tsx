import { createFileRoute } from "@tanstack/react-router";
import { Flame } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { fetchOffers } from "@/lib/actions/product.actions";
import type { LegacyProductShape } from "@/lib/data-adapter";
import type { Product } from "@/lib/store-data";

export const Route = createFileRoute("/offers")({
  head: () => ({ meta: [{ title: "العروض — اندكس ستور" }] }),
  loader: async (): Promise<LegacyProductShape[]> => fetchOffers(),
  errorComponent: ({ error }) => (
    <div className="p-8 text-center text-destructive">حدث خطأ: {error.message}</div>
  ),
  component: OffersPage,
});

import { useAppearance } from "@/components/appearance-provider";

function OffersPage() {
  const deals = Route.useLoaderData();
  const { settings } = useAppearance();
  const lay = settings.products_layout;

  const m = lay.columnsMobile === 1 ? "grid-cols-1" : "grid-cols-2";
  const t =
    lay.columnsTablet === 1
      ? "sm:grid-cols-1"
      : lay.columnsTablet === 2
      ? "sm:grid-cols-2"
      : lay.columnsTablet === 4
      ? "sm:grid-cols-4"
      : "sm:grid-cols-3";
  const d =
    lay.columnsDesktop === 2
      ? "md:grid-cols-2"
      : lay.columnsDesktop === 3
      ? "md:grid-cols-3"
      : lay.columnsDesktop === 5
      ? "md:grid-cols-5"
      : lay.columnsDesktop === 6
      ? "md:grid-cols-6"
      : "md:grid-cols-4";
  const gridClass = `grid ${m} ${t} ${d} gap-4`;

  return (
    <div className="flex flex-col gap-4 px-4 pt-4">
      <section className="flex items-center gap-3 rounded-3xl bg-primary p-4 text-primary-foreground shadow-brand">
        <Flame className="h-8 w-8" />
        <div>
          <h1 className="text-lg font-black">عروض حصرية</h1>
          <p className="text-xs text-primary-foreground/85">خصومات تصل إلى 40% لفترة محدودة</p>
        </div>
      </section>
      {deals.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          لا توجد عروض متاحة حالياً.
        </p>
      ) : (
        <div className={gridClass}>
          {deals.map((p: LegacyProductShape) => (
            <ProductCard key={p.id} product={p as unknown as Product} />
          ))}
        </div>
      )}
    </div>
  );
}

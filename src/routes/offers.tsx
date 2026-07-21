import { createFileRoute } from "@tanstack/react-router";
import { Flame, Loader2 } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { offersQueryOptions } from "@/lib/store.queries";
import { useSuspenseQuery } from "@tanstack/react-query";
import type { Product } from "@/lib/store-data";
import { ProductCardSkeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/offers")({
  head: () => ({ meta: [{ title: "العروض — اندكس ستور" }] }),
  loader: ({ context: { queryClient } }) => {
    queryClient.ensureQueryData(offersQueryOptions());
  },
  pendingComponent: () => {
    // Cannot use useAppearance inside Route options directly, so we just render a simple grid
    return (
      <div className="flex flex-col gap-4 px-4 pt-4 min-h-screen">
        <section className="flex items-center gap-3 rounded-3xl bg-primary/40 p-4 shadow-brand backdrop-blur-md">
          <div className="h-8 w-8 rounded-full bg-primary/30 animate-pulse" />
          <div className="space-y-2">
            <div className="h-5 w-32 rounded-md bg-primary/30 animate-pulse" />
            <div className="h-3 w-48 rounded-md bg-primary/30 animate-pulse" />
          </div>
        </section>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProductCardSkeleton key={`skeleton-${i}`} />
          ))}
        </div>
      </div>
    );
  },
  errorComponent: ({ error }) => (
    <div className="p-8 text-center text-destructive">حدث خطأ: {error.message}</div>
  ),
  component: OffersPage,
});

import { useAppearance } from "@/components/appearance-provider";

function OffersPage() {
  const { data: dealsRaw } = useSuspenseQuery(offersQueryOptions());
  const deals = dealsRaw as any[];
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
          {deals.map((p: any) => (
            <ProductCard key={p.id} product={p as unknown as Product} />
          ))}
        </div>
      )}
    </div>
  );
}

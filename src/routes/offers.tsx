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

function OffersPage() {
  const deals = Route.useLoaderData();
  return (
    <div className="flex flex-col gap-4 px-4 pt-4">
      <section className="flex items-center gap-3 rounded-3xl gradient-brand p-4 text-white shadow-brand">
        <Flame className="h-8 w-8" />
        <div>
          <h1 className="text-lg font-black">عروض حصرية</h1>
          <p className="text-xs text-white/85">خصومات تصل إلى 40% لفترة محدودة</p>
        </div>
      </section>
      {deals.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">لا توجد عروض متاحة حالياً.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {deals.map((p: LegacyProductShape) => (
            <ProductCard key={p.id} product={p as unknown as Product} />
          ))}
        </div>
      )}
    </div>
  );
}

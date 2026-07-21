import { createFileRoute, useSearch } from "@tanstack/react-router";
import { Search as SearchIcon, Loader2, PackageX } from "lucide-react";
import { useEffect, useState } from "react";
import { ProductCard } from "@/components/product-card";
import { ProductCardSkeleton } from "@/components/ui/skeleton";
import { searchProducts } from "@/lib/actions/product.actions";
import type { LegacyProductShape } from "@/lib/data-adapter";
import type { Product } from "@/lib/store-data";
import { z } from "zod";

const searchParamsSchema = z.object({
  q: z.string().optional(),
});

export const Route = createFileRoute("/search")({
  head: () => ({ meta: [{ title: "البحث في المنتجات — اندكس ستور" }] }),
  validateSearch: (search) => searchParamsSchema.parse(search),
  loader: ({ location }) => {
    const q = new URLSearchParams(location.search).get("q") || "";
    return searchProducts(q);
  },
  component: SearchPage,
});

function SearchPage() {
  const initial = Route.useLoaderData();
  const searchParams = useSearch({ from: "/search" });
  const [q, setQ] = useState(searchParams.q || "");
  const [results, setResults] = useState<LegacyProductShape[]>(initial);
  const [loading, setLoading] = useState(false);

  // Keep state in sync with URL search query param if updated externally
  useEffect(() => {
    if (searchParams.q !== undefined && searchParams.q !== q) {
      setQ(searchParams.q);
    }
  }, [searchParams.q]);

  // Debounced server-side search.
  useEffect(() => {
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await searchProducts(q);
        setResults(data);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div className="flex flex-col gap-5 px-4 pt-4 pb-12 max-w-7xl mx-auto" dir="rtl">
      {/* Search Bar Input */}
      <div className="flex items-center gap-3 rounded-2xl border border-showcase-border/50 bg-showcase-foreground/5 backdrop-blur-md px-4 py-3 shadow-card focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition">
        <SearchIcon className="h-5 w-5 text-primary shrink-0" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ابحث باسم المنتج، الكود (SKU)، أو التصنيف..."
          className="flex-1 bg-transparent text-sm font-bold outline-none placeholder:text-showcase-muted text-showcase-foreground"
        />
        {loading && <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />}
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs font-bold text-showcase-muted px-1">
        <span>{q ? `نتائج البحث عن "${q}"` : "جميع الكتالوجات"}</span>
        <span>{loading ? "جاري البحث..." : `${results.length} منتج`}</span>
      </div>

      {/* Results Grid / Empty State */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProductCardSkeleton key={`skeleton-${i}`} />
          ))}
        </div>
      ) : results.length === 0 ? (
        <div className="rounded-3xl border border-showcase-border/50 bg-showcase-foreground/5 backdrop-blur-md p-12 text-center space-y-3">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-showcase-foreground/10 text-showcase-muted">
            <PackageX className="h-7 w-7" />
          </div>
          <p className="text-base font-black text-showcase-foreground">لم يتم العثور على منتجات مطابقة</p>
          <p className="text-xs text-showcase-muted">جرب البحث بكلمات أخرى، أو تصفح الأقسام والتصنيفات في الواجهة الرئيسية.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {results.map((p) => (
            <ProductCard key={p.id} product={p as unknown as Product} />
          ))}
        </div>
      )}
    </div>
  );
}

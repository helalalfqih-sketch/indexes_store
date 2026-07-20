import { createFileRoute } from "@tanstack/react-router";
import { Search as SearchIcon, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { ProductCard } from "@/components/product-card";
import { searchProducts } from "@/lib/actions/product.actions";
import type { LegacyProductShape } from "@/lib/data-adapter";
import type { Product } from "@/lib/store-data";

export const Route = createFileRoute("/search")({
  head: () => ({ meta: [{ title: "بحث — اندكس ستور" }] }),
  loader: () => searchProducts(""),
  component: SearchPage,
});

function SearchPage() {
  const initial = Route.useLoaderData();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<LegacyProductShape[]>(initial);
  const [loading, setLoading] = useState(false);

  // Debounced server-side search.
  useEffect(() => {
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        setResults(await searchProducts(q));
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div className="flex flex-col gap-4 px-4 pt-4">
      <div className="flex items-center gap-2 rounded-2xl bg-surface px-3 py-2.5 shadow-card">
        <SearchIcon className="h-4 w-4 text-muted-foreground" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ابحث عن منتج، ماركة أو تصنيف..."
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>
      <p className="text-xs text-muted-foreground">{results.length} نتيجة</p>
      {results.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">لا توجد نتائج مطابقة.</p>
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

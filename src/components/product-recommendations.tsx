import { useEffect, useState } from "react";
import { Sparkles, Heart } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { fetchProductsByCategory, fetchProducts } from "@/lib/actions/product.actions";
import type { LegacyProductShape } from "@/lib/data-adapter";
import type { Product } from "@/lib/store-data";

interface Props {
  currentProductId: string;
  categoryId?: string;
}

export function ProductRecommendations({ currentProductId, categoryId }: Props) {
  const [recommendations, setRecommendations] = useState<LegacyProductShape[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        let list: LegacyProductShape[] = [];
        if (categoryId) {
          list = await fetchProductsByCategory(categoryId);
        }
        if (list.length < 4) {
          const all = await fetchProducts();
          list = [...list, ...all];
        }

        // Exclude current product and deduplicate
        const filtered = list.filter((p) => p.id !== currentProductId);
        const unique = Array.from(new Map(filtered.map((p) => [p.id, p])).values()).slice(0, 4);
        setRecommendations(unique);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [currentProductId, categoryId]);

  if (!loading && recommendations.length === 0) return null;

  return (
    <section className="mt-14 border-t border-showcase-border/60 pt-10" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-black tracking-tight text-showcase-foreground flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-warning" /> قد يعجبك أيضاً
          </h3>
          <p className="text-xs text-showcase-muted mt-0.5">
            منتجات مختارة بناءً على اهتماماتك والتصنيف الحالي
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {recommendations.map((p) => (
          <ProductCard key={p.id} product={p as unknown as Product} />
        ))}
      </div>
    </section>
  );
}

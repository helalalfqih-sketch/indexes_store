import { useEffect, useState } from "react";
import { Sparkles, Heart } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { fetchProductsByCategory, fetchProducts } from "@/lib/actions/product.actions";
import type { LegacyProductShape } from "@/lib/data-adapter";
import type { Product } from "@/lib/store-data";

interface Props {
  currentProductId: string;
  categoryId?: string;
  productName?: string;
}

export function ProductRecommendations({ currentProductId, categoryId, productName }: Props) {
  const [recommendations, setRecommendations] = useState<LegacyProductShape[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        let candidateList: LegacyProductShape[] = [];

        // 1. Fetch category matched products if available
        if (categoryId) {
          const categoryList = await fetchProductsByCategory(categoryId);
          candidateList = [...categoryList];
        }

        // 2. Fetch all products to ensure rich candidates
        const allProducts = await fetchProducts();
        candidateList = [...candidateList, ...allProducts];

        // 3. Deduplicate & exclude current product
        const filtered = candidateList.filter((p) => p.id !== currentProductId);
        const uniqueCandidates = Array.from(new Map(filtered.map((p) => [p.id, p])).values());

        // Extract keywords from current product name for relevance scoring
        const nameTokens = (productName || "")
          .toLowerCase()
          .split(/[\s\-_,.]+/)
          .filter((word) => word.length > 2);

        // 4. Score each candidate product by category match & keyword relevance
        const scoredCandidates = uniqueCandidates.map((prod) => {
          let score = 0;
          const candidateCategory = (prod as any).category_id || (prod as any).categoryId;
          const candidateName = (prod.name || "").toLowerCase();

          // High priority: Category match
          if (categoryId && candidateCategory === categoryId) {
            score += 10;
          }

          // Relevance match: Keyword overlap in product name
          if (nameTokens.length > 0) {
            nameTokens.forEach((token) => {
              if (candidateName.includes(token)) {
                score += 5;
              }
            });
          }

          return { prod, score };
        });

        // 5. Sort candidates descending by relevance score
        scoredCandidates.sort((a, b) => b.score - a.score);

        // Pick top 4 recommendations
        const top4 = scoredCandidates.slice(0, 4).map((item) => item.prod);
        setRecommendations(top4);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [currentProductId, categoryId, productName]);

  if (!loading && recommendations.length === 0) return null;

  return (
    <section className="mt-14 border-t border-showcase-border/60 pt-10 font-sans" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-black tracking-tight text-showcase-foreground flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" /> قد يعجبك أيضاً
          </h3>
          <p className="text-xs text-showcase-muted mt-0.5">
            منتجات مختارة ومقترحة خصيصاً بناءً على التصنيف والمنتج الحالي
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

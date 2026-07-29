import { useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Flame, ShoppingCart, Star, Sparkles, Clock, Tag } from "lucide-react";
import { toast } from "sonner";
import { offersQueryOptions } from "@/lib/store.queries";
import { useSuspenseQuery } from "@tanstack/react-query";
import { categories as categoryList, formatPrice, type Product } from "@/lib/store-data";
import { useCart } from "@/lib/cart-store";
import { OptimizedImage } from "@/components/optimized-image";

export const Route = createFileRoute("/offers")({
  head: () => ({
    meta: [
      { title: "العروض والخصومات — اندكس ستور" },
      {
        name: "description",
        content:
          "تصفح أقوى عروض وخصومات اندكس ستور. خصومات تصل إلى 40% لفترة محدودة على إلكترونيات، أدوات منزلية، والمزيد.",
      },
      { name: "robots", content: "index, follow" },
      { property: "og:title", content: "العروض والخصومات — اندكس ستور" },
      { property: "og:description", content: "خصومات تصل إلى 40% لفترة محدودة" },
      { property: "og:type", content: "website" },
    ],
  }),
  loader: ({ context: { queryClient } }) => {
    queryClient.ensureQueryData(offersQueryOptions());
  },
  pendingComponent: OffersPending,
  errorComponent: ({ error }) => (
    <div className="p-8 text-center text-destructive">حدث خطأ: {error.message}</div>
  ),
  component: OffersPage,
});

/** Skeleton mirroring the glass layout (banner + floating rows). */
function OffersPending() {
  return (
    <div className="flex flex-col gap-4 px-4 pt-4 min-h-screen">
      <section className="flex items-center gap-3 rounded-3xl glass-dark p-4">
        <div className="h-12 w-12 rounded-2xl bg-primary/20 animate-pulse" />
        <div className="space-y-2">
          <div className="h-5 w-32 rounded-md bg-white/10 animate-pulse" />
          <div className="h-3 w-48 rounded-md bg-white/10 animate-pulse" />
        </div>
      </section>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={`offer-skeleton-${i}`} className="flex gap-3 rounded-3xl glass-float p-3">
            <div className="h-28 w-28 shrink-0 rounded-2xl bg-white/10 animate-pulse" />
            <div className="flex flex-1 flex-col justify-between py-1">
              <div className="space-y-2">
                <div className="h-3.5 w-3/4 rounded-md bg-white/10 animate-pulse" />
                <div className="h-3 w-1/3 rounded-md bg-white/10 animate-pulse" />
              </div>
              <div className="flex items-center justify-between">
                <div className="h-4 w-20 rounded-md bg-white/10 animate-pulse" />
                <div className="h-9 w-9 rounded-full bg-primary/25 animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function OfferRow({ product }: { product: Product }) {
  const add = useCart((s) => s.add);
  const discount = product.oldPrice
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0;

  return (
    <Link
      to="/product/$slug"
      params={{ slug: product.slug }}
      className="group relative flex gap-3 rounded-3xl glass-float p-3 transition active:scale-[0.98] hover:border-primary/40 hover:shadow-lg"
      data-product-id={product.id}
    >
      <div className="relative shrink-0">
        <OptimizedImage
          src={product.image}
          alt={product.name}
          size="thumbnail"
          className="h-28 w-28 rounded-2xl bg-white/5 object-cover transition group-hover:scale-105"
        />
        {discount > 0 && (
          <span className="absolute -top-1.5 -start-1.5 rounded-full bg-destructive px-2 py-0.5 text-[10px] font-black text-destructive-foreground shadow-lg flex items-center gap-0.5">
            <Sparkles className="w-2.5 h-2.5 inline" /> -{discount}%
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5 text-showcase-foreground">
        <div className="space-y-1">
          <h3 className="line-clamp-2 text-xs font-bold leading-tight group-hover:text-primary transition">
            {product.name}
          </h3>
          <div className="flex items-center gap-1 text-[10px] text-showcase-foreground/55">
            <Star className="h-3 w-3 fill-warning stroke-warning" />
            <span className="font-semibold text-showcase-foreground">{product.rating}</span>
            <span>({product.reviews})</span>
          </div>
        </div>

        <div className="flex items-end justify-between gap-2">
          <div className="flex flex-col">
            {product.oldPrice && (
              <span className="text-[10px] text-showcase-foreground/50 line-through font-mono">
                {formatPrice(product.oldPrice)}
              </span>
            )}
            <span className="text-sm font-black text-primary font-mono">
              {formatPrice(product.price)}
            </span>
          </div>
          <button
            type="button"
            aria-label={`أضف ${product.name} إلى السلة`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              add(product);
              toast.success("أُضيف إلى السلة", { description: product.name });
            }}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-brand transition hover:scale-105 active:scale-95"
          >
            <ShoppingCart className="h-4 w-4" />
          </button>
        </div>
      </div>
    </Link>
  );
}

function OffersPage() {
  const { data: dealsRaw } = useSuspenseQuery(offersQueryOptions());
  const deals = dealsRaw as unknown as Product[];
  const [activeFilter, setActiveFilter] = useState<string>("all");

  const filteredDeals = useMemo(() => {
    if (activeFilter === "all") return deals;
    if (activeFilter === "big_discount") {
      return deals.filter((p) => {
        if (!p.oldPrice) return false;
        const disc = Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100);
        return disc >= 20;
      });
    }
    return deals.filter((p) => p.categoryId?.toLowerCase() === activeFilter.toLowerCase());
  }, [deals, activeFilter]);

  const categories = useMemo(() => {
    const set = new Set<{ id: string; name: string }>();
    deals.forEach((p) => {
      if (p.categoryId) {
        const cat = categoryList.find((c) => c.id === p.categoryId);
        if (cat) set.add({ id: cat.id, name: cat.name });
      }
    });
    return Array.from(set);
  }, [deals]);

  return (
    <div className="flex flex-col gap-4 px-4 pt-4 pb-8">
      {/* Enterprise Glass Banner with Live Offer Flame */}
      <section
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-[32px] glass-dark p-5 text-showcase-foreground"
        style={{
          boxShadow: "inset 0 1px 0 rgba(184,126,82,0.45), 0 14px 40px -18px rgba(0,0,0,0.7)",
        }}
      >
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-white/10 bg-primary/20 shadow-[0_0_28px_-4px_hsl(var(--primary)/0.65)]">
            <Flame className="h-6 w-6 text-primary animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg font-black flex items-center gap-2">
              عروض حصرية واستثنائية
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-destructive/20 text-destructive border border-destructive/30">
                مباشر 🔴
              </span>
            </h1>
            <p className="text-xs text-showcase-foreground/70">
              خصومات مميزة تصل إلى 40% لفترة محدودة على أفضل المنتجات
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-showcase-foreground/80 bg-white/5 border border-white/10 px-3 py-1.5 rounded-2xl w-fit">
          <Clock className="w-4 h-4 text-primary" />
          <span>ينتهي العرض قريباً</span>
        </div>
      </section>

      {/* Filter Category Pills */}
      {deals.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveFilter("all")}
            className={`px-3.5 py-1.5 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeFilter === "all"
                ? "bg-primary text-primary-foreground shadow-brand"
                : "bg-white/5 border border-white/10 text-showcase-foreground/70 hover:text-showcase-foreground"
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            جميع العروض ({deals.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("big_discount")}
            className={`px-3.5 py-1.5 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeFilter === "big_discount"
                ? "bg-destructive text-destructive-foreground shadow-lg"
                : "bg-white/5 border border-white/10 text-showcase-foreground/70 hover:text-showcase-foreground"
            }`}
          >
            🔥 خصومات 20%+
          </button>

          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveFilter(cat.id)}
              className={`px-3.5 py-1.5 rounded-2xl text-xs font-bold transition ${
                activeFilter === cat.id
                  ? "bg-primary text-primary-foreground shadow-brand"
                  : "bg-white/5 border border-white/10 text-showcase-foreground/70 hover:text-showcase-foreground"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Offers Grid */}
      {filteredDeals.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          لا توجد عروض مطابقة للفلتر المحدد حالياً.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filteredDeals.map((p) => (
            <OfferRow key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}

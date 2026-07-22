import { createFileRoute, Link } from "@tanstack/react-router";
import { Flame, ShoppingCart, Star } from "lucide-react";
import { toast } from "sonner";
import { offersQueryOptions } from "@/lib/store.queries";
import { useSuspenseQuery } from "@tanstack/react-query";
import type { Product } from "@/lib/store-data";
import { formatPrice } from "@/lib/store-data";
import { useCart } from "@/lib/cart-store";
import { OptimizedImage } from "@/components/optimized-image";

export const Route = createFileRoute("/offers")({
  head: () => ({
    meta: [
      { title: "العروض والخصومات — اندكس ستور" },
      { name: "description", content: "تصفح أقوى عروض وخصومات اندكس ستور. خصومات تصل إلى 40% لفترة محدودة على إلكترونيات، أدوات منزلية، والمزيد." },
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
      className="group relative flex gap-3 rounded-3xl glass-float p-3 transition active:scale-[0.98]"
      data-product-id={product.id}
    >
      <div className="relative shrink-0">
        <OptimizedImage
          src={product.image}
          alt={product.name}
          size="thumbnail"
          className="h-28 w-28 rounded-2xl bg-white/5 object-cover"
        />
        {discount > 0 && (
          <span className="absolute -top-1.5 -start-1.5 rounded-full bg-destructive px-2 py-0.5 text-[10px] font-black text-destructive-foreground shadow-lg">
            -{discount}%
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5 text-showcase-foreground">
        <div className="space-y-1">
          <h3 className="line-clamp-2 text-xs font-bold leading-tight">{product.name}</h3>
          <div className="flex items-center gap-1 text-[10px] text-showcase-foreground/55">
            <Star className="h-3 w-3 fill-warning stroke-warning" />
            <span className="font-semibold text-showcase-foreground">{product.rating}</span>
            <span>({product.reviews})</span>
          </div>
        </div>

        <div className="flex items-end justify-between gap-2">
          <div className="flex flex-col">
            {product.oldPrice && (
              <span className="text-[10px] text-showcase-foreground/50 line-through">
                {formatPrice(product.oldPrice)}
              </span>
            )}
            <span className="text-sm font-black text-primary">{formatPrice(product.price)}</span>
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

  return (
    <div className="flex flex-col gap-4 px-4 pt-4">
      {/* Glass banner — flame in a glowing glass tile */}
      <section className="flex items-center gap-3 rounded-3xl glass-dark p-4 text-showcase-foreground">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-white/10 bg-primary/20 shadow-[0_0_28px_-4px_hsl(var(--primary)/0.65)]">
          <Flame className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-black">عروض حصرية</h1>
          <p className="text-xs text-showcase-foreground/70">خصومات تصل إلى 40% لفترة محدودة</p>
        </div>
      </section>

      {deals.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          لا توجد عروض متاحة حالياً.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 pb-4 sm:grid-cols-2 xl:grid-cols-3">
          {deals.map((p) => (
            <OfferRow key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}

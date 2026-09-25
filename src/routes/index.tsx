import { createFileRoute, Link } from "@tanstack/react-router";
import { useInfiniteQuery } from "@tanstack/react-query";
import { HStack } from "@astryxdesign/core/HStack";
import { VStack } from "@astryxdesign/core/VStack";
import { Grid } from "@astryxdesign/core/Grid";
import { ArrowLeft, Package, MessageCircle, Truck } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { useAppearance } from "@/components/appearance-provider";
import { fetchCatalogPage } from "@/lib/actions/catalog-page.actions";
import { formatPrice } from "@/lib/store-data";
import type { LegacyProductShape } from "@/lib/data-adapter";
import { mapPublishedStorefrontSettings } from "@/lib/adapters/storefront-settings.adapter";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "اندكس ستور | INDEXES STORE" },
      {
        name: "description",
        content:
          "تصفح منتجات اندكس ستور وأسعارها، وأضف اختياراتك إلى السلة لإكمال طلبك عبر واتساب.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { settings } = useAppearance();
  const { contact } = mapPublishedStorefrontSettings(settings);
  const query = useInfiniteQuery({
    queryKey: ["storefront", "catalog", "reference-v1", "all"],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) => fetchCatalogPage({ first: 24, after: pageParam }),
    getNextPageParam: (page) => (page.hasNextPage ? page.endCursor : undefined),
    staleTime: 60_000,
  });
  const products = query.data?.pages.flatMap((page) => page.items) ?? [];
  const feature = products[0];
  return (
    <VStack className="sf-home sf-container" gap={4}>
      <HStack className="sf-announcement" gap={4} wrap="wrap" justify="between">
        <span>
          <Truck aria-hidden="true" />
          {contact.deliveryInfoText || "معلومات التوصيل عند إتمام الطلب"}
        </span>
        <span>
          <MessageCircle aria-hidden="true" /> أكمل طلبك عبر واتساب
        </span>
      </HStack>
      <section className="sf-hero" aria-label="اكتشف المتجر">
        <HStack className="sf-hero-inner" gap={4} align="center">
          <VStack gap={3} className="sf-hero-copy">
            <p>{contact.storeName}</p>
            <h1>
              اختياراتك
              <br />
              <em>في مكان واحد</em>
            </h1>
            <p className="sf-hero-description">تصفح المنتجات، اختر ما يناسبك، وأكمل طلبك بسهولة.</p>
            <a href="#store-products" className="sf-primary-button">
              تسوق الآن <ArrowLeft aria-hidden="true" />
            </a>
          </VStack>
          {feature ? (
            <Link
              to="/product/$slug"
              params={{ slug: feature.slug }}
              className="sf-hero-product"
              aria-label={`عرض ${feature.name}`}
            >
              <img src={feature.image} alt={feature.name} fetchPriority="high" />
              <span className="sf-hero-caption">
                <span className="sf-hero-name">{feature.name}</span>
                <strong>{formatPrice(feature.price)}</strong>
              </span>
            </Link>
          ) : (
            <span className="sf-hero-placeholder">
              <ShoppingCartHero />
            </span>
          )}
        </HStack>
      </section>
      {products.length > 1 && (
        <Grid columns={3} gap={3} className="sf-promo-grid">
          {products.slice(1, 4).map((product, index) => (
            <Link
              to="/product/$slug"
              params={{ slug: product.slug }}
              key={product.id}
              className={`sf-promo sf-promo-${index}`}
            >
              <VStack gap={2}>
                <small>اكتشف من المتجر</small>
                <h2>{product.name}</h2>
                <strong>{formatPrice(product.price)}</strong>
                <span>
                  عرض المنتج <ArrowLeft aria-hidden="true" />
                </span>
              </VStack>
              <img src={product.image} alt="" loading="lazy" />
            </Link>
          ))}
        </Grid>
      )}
      <section id="store-products" className="sf-catalog" aria-labelledby="catalog-heading">
        <HStack justify="between" align="center" gap={3} className="sf-section-heading">
          <h2 id="catalog-heading">منتجات المتجر</h2>
          <Link to="/search" search={{ q: "" }}>
            البحث والتصفية <ArrowLeft aria-hidden="true" />
          </Link>
        </HStack>
        {query.isPending ? (
          <Grid
            columns={2}
            gap={3}
            className="sf-product-grid"
            role="status"
            aria-label="جار تحميل المنتجات"
            aria-busy="true"
          >
            {Array.from({ length: 8 }, (_, index) => (
              <VStack key={index} className="sf-product-skeleton" gap={3}>
                <span />
                <span />
                <span />
              </VStack>
            ))}
          </Grid>
        ) : query.isError ? (
          <VStack className="sf-empty" gap={3} role="alert">
            <Package aria-hidden="true" />
            <h3>تعذر تحميل المنتجات</h3>
            <p>تحقق من اتصالك ثم أعد المحاولة.</p>
            <button className="sf-secondary-button" onClick={() => void query.refetch()}>
              إعادة المحاولة
            </button>
          </VStack>
        ) : products.length === 0 ? (
          <VStack className="sf-empty" gap={3}>
            <Package aria-hidden="true" />
            <h3>لا توجد منتجات متاحة حاليًا</h3>
            <p>ستظهر المنتجات المنشورة هنا فور توفرها.</p>
          </VStack>
        ) : (
          <Grid columns={2} gap={3} className="sf-product-grid">
            {products.map((product, index) => (
              <ProductCard key={product.id} product={product} eager={index < 4} />
            ))}
          </Grid>
        )}
        {query.hasNextPage && (
          <button
            className="sf-load-more sf-secondary-button"
            disabled={query.isFetchingNextPage}
            onClick={() => void query.fetchNextPage()}
          >
            {query.isFetchingNextPage ? "جار تحميل المزيد..." : "عرض المزيد من المنتجات"}
          </button>
        )}
      </section>
    </VStack>
  );
}

function ShoppingCartHero() {
  return <Package aria-hidden="true" />;
}
import type { HeroConfig } from "@/lib/domain/appearance";
import { ProductSphereHero } from "@/components/product-sphere-hero";
import { ImmersiveProductExperience } from "@/components/immersive/ImmersiveProductExperience";

export type StorefrontHeroProps = {
  hero: HeroConfig;
  products?: LegacyProductShape[];
};

export function StorefrontHero({ hero, products = [] }: StorefrontHeroProps) {
  if (hero.enabled === false) return null;

  switch (hero.type) {
    case "sphere_3d":
      return (
        <div data-testid="hero-sphere-3d">
          <ProductSphereHero products={products} />
        </div>
      );
    case "cinematic":
      return (
        <div data-testid="hero-cinematic">
          <ImmersiveProductExperience products={products} />
        </div>
      );
    case "banner_image":
      return (
        <div
          data-testid="hero-banner"
          className="relative overflow-hidden rounded-[32px] mx-2 sm:mx-4 my-2 border border-white/10 bg-surface shadow-2xl"
        >
          {hero.bannerImageUrl ? (
            <img
              src={hero.bannerImageUrl}
              alt={hero.title || "البنر الرئيسي"}
              className="w-full h-[50vh] min-h-[350px] object-cover"
            />
          ) : (
            <div className="w-full h-[50vh] min-h-[350px] bg-gradient-to-r from-primary/30 to-secondary/30 flex items-center justify-center" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-6 sm:p-10 text-start space-y-3">
            {hero.badgeText && (
              <span className="inline-block self-start rounded-full bg-primary/30 border border-primary/40 px-3.5 py-1 text-xs font-bold text-primary">
                {hero.badgeText}
              </span>
            )}
            <h1 className="text-2xl sm:text-4xl font-black text-white leading-tight">
              {hero.title}
            </h1>
            <p className="text-xs sm:text-sm text-gray-200 max-w-xl">{hero.subtitle}</p>
            {hero.ctaText && (
              <a
                href={hero.ctaLink || "/offers"}
                className="inline-flex self-start items-center gap-2 rounded-full bg-primary px-6 py-3 text-xs font-bold text-white shadow-brand hover:bg-primary/90 transition"
              >
                {hero.ctaText}
              </a>
            )}
          </div>
        </div>
      );
    case "video":
      return (
        <div
          data-testid="hero-video"
          className="relative overflow-hidden rounded-[32px] mx-2 sm:mx-4 my-2 border border-white/10 bg-black min-h-[400px] shadow-2xl"
        >
          {hero.bannerVideoUrl ? (
            <video
              src={hero.bannerVideoUrl}
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover opacity-60"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-900/40 to-blue-900/40" />
          )}
          <div className="relative z-10 flex flex-col justify-center items-center text-center p-8 sm:p-14 min-h-[400px] space-y-4">
            {hero.badgeText && (
              <span className="rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-4 py-1 text-xs font-bold">
                {hero.badgeText}
              </span>
            )}
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              {hero.title}
            </h1>
            <p className="text-sm sm:text-base text-gray-300 max-w-lg">{hero.subtitle}</p>
            {hero.ctaText && (
              <a
                href={hero.ctaLink || "/offers"}
                className="inline-flex items-center gap-2 rounded-full bg-cyan-400 px-7 py-3 text-xs font-black text-black hover:bg-cyan-300 transition shadow-lg"
              >
                {hero.ctaText}
              </a>
            )}
          </div>
        </div>
      );
    case "slideshow":
      return (
        <div
          data-testid="hero-slideshow"
          className="relative overflow-hidden rounded-[32px] mx-2 sm:mx-4 my-2 border border-white/10 bg-surface shadow-2xl"
        >
          {hero.bannerImageUrl ? (
            <img
              src={hero.bannerImageUrl}
              alt={hero.title || "البنر الرئيسي"}
              className="w-full h-[50vh] min-h-[350px] object-cover"
            />
          ) : (
            <div className="w-full h-[50vh] min-h-[350px] bg-gradient-to-r from-primary/30 to-secondary/30 flex items-center justify-center" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-6 sm:p-10 text-start space-y-3">
            {hero.badgeText && (
              <span className="inline-block self-start rounded-full bg-primary/30 border border-primary/40 px-3.5 py-1 text-xs font-bold text-primary">
                {hero.badgeText}
              </span>
            )}
            <h1 className="text-2xl sm:text-4xl font-black text-white leading-tight">
              {hero.title}
            </h1>
            <p className="text-xs sm:text-sm text-gray-200 max-w-xl">{hero.subtitle}</p>
            {hero.ctaText && (
              <a
                href={hero.ctaLink || "/offers"}
                className="inline-flex self-start items-center gap-2 rounded-full bg-primary px-6 py-3 text-xs font-bold text-white shadow-brand hover:bg-primary/90 transition"
              >
                {hero.ctaText}
              </a>
            )}
          </div>
        </div>
      );
    default:
      return (
        <div data-testid="hero-cinematic">
          <ImmersiveProductExperience products={products} />
        </div>
      );
  }
}

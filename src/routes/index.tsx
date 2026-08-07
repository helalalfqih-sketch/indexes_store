import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import * as Icons from "lucide-react";
import type { LegacyProductShape } from "@/lib/data-adapter";
import type { Product } from "@/lib/store-data";
import {
  categoriesQuery,
  bestSellersQuery,
  offersQuery,
  globePoolQuery,
} from "@/lib/queries/catalog";
import { CategoryRailSkeleton, ProductRailSkeleton } from "@/components/home/home-skeletons";
import { NeonProductCard } from "@/components/home/neon-product-card";
import { ScrollGlobeHero } from "@/components/home/scroll-globe-hero";
import { TrustStrip } from "@/components/home/trust-strip";
import loyaltyGem from "@/assets/loyalty-gem.png";
import { Reveal } from "@/components/motion/reveal";
import { SnapRail } from "@/components/motion/snap-rail";
import { useSession } from "@/hooks/use-session";
import { getPublishedStorefrontAppearance } from "@/lib/actions/appearance.actions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "اندكس ستور — الرئيسية | تسوّق أونلاين في اليمن" },
      {
        name: "description",
        content: "اكتشف أحدث المنتجات والعروض في اندكس ستور: إلكترونيات، أزياء، عطور، والمزيد.",
      },
      { property: "og:title", content: "اندكس ستور — تسوّق أونلاين في اليمن" },
      {
        property: "og:description",
        content: "عروض حصرية تصل إلى 50% وشحن مجاني للطلبات فوق 30,000 ريال.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(categoriesQuery()),
      context.queryClient.ensureQueryData(bestSellersQuery(20)),
      context.queryClient.ensureQueryData(offersQuery(20)),
      context.queryClient.ensureQueryData(globePoolQuery(100)),
    ]);
  },
  errorComponent: ({ error }) => (
    <div className="p-8 text-center text-destructive">حدث خطأ: {error.message}</div>
  ),
  pendingComponent: HomeSkeleton,
  component: HomePage,
});

function HomeSkeleton() {
  return (
    <div
      dir="rtl"
      className="flex flex-col gap-3.5 bg-ink px-3.5 pt-3 text-ink-text sm:px-4 md:px-0"
    >
      <div className="h-11 rounded-[14px] border border-ink-line bg-ink-card md:h-[50px]" />
      <div className="h-[228px] rounded-[24px] border border-ink-line bg-[#0A1020]" />
      <CategoryRailSkeleton />
      <ProductRailSkeleton />
      <div className="h-24 rounded-2xl border border-ink-line bg-[#0A1020] md:h-[84px]" />
      <div className="min-h-[170px] rounded-[24px] border border-ink-line bg-[#0A1020]" />
    </div>
  );
}

function HomePage() {
  const { data: categories } = useSuspenseQuery(categoriesQuery());
  const { data: bestSellers } = useSuspenseQuery(bestSellersQuery(20));
  const { data: dailyDeals } = useSuspenseQuery(offersQuery(20));
  const { data: allProducts } = useSuspenseQuery(globePoolQuery(100));

  const settingsQ = useQuery({
    queryKey: ["storefront-settings"],
    queryFn: () => getPublishedStorefrontAppearance(),
    staleTime: 60 * 1000,
  });

  const { user } = useSession();
  const deals = (dailyDeals.length ? dailyDeals : bestSellers) as unknown as Product[];
  const globeProducts = (allProducts.length ? allProducts : dailyDeals) as LegacyProductShape[];

  const nav = settingsQ.data?.navigation;

  return (
    <div
      dir="rtl"
      className="flex flex-col gap-3.5 bg-ink px-3.5 pt-3 text-ink-text sm:px-4 md:px-0"
    >
      {/* Shipping strip — two info badges matching target image */}
      <div className="flex h-10 items-center justify-between gap-2 rounded-[14px] border border-ink-line/60 bg-ink-card px-3 text-[11px] font-semibold leading-4 md:h-[46px] md:rounded-2xl md:px-[24px] md:text-[13px]">
        <div className="flex items-center gap-1.5 text-ink-muted">
          <span className="text-amber-400 text-xs">⚡</span>{" "}
          {nav?.shippingBarDeliveryText ?? "توصيل سريع خلال 24 - 48 ساعة"}
        </div>
        <div className="flex items-center gap-1.5 text-ink-muted">
          <span>🚀</span> {nav?.shippingBarFreeText ?? "شحن مجاني للطلبات فوق"}{" "}
          <span className="text-neon-2 font-bold">
            {(nav?.shippingBarThreshold ?? 30000).toLocaleString("en-US")}
          </span>{" "}
          {nav?.shippingBarCurrency ?? "ريال"} <span className="text-amber-400 text-xs">🚚</span>
        </div>
      </div>

      {/* Hero Globe */}
      <ScrollGlobeHero products={globeProducts} />

      {/* Categories */}
      <Reveal as="section" className="-mx-3.5 sm:-mx-4 md:mx-0">
        <SnapRail className="px-3.5 sm:px-4 md:px-0" itemGapClass="gap-2 md:gap-3">
          <Link
            to="/search"
            search={{ q: "" }}
            className="press card-lift flex h-[64px] w-[58px] shrink-0 snap-start flex-col items-center justify-center gap-1 rounded-[13px] border border-ink-line bg-ink-card px-1.5 sm:w-[63px] md:h-[78px] md:w-[120px]"
          >
            <Icons.LayoutGrid
              className="h-[19px] w-[19px] text-neon-2 md:h-6 md:w-6"
              strokeWidth={1.6}
            />
            <span className="line-clamp-2 w-full text-center text-[9px] font-semibold leading-tight text-ink-text md:text-[11px]">
              المزيد
            </span>
          </Link>
          {categories.map((c) => {
            const Icon =
              (Icons as unknown as Record<string, Icons.LucideIcon>)[c.icon] ?? Icons.Package;
            return (
              <Link
                key={c.id}
                to="/category/$id"
                params={{ id: c.id }}
                className="press card-lift flex h-[64px] w-[58px] shrink-0 snap-start flex-col items-center justify-center gap-1 rounded-[13px] border border-ink-line bg-ink-card px-1.5 sm:w-[63px] md:h-[78px] md:w-full md:flex-1"
              >
                <Icon className="h-[19px] w-[19px] text-neon-2 md:h-6 md:w-6" strokeWidth={1.6} />
                <span className="line-clamp-2 w-full text-center text-[9px] font-semibold leading-tight text-ink-text md:text-[11px]">
                  {c.name}
                </span>
              </Link>
            );
          })}
        </SnapRail>
      </Reveal>

      {/* Best offers */}
      <Reveal as="section">
        <div className="mb-2.5 flex h-[22px] items-center justify-between md:h-[26px]">
          <h2 className="flex items-center gap-1.5 text-[14px] font-bold md:text-[18px]">
            أفضل العروض
            <span className="text-[14px] md:text-[18px]">🔥</span>
          </h2>
          <Link
            to="/offers"
            className="flex items-center gap-1 text-[11px] font-bold text-neon-2 md:text-[14px]"
          >
            عرض الكل
            <Icons.ChevronLeft className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="relative">
          <SnapRail className="-mx-3.5 px-3.5 sm:-mx-4 sm:px-4 md:hidden" itemGapClass="gap-3">
            {deals.map((p, i) => (
              <Reveal key={p.id} index={i} className="shrink-0">
                <NeonProductCard product={p} />
              </Reveal>
            ))}
          </SnapRail>
          {/* Desktop grid */}
          <div className="hidden gap-3 md:grid md:grid-cols-4 md:justify-items-center">
            {deals.slice(0, 4).map((p, i) => (
              <Reveal key={p.id} index={i} className="w-full">
                <NeonProductCard product={p} />
              </Reveal>
            ))}
          </div>
        </div>
      </Reveal>

      {/* Trust strip */}
      <Reveal as="div" className="defer-paint">
        <TrustStrip variant="inline" />
      </Reveal>

      {/* Loyalty Card */}
      <Reveal
        as="section"
        className="defer-paint relative overflow-hidden rounded-[24px] border border-neon/40 bg-linear-to-r from-neon-soft via-ink-card to-ink-card p-4 md:h-[176px] md:px-5"
      >
        <div className="flex h-full flex-col gap-3 md:flex-row md:items-center md:gap-4">
          <div className="flex min-w-0 items-center gap-3 md:order-2 md:flex-1 md:flex-row-reverse md:justify-end md:text-center">
            <img
              src={loyaltyGem}
              alt="جوهرة برنامج الولاء"
              loading="lazy"
              width={512}
              height={512}
              className="h-[62px] w-[62px] shrink-0 object-contain drop-shadow-[0_0_18px_var(--neon)] md:h-[110px] md:w-[110px]"
            />
            <div className="min-w-0 flex-1">
              <h3 className="text-[15px] font-bold leading-tight md:text-[17px]">
                {nav?.loyaltyTitle ?? "برنامج INDEXES المميز"}
              </h3>
              <p className="mt-1 text-[12px] leading-snug text-ink-muted md:text-[13px]">
                {nav?.loyaltySubtitle ?? "اكسب نقاط مع كل طلب واستبدلها بمكافآت حصرية"}
              </p>
              <Link
                to={user ? "/account" : "/auth"}
                className="press mt-2.5 inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-neon px-3.5 py-1.5 text-[12px] font-bold text-white"
              >
                {nav?.loyaltyButtonText ?? "اكتشف المزايا"}
                <Icons.ChevronLeft className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-ink-line bg-ink/60 p-3 text-center md:order-1 md:w-[38%] md:shrink-0">
            <p className="text-[11px] font-semibold text-ink-muted mb-0.5">نقاطك الحالية</p>
            <p className="flex items-center justify-center gap-1 text-[20px] font-black text-neon-2">
              <Icons.Sparkles className="h-5 w-5 shrink-0 fill-neon-2 text-neon-2" />
              {nav?.loyaltyPointsText ?? "2,560"}
            </p>
            <p className="mt-1 text-[11px] font-bold text-amber-400">
              {nav?.loyaltyLevelText ?? "المستوى ذهبي 👑"}
            </p>
          </div>
        </div>
      </Reveal>

      {/* Footer */}
      <footer className="mt-6 border-t border-ink-line pt-8 pb-24">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-3 text-right text-[13px] text-ink-muted">
            <div className="flex items-center justify-start gap-2">
              <Icons.MessageSquare className="h-5 w-5 text-emerald-500 shrink-0" />
              <span>
                لطلب والاستفسار (واتساب):{" "}
                <a
                  href={`https://wa.me/${nav?.whatsappPhone ?? "967771370740"}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-ink-text hover:text-emerald-400"
                >
                  {nav?.whatsappPhone ?? "967771370740"}
                </a>
              </span>
            </div>
            <div className="flex items-center justify-start gap-2">
              <Icons.MapPin className="h-5 w-5 text-neon-2 shrink-0" />
              <span>
                العنوان: {nav?.addressText ?? "صنعاء - شارع بينون - مقابل صيدلية الرعاية الصحية"}
              </span>
            </div>
            <div className="flex items-center justify-start gap-2">
              <span className="text-base shrink-0">🇾🇪</span>
              <span>{nav?.deliveryInfoText ?? "متوفر لدينا خدمة التوصيل لجميع المحافظات"}</span>
            </div>
            <div className="flex items-center justify-start gap-2">
              <Icons.PackageCheck className="h-5 w-5 text-blue-400 shrink-0" />
              <span>
                <strong className="text-ink-text">تتبع طلبك</strong> - برقم الطلب وآخر 4 أرقام من
                هاتفك
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 border-t border-ink-line pt-4 md:border-t-0 md:pt-0">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-ink-text">تواصل معنا الآن</span>
              <a
                href={`https://wa.me/${nav?.whatsappPhone ?? "967771370740"}`}
                target="_blank"
                rel="noreferrer"
                className="grid h-10 w-10 place-items-center rounded-full border border-ink-line bg-ink-card text-emerald-400 transition hover:bg-emerald-500 hover:text-white"
              >
                <Icons.MessageSquare className="h-5 w-5" />
              </a>
            </div>

            <div className="relative flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-full border-2 border-dashed border-amber-400 text-center p-2">
              <Icons.ShoppingCart className="h-6 w-6 text-ink-text mb-0.5" />
              <span className="text-[11px] font-black leading-none text-ink-text">
                {nav?.stampLogoTitle ?? "INDEXES STORE"}
              </span>
              <span className="text-[7px] font-bold tracking-widest text-amber-400 mt-1">
                {nav?.stampLogoSubtitle ?? "PREMIUM QUALITY"}
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
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

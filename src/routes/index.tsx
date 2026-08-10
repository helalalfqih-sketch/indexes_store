import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Compass, MessageCircle, X } from "lucide-react";
import type { LegacyProductShape } from "@/lib/data-adapter";
import type { Product as ProductionProduct } from "@/lib/store-data";
import { useCart } from "@/lib/cart-store";
import { useFavorites } from "@/lib/use-favorites";
import {
  categoriesQuery,
  bestSellersQuery,
  offersQuery,
  globePoolQuery,
} from "@/lib/queries/catalog";

import {
  Product as DesignProduct,
  CartItem,
  Currency,
  ActiveTab,
  OrderStatus,
  NotificationItem,
  SortOption,
} from "@/components/storefront/types";
import { mapProductionProductToDesignProduct } from "@/components/storefront/adapters";
import { Header } from "@/components/storefront/Header";
import { ShippingBanner } from "@/components/storefront/ShippingBanner";
import { AISearchSection } from "@/components/storefront/AISearchSection";
import { HeroCarousel } from "@/components/storefront/HeroCarousel";
import { CategoryBar, type PriceRangePreset } from "@/components/storefront/CategoryBar";
import { DiscoveryStrip } from "@/components/storefront/DiscoveryStrip";
import { RecentlyViewedStrip } from "@/components/storefront/RecentlyViewedStrip";
import { BestOffersSection } from "@/components/storefront/BestOffersSection";
import { ProductCard } from "@/components/storefront/ProductCard";
import { TrustBar } from "@/components/storefront/TrustBar";
import { LoyaltyBanner } from "@/components/storefront/LoyaltyBanner";
import { StoreFooter } from "@/components/storefront/StoreFooter";
import { BottomNav } from "@/components/storefront/BottomNav";
import { AmbientBackground } from "@/components/storefront/AmbientBackground";
import {
  ProductCardSkeleton,
  HeroCarouselSkeleton,
  ProductGridSkeleton,
} from "@/components/storefront/SkeletonLoader";
import { ProductDetailModal } from "@/components/storefront/ProductDetailModal";
import { ProductStoryModal } from "@/components/storefront/ProductStoryModal";
import { ProductUniverseModal } from "@/components/storefront/ProductUniverseModal";
import {
  CustomerSupportHub,
  type SupportContext,
} from "@/components/storefront/CustomerSupportHub";
import { CinematicProductDeconstruction } from "@/components/storefront/CinematicProductDeconstruction";
import { CartDrawer } from "@/components/storefront/CartDrawer";
import { CheckoutModal } from "@/components/storefront/CheckoutModal";
import { OrderTrackerModal } from "@/components/storefront/OrderTrackerModal";
import { NotificationsModal } from "@/components/storefront/NotificationsModal";
import { AccountDrawer } from "@/components/storefront/AccountDrawer";
import { AdminPanel } from "@/components/storefront/AdminPanel";
import { WishlistDrawer } from "@/components/storefront/WishlistDrawer";
import { ProductCompareModal } from "@/components/storefront/ProductCompareModal";
import { ToastNotification } from "@/components/storefront/ToastNotification";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "متجر إندكس — INDEXES STORE | التسوق الإلكتروني الفاخر في اليمن" },
      {
        name: "description",
        content:
          "اكتشف أحدث الإلكترونيات والمنتجات الأصلية في متجر إندكس: تسوق فاخر، عروض حصرية، توصيل سريع لجميع المحافظات.",
      },
      { property: "og:title", content: "متجر إندكس — INDEXES STORE" },
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
    <div className="dir-rtl p-8 text-center font-bold text-rose-500">حدث خطأ: {error.message}</div>
  ),
  pendingComponent: HomeSkeleton,
  component: HomePage,
});

function HomeSkeleton() {
  return (
    <div
      dir="rtl"
      className="min-h-screen space-y-6 bg-[var(--color-bg,#08090B)] p-4 text-[var(--color-text-primary,#F5F7FA)]"
    >
      <HeroCarouselSkeleton />
      <ProductGridSkeleton count={8} />
    </div>
  );
}

function HomePage() {
  const { data: bestSellers } = useSuspenseQuery(bestSellersQuery(20));
  const { data: dailyDeals } = useSuspenseQuery(offersQuery(20));
  const { data: allProducts } = useSuspenseQuery(globePoolQuery(100));

  const rawProductList = useMemo(() => {
    return allProducts.length ? allProducts : dailyDeals.length ? dailyDeals : bestSellers;
  }, [allProducts, dailyDeals, bestSellers]);

  const rawProductMap = useMemo(() => {
    const map = new Map<string, LegacyProductShape>();
    (rawProductList as LegacyProductShape[]).forEach((product) => {
      map.set(product.id, product);
    });
    return map;
  }, [rawProductList]);

  const products: DesignProduct[] = useMemo(
    () =>
      (rawProductList as (LegacyProductShape | ProductionProduct)[]).map((product) =>
        mapProductionProductToDesignProduct(product),
      ),
    [rawProductList],
  );

  const cartStoreItems = useCart((state) => state.items);
  const cartStoreCount = useCart((state) => state.count());
  const addToCartStore = useCart((state) => state.add);
  const setQtyCartStore = useCart((state) => state.setQty);
  const removeFromCartStore = useCart((state) => state.remove);
  const { favorites, toggleFavorite } = useFavorites();

  const cartItems: CartItem[] = useMemo(
    () =>
      cartStoreItems.map((item) => {
        const foundRaw = rawProductMap.get(item.productId);
        const designProduct = foundRaw
          ? mapProductionProductToDesignProduct(foundRaw)
          : {
              id: item.productId,
              name: item.name,
              subtitle: item.name,
              description: item.name,
              priceYER: item.price,
              originalPriceYER: item.price,
              rating: 4.8,
              reviewsCount: 12,
              image: item.image,
              category: "all",
              inStock: true,
            };
        return { product: designProduct, quantity: item.qty };
      }),
    [cartStoreItems, rawProductMap],
  );

  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window === "undefined") return "dark";
    const saved = localStorage.getItem("indexes_store_theme");
    if (saved === "dark" || saved === "light") return saved;
    return window.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : "dark";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.classList.toggle("light", theme === "light");
    localStorage.setItem("indexes_store_theme", theme);
  }, [theme]);

  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currency, setCurrency] = useState<Currency>("YER");
  const [activeTab, setActiveTab] = useState<ActiveTab>("home");
  const [sortBy, setSortBy] = useState<SortOption>("default");
  const [priceRange, setPriceRange] = useState<PriceRangePreset>("all");
  const [customMinPrice, setCustomMinPrice] = useState<number | undefined>();
  const [customMaxPrice, setCustomMaxPrice] = useState<number | undefined>();
  const [discoveryFilter, setDiscoveryFilter] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [compareList, setCompareList] = useState<DesignProduct[]>([]);
  const [userOrders, setUserOrders] = useState<OrderStatus[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: "notif-1",
      title: "مرحباً بك في متجر إندكس 🎉",
      message: "استمتع بتجربة تسوق فريدة وشحن مجاني للطلبات فوق 30,000 ريال.",
      time: "منذ قليل",
      read: false,
      type: "offer",
    },
  ]);
  const [toasts, setToasts] = useState<
    { id: string; type: "success" | "error" | "info"; message: string }[]
  >([]);
  const [selectedProductModal, setSelectedProductModal] = useState<DesignProduct | null>(null);
  const [storyProduct, setStoryProduct] = useState<DesignProduct | null>(null);
  const [isUniverseOpen, setIsUniverseOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isDeconstructionOpen, setIsDeconstructionOpen] = useState(false);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isTrackerModalOpen, setIsTrackerModalOpen] = useState(false);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [isAccountDrawerOpen, setIsAccountDrawerOpen] = useState(false);
  const [isWishlistDrawerOpen, setIsWishlistDrawerOpen] = useState(false);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [appliedCouponDiscount, setAppliedCouponDiscount] = useState(0);
  const [recentlyViewedIds, setRecentlyViewedIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem("indexes_store_recently_viewed");
      const parsed = stored ? (JSON.parse(stored) as unknown) : [];
      return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
    } catch {
      return [];
    }
  });

  const unreadNotificationsCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications],
  );
  const bestOffers = useMemo(
    () => products.filter((product) => product.isBestOffer || Boolean(product.discountBadge)),
    [products],
  );
  const recentlyViewedProducts = useMemo(
    () =>
      recentlyViewedIds
        .map((id) => products.find((product) => product.id === id))
        .filter((product): product is DesignProduct => Boolean(product)),
    [products, recentlyViewedIds],
  );

  const filteredProducts = useMemo(() => {
    const list = products.filter((product) => {
      const matchCategory = selectedCategory === "all" || product.category === selectedCategory;
      const query = searchQuery.toLowerCase();
      const matchSearch =
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.subtitle.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query);
      const matchPrice =
        priceRange === "all" ||
        (priceRange === "under-20k" && product.priceYER < 20_000) ||
        (priceRange === "20k-50k" && product.priceYER >= 20_000 && product.priceYER <= 50_000) ||
        (priceRange === "over-50k" && product.priceYER > 50_000) ||
        (priceRange === "custom" &&
          (customMinPrice === undefined || product.priceYER >= customMinPrice) &&
          (customMaxPrice === undefined || product.priceYER <= customMaxPrice));
      return matchCategory && matchSearch && matchPrice;
    });

    switch (sortBy) {
      case "price-high":
        return [...list].sort((a, b) => b.priceYER - a.priceYER);
      case "price-low":
        return [...list].sort((a, b) => a.priceYER - b.priceYER);
      case "best-selling":
        return [...list].sort((a, b) => b.reviewsCount - a.reviewsCount);
      case "newest":
        return [...list].sort((a, b) => Number(Boolean(b.isNewArrival)) - Number(Boolean(a.isNewArrival)));
      default:
        return list;
    }
  }, [products, selectedCategory, searchQuery, sortBy, priceRange, customMinPrice, customMaxPrice]);

  const activeSupportContext: SupportContext = useMemo(() => {
    if (isCheckoutModalOpen) return "checkout";
    if (isCartDrawerOpen) return "cart";
    if (selectedProductModal) return selectedProductModal.inStock ? "product" : "unavailable";
    if (isAccountDrawerOpen || isTrackerModalOpen) return "account";
    return "home";
  }, [isAccountDrawerOpen, isCartDrawerOpen, isCheckoutModalOpen, isTrackerModalOpen, selectedProductModal]);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    const id = `toast-${Date.now()}`;
    setToasts((current) => [...current, { id, type, message }]);
    window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 3000);
  };

  const selectProduct = (product: DesignProduct) => {
    setSelectedProductModal(product);
    setRecentlyViewedIds((current) => {
      const next = [product.id, ...current.filter((id) => id !== product.id)].slice(0, 8);
      try {
        localStorage.setItem("indexes_store_recently_viewed", JSON.stringify(next));
      } catch {
        // Browsing history is an optional convenience feature.
      }
      return next;
    });
  };

  const clearRecentlyViewed = () => {
    setRecentlyViewedIds([]);
    try {
      localStorage.removeItem("indexes_store_recently_viewed");
    } catch {
      // Ignore storage failures.
    }
  };

  const handleSelectCategoryWithLoading = (categoryId: string) => {
    setIsLoading(true);
    setSelectedCategory(categoryId);
    window.setTimeout(() => setIsLoading(false), 250);
  };

  const handleToggleFavorite = (product: DesignProduct) => toggleFavorite(product.id);

  const handleAddToCart = (product: DesignProduct, quantity = 1) => {
    const raw = rawProductMap.get(product.id) || {
      id: product.id,
      slug: product.slug || product.id,
      name: product.name,
      description: product.description,
      price: product.priceYER,
      oldPrice: product.originalPriceYER > product.priceYER ? product.originalPriceYER : undefined,
      stock: product.inStock ? 50 : 0,
      image: product.image,
      rating: product.rating,
      reviews: product.reviewsCount,
      categoryId: product.category,
    };
    addToCartStore(raw, quantity);
  };

  const handleOrderPlaced = (newOrder: OrderStatus) => {
    setUserOrders((current) => [newOrder, ...current]);
    setNotifications((current) => [
      {
        id: `notif-${Date.now()}`,
        title: `تم ثبت طلبك برقم #${newOrder.orderNumber}`,
        message: "تم حفظ طلبك وسيتم التواصل معك لتأكيد التوصيل.",
        time: "الآن",
        read: false,
        type: "order",
      },
      ...current,
    ]);
  };

  const handleBottomNavTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
    if (tab === "cart") setIsCartDrawerOpen(true);
    else if (tab === "account") setIsAccountDrawerOpen(true);
    else if (tab === "search") window.scrollTo({ top: 400, behavior: "smooth" });
  };

  const handleSelectDiscoveryOption = (type: string) => {
    setDiscoveryFilter(type);
    if (type === "best-selling") setSortBy("best-selling");
    else if (type === "newest") setSortBy("newest");
    else if (type === "gift") setSelectedCategory("smartwatches");
    else if (type === "home") setSelectedCategory("home_appliances");
    else if (type === "budget") setSortBy("price-low");
    else if (type === "surprise" && products.length) {
      selectProduct(products[Math.floor(Math.random() * products.length)]);
    }
  };

  return (
    <div className="dir-rtl relative flex min-h-screen flex-col overflow-x-hidden bg-[var(--color-bg,#08090B)] pb-28 text-right font-sans text-[var(--color-text-primary,#F5F7FA)] transition-colors duration-200 selection:bg-[#2F6BFF] selection:text-white">
      <AmbientBackground />
      <ToastNotification toasts={toasts} onDismiss={(id) => setToasts((current) => current.filter((toast) => toast.id !== id))} />

      <div className="relative z-10 flex min-h-screen flex-col">
        <Header
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          cartCount={cartStoreCount}
          unreadNotificationsCount={unreadNotificationsCount}
          wishlistCount={favorites.length}
          compareCount={compareList.length}
          products={products}
          currency={currency}
          theme={theme}
          onToggleTheme={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
          onOpenCart={() => setIsCartDrawerOpen(true)}
          onOpenNotifications={() => setIsNotificationsModalOpen(true)}
          onOpenWishlist={() => setIsWishlistDrawerOpen(true)}
          onOpenCompare={() => setIsCompareModalOpen(true)}
          onOpenMenu={() => setIsAccountDrawerOpen(true)}
          onOpenTracker={() => setIsTrackerModalOpen(true)}
          onOpenAdmin={() => setIsAdminOpen(true)}
          onSelectProduct={selectProduct}
        />

        <ShippingBanner onOpenShippingInfo={() => setIsTrackerModalOpen(true)} />

        <main className="mx-auto w-full max-w-7xl flex-grow pb-28 sm:pb-32">
          {isLoading ? (
            <HeroCarouselSkeleton />
          ) : (
            <HeroCarousel
              products={products}
              onSelectCategory={handleSelectCategoryWithLoading}
              onSelectProduct={selectProduct}
              onOpenDeconstruction={() => setIsDeconstructionOpen(true)}
            />
          )}

          <div className="px-4 pt-3 sm:px-6">
            <button
              type="button"
              onClick={() => setIsUniverseOpen(true)}
              className="flex w-full cursor-pointer items-center justify-between rounded-2xl border border-blue-500/20 bg-gradient-to-l from-blue-500/10 via-violet-500/10 to-transparent px-4 py-3 text-right transition hover:border-blue-400/40"
            >
              <span>
                <span className="block text-sm font-black text-[var(--color-text-primary)]">استكشف كون المنتجات</span>
                <span className="text-[11px] text-[var(--color-text-secondary)]">تصفح منتجات Supabase الحقيقية بطريقة تفاعلية</span>
              </span>
              <Compass className="h-5 w-5 text-blue-400" />
            </button>
          </div>

          <DiscoveryStrip
            onSelectDiscoveryOption={handleSelectDiscoveryOption}
            activeFilter={discoveryFilter}
            onResetFilter={() => {
              setDiscoveryFilter(null);
              setSortBy("default");
              setSelectedCategory("all");
              setPriceRange("all");
              setCustomMinPrice(undefined);
              setCustomMaxPrice(undefined);
            }}
          />

          <RecentlyViewedStrip
            products={recentlyViewedProducts}
            currency={currency}
            onSelectProduct={selectProduct}
            onClearHistory={clearRecentlyViewed}
          />

          <CategoryBar
            selectedCategoryId={selectedCategory}
            onSelectCategory={handleSelectCategoryWithLoading}
            selectedSort={sortBy}
            onSelectSort={setSortBy}
            selectedPriceRange={priceRange}
            customMinPrice={customMinPrice}
            customMaxPrice={customMaxPrice}
            onSelectPriceRange={(range, min, max) => {
              setPriceRange(range);
              setCustomMinPrice(min);
              setCustomMaxPrice(max);
            }}
          />

          {selectedCategory === "all" && !searchQuery ? (
            <BestOffersSection
              bestOffers={bestOffers.length ? bestOffers : products.slice(0, 6)}
              currency={currency}
              favorites={favorites}
              isLoading={isLoading}
              onToggleFavorite={handleToggleFavorite}
              onAddToCart={(product) => handleAddToCart(product, 1)}
              onSelectProduct={selectProduct}
              onViewAll={() => handleSelectCategoryWithLoading("all")}
            />
          ) : null}

          <AISearchSection
            currency={currency}
            onSelectProduct={selectProduct}
            onSearchQuerySubmit={(query) => {
              setIsLoading(true);
              setSearchQuery(query);
              window.setTimeout(() => setIsLoading(false), 250);
            }}
          />

          <section className="px-4 py-6 sm:px-6">
            <div className="dir-rtl mb-6 flex flex-col justify-between gap-3 border-b border-[var(--color-border-default)] pb-4 sm:flex-row sm:items-center">
              <div>
                <h3 className="text-xl font-bold text-[var(--color-text-primary)] sm:text-2xl">
                  {selectedCategory === "all"
                    ? searchQuery
                      ? `نتائج البحث عن "${searchQuery}"`
                      : "جميع المنتجات المتوفرة"
                    : "منتجات القسم المختار"}
                </h3>
                <p className="mt-1 text-xs text-[var(--color-text-secondary)] sm:text-sm">عرض {filteredProducts.length} منتجات أصلية مع ضمان متجر إندكس</p>
              </div>
              {sortBy !== "default" ? (
                <div className="inline-flex items-center gap-1.5 self-start rounded-full border border-[#2F6BFF]/40 bg-[#2F6BFF]/15 px-3 py-1.5 text-xs font-black text-[#2F6BFF] sm:self-center">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-[#2F6BFF]" />
                  <span>الترتيب المطبق</span>
                  <button type="button" onClick={() => setSortBy("default")} aria-label="إلغاء الترتيب" className="cursor-pointer rounded-full p-1 hover:bg-rose-500/20 hover:text-rose-500"><X className="h-3.5 w-3.5" /></button>
                </div>
              ) : null}
            </div>

            {isLoading ? (
              <ProductGridSkeleton count={8} />
            ) : filteredProducts.length === 0 ? (
              <div className="rounded-3xl border border-[var(--color-border-default)] bg-[var(--color-surface-1)] py-16 text-center text-[var(--color-text-secondary)]">
                <span className="material-symbols-outlined mb-2 text-[64px] text-[var(--color-text-muted)]">search_off</span>
                <p className="text-lg font-bold text-[var(--color-text-primary)]">لم نتمكن من العثور على منتجات مطابقة</p>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">جرّب تغيير كلمة البحث أو قسم المنتجات.</p>
                <button type="button" onClick={() => { setSearchQuery(""); handleSelectCategoryWithLoading("all"); }} className="mt-4 cursor-pointer rounded-2xl bg-[#2F6BFF] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#2458D8]">إعادة ضبط البحث</button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    currency={currency}
                    isFavorite={favorites.includes(product.id)}
                    onToggleFavorite={handleToggleFavorite}
                    onAddToCart={(item) => handleAddToCart(item, 1)}
                    onSelectProduct={selectProduct}
                    variant="grid"
                  />
                ))}
              </div>
            )}
          </section>

          <TrustBar />
          <LoyaltyBanner onOpenLoyaltyModal={() => setIsAccountDrawerOpen(true)} />
          <StoreFooter onOpenTracker={() => setIsTrackerModalOpen(true)} />
        </main>

        <BottomNav activeTab={activeTab} setActiveTab={handleBottomNavTabChange} cartCount={cartStoreCount} />

        <button
          type="button"
          onClick={() => setIsSupportOpen(true)}
          aria-label="فتح مركز المساعدة"
          className="fixed bottom-20 left-4 z-50 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border-2 border-white/20 bg-gradient-to-tr from-[#1ebd59] via-[#25D366] to-[#34e775] text-white shadow-[0_0_25px_rgba(37,211,102,0.6)] transition hover:scale-105 sm:bottom-6 sm:left-6 sm:h-14 sm:w-14"
        >
          <MessageCircle className="h-6 w-6 sm:h-7 sm:w-7" />
        </button>

        <ProductUniverseModal
          isOpen={isUniverseOpen}
          onClose={() => setIsUniverseOpen(false)}
          products={products}
          currency={currency}
          favorites={favorites}
          onToggleFavorite={handleToggleFavorite}
          onAddToCart={handleAddToCart}
          onSelectProductDetails={(product) => {
            setIsUniverseOpen(false);
            selectProduct(product);
          }}
          onOpenStory={(product) => setStoryProduct(product)}
          onOpenCart={() => {
            setIsUniverseOpen(false);
            setIsCartDrawerOpen(true);
          }}
        />

        <ProductStoryModal
          product={storyProduct}
          currency={currency}
          isOpen={Boolean(storyProduct)}
          onClose={() => setStoryProduct(null)}
          onAddToCart={(product) => {
            handleAddToCart(product, 1);
            showToast(`تمت إضافة ${product.name} إلى السلة بنجاح 🛒`);
          }}
        />

        <CustomerSupportHub
          isOpen={isSupportOpen}
          onClose={() => setIsSupportOpen(false)}
          activeContext={activeSupportContext}
          currentProduct={selectedProductModal}
          cartItems={cartItems}
          currency={currency}
          lastOrderRef={userOrders[0]?.id ?? null}
          onOpenTracker={() => setIsTrackerModalOpen(true)}
          onOpenSearch={() => {
            setActiveTab("search");
            window.scrollTo({ top: 400, behavior: "smooth" });
          }}
        />

        <ProductDetailModal
          product={selectedProductModal}
          currency={currency}
          isFavorite={selectedProductModal ? favorites.includes(selectedProductModal.id) : false}
          onClose={() => setSelectedProductModal(null)}
          onAddToCart={(product, quantity) => {
            handleAddToCart(product, quantity);
            showToast(`تمت إضافة ${product.name} إلى السلة بنجاح 🛒`);
          }}
          onToggleFavorite={(product) => {
            handleToggleFavorite(product);
            showToast(favorites.includes(product.id) ? `تمت إزالة ${product.name} من المفضلة` : `تمت إضافة ${product.name} إلى المفضلة ❤️`);
          }}
          onAddToCompare={(product) => {
            if (!compareList.some((item) => item.id === product.id)) {
              setCompareList((current) => [...current, product]);
              showToast(`تمت إضافة ${product.name} إلى المقارنة ⚖️`);
            } else {
              showToast("هذا المنتج مضاف بالفعل في قائمة المقارنة", "info");
            }
            setIsCompareModalOpen(true);
          }}
          onOpenDeconstruction={() => setIsDeconstructionOpen(true)}
        />

        {isDeconstructionOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-2 backdrop-blur-xl sm:p-6">
            <div className="relative max-h-[96vh] w-full max-w-6xl">
              <CinematicProductDeconstruction
                onClose={() => setIsDeconstructionOpen(false)}
                productName={selectedProductModal?.name || "ساعة ذكية AMOLED Ultra 8"}
                productImage={selectedProductModal?.image}
                category={selectedProductModal?.category}
                product={selectedProductModal || undefined}
              />
            </div>
          </div>
        ) : null}

        <CartDrawer
          isOpen={isCartDrawerOpen}
          onClose={() => setIsCartDrawerOpen(false)}
          cartItems={cartItems}
          currency={currency}
          onUpdateQuantity={(productId, quantity) => setQtyCartStore(productId, quantity)}
          onRemoveItem={(productId) => removeFromCartStore(productId)}
          onCheckout={(discount) => {
            setAppliedCouponDiscount(discount);
            setIsCartDrawerOpen(false);
            setIsCheckoutModalOpen(true);
          }}
        />

        <CheckoutModal
          isOpen={isCheckoutModalOpen}
          onClose={() => setIsCheckoutModalOpen(false)}
          cartItems={cartItems}
          currency={currency}
          couponDiscountPercent={appliedCouponDiscount}
          onOrderPlaced={handleOrderPlaced}
        />
        <OrderTrackerModal isOpen={isTrackerModalOpen} onClose={() => setIsTrackerModalOpen(false)} allOrders={userOrders} currency={currency} />
        <NotificationsModal isOpen={isNotificationsModalOpen} onClose={() => setIsNotificationsModalOpen(false)} notifications={notifications} onMarkAllAsRead={() => setNotifications((current) => current.map((notification) => ({ ...notification, read: true })))} />
        <AccountDrawer
          isOpen={isAccountDrawerOpen}
          onClose={() => setIsAccountDrawerOpen(false)}
          currency={currency}
          onSelectCurrency={setCurrency}
          userOrders={userOrders}
          favoritesCount={favorites.length}
          onOpenWishlist={() => setIsWishlistDrawerOpen(true)}
          onOpenTracker={() => setIsTrackerModalOpen(true)}
          onOpenAdmin={() => setIsAdminOpen(true)}
        />
        {isAdminOpen ? <AdminPanel products={products} orders={userOrders} currency={currency} onClose={() => setIsAdminOpen(false)} /> : null}
        <WishlistDrawer
          isOpen={isWishlistDrawerOpen}
          favorites={favorites}
          products={products}
          currency={currency}
          onClose={() => setIsWishlistDrawerOpen(false)}
          onToggleFavorite={handleToggleFavorite}
          onAddToCart={(product, quantity) => {
            handleAddToCart(product, quantity);
            showToast(`تمت إضافة ${product.name} إلى السلة بنجاح 🛒`);
          }}
          onSelectProduct={(product) => {
            setIsWishlistDrawerOpen(false);
            selectProduct(product);
          }}
        />
        <ProductCompareModal
          isOpen={isCompareModalOpen}
          compareList={compareList}
          products={products}
          currency={currency}
          onClose={() => setIsCompareModalOpen(false)}
          onRemoveFromCompare={(id) => {
            setCompareList((current) => current.filter((item) => item.id !== id));
            showToast("تمت إزالة المنتج من المقارنة");
          }}
          onAddToCart={(product, quantity) => {
            handleAddToCart(product, quantity);
            showToast(`تمت إضافة ${product.name} إلى السلة بنجاح 🛒`);
          }}
        />
      </div>
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
        <div data-testid="hero-banner" className="relative mx-2 my-2 overflow-hidden rounded-[32px] border border-white/10 bg-surface shadow-2xl sm:mx-4">
          {hero.bannerImageUrl ? <img src={hero.bannerImageUrl} alt={hero.title || "البنر الرئيسي"} className="h-[50vh] min-h-[350px] w-full object-cover" /> : <div className="flex h-[50vh] min-h-[350px] w-full items-center justify-center bg-gradient-to-r from-primary/30 to-secondary/30" />}
          <div className="absolute inset-0 flex flex-col justify-end space-y-3 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-6 text-start sm:p-10">
            {hero.badgeText ? <span className="inline-block self-start rounded-full border border-primary/40 bg-primary/30 px-3.5 py-1 text-xs font-bold text-primary">{hero.badgeText}</span> : null}
            <h1 className="text-2xl font-black leading-tight text-white sm:text-4xl">{hero.title}</h1>
            <p className="max-w-xl text-xs text-gray-200 sm:text-sm">{hero.subtitle}</p>
            {hero.ctaText ? <a href={hero.ctaLink || "/offers"} className="inline-flex self-start items-center gap-2 rounded-full bg-primary px-6 py-3 text-xs font-bold text-white shadow-brand transition hover:bg-primary/90">{hero.ctaText}</a> : null}
          </div>
        </div>
      );
    case "video":
      return (
        <div data-testid="hero-video" className="relative mx-2 my-2 min-h-[400px] overflow-hidden rounded-[32px] border border-white/10 bg-black shadow-2xl sm:mx-4">
          {hero.bannerVideoUrl ? <video src={hero.bannerVideoUrl} autoPlay loop muted playsInline className="absolute inset-0 h-full w-full object-cover opacity-60" /> : <div className="absolute inset-0 bg-gradient-to-r from-cyan-900/40 to-blue-900/40" />}
          <div className="relative z-10 flex min-h-[400px] flex-col items-center justify-center space-y-4 p-8 text-center sm:p-14">
            {hero.badgeText ? <span className="rounded-full border border-cyan-500/30 bg-cyan-500/20 px-4 py-1 text-xs font-bold text-cyan-400">{hero.badgeText}</span> : null}
            <h1 className="text-3xl font-black tracking-tight text-white sm:text-5xl">{hero.title}</h1>
            <p className="max-w-lg text-sm text-gray-300 sm:text-base">{hero.subtitle}</p>
            {hero.ctaText ? <a href={hero.ctaLink || "/offers"} className="inline-flex items-center gap-2 rounded-full bg-cyan-400 px-7 py-3 text-xs font-black text-black shadow-lg transition hover:bg-cyan-300">{hero.ctaText}</a> : null}
          </div>
        </div>
      );
    case "slideshow":
      return (
        <div data-testid="hero-slideshow" className="relative mx-2 my-2 overflow-hidden rounded-[32px] border border-white/10 bg-surface shadow-2xl sm:mx-4">
          {hero.bannerImageUrl ? <img src={hero.bannerImageUrl} alt={hero.title || "البنر الرئيسي"} className="h-[50vh] min-h-[350px] w-full object-cover" /> : <div className="flex h-[50vh] min-h-[350px] w-full items-center justify-center bg-gradient-to-r from-primary/30 to-secondary/30" />}
          <div className="absolute inset-0 flex flex-col justify-end space-y-3 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-6 text-start sm:p-10">
            {hero.badgeText ? <span className="inline-block self-start rounded-full border border-primary/40 bg-primary/30 px-3.5 py-1 text-xs font-bold text-primary">{hero.badgeText}</span> : null}
            <h1 className="text-2xl font-black leading-tight text-white sm:text-4xl">{hero.title}</h1>
            <p className="max-w-xl text-xs text-gray-200 sm:text-sm">{hero.subtitle}</p>
            {hero.ctaText ? <a href={hero.ctaLink || "/offers"} className="inline-flex self-start items-center gap-2 rounded-full bg-primary px-6 py-3 text-xs font-bold text-white shadow-brand transition hover:bg-primary/90">{hero.ctaText}</a> : null}
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

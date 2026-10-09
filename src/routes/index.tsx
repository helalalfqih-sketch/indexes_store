import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { X } from "lucide-react";
import { z } from "zod";
import type { LegacyProductShape } from "@/lib/data-adapter";
import type { Product as ProductionProduct } from "@/lib/store-data";
import { useCart } from "@/lib/cart-store";
import { useFavorites } from "@/lib/use-favorites";
import { bestSellersQuery, offersQuery } from "@/lib/queries/catalog";
import { checkoutProductRefFromCatalogProduct } from "@/lib/checkout-product-contract";

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
import { MainMenu } from "@/components/main-menu";
import { MobileReferenceHeader } from "@/components/storefront/MobileReferenceHeader";
import { ShippingBanner } from "@/components/storefront/ShippingBanner";
import { VisualCategoryCircles } from "@/components/storefront/VisualCategoryCircles";
import { SheinPromoGrid } from "@/components/storefront/SheinPromoGrid";
import { FlashDealsSection } from "@/components/storefront/FlashDealsSection";
import { AppDownloadModal } from "@/components/storefront/AppDownloadModal";
import { AppInstallBanner } from "@/components/app-install-banner";
import { CategoryBar, type PriceRangePreset } from "@/components/storefront/CategoryBar";
import { BestOffersSection } from "@/components/storefront/BestOffersSection";
import { InfiniteStorefrontCatalog } from "@/components/storefront/InfiniteStorefrontCatalog";
import { TrustBar } from "@/components/storefront/TrustBar";
import { StoreFooter } from "@/components/storefront/StoreFooter";
import { BottomNav } from "@/components/storefront/BottomNav";
import { FloatingWhatsAppButton } from "@/components/storefront/FloatingWhatsAppButton";
import { useAppearance } from "@/components/appearance-provider";
import { useStorefrontTheme } from "@/components/storefront-theme-context";
import { mapPublishedStorefrontSettings } from "@/lib/adapters/storefront-settings.adapter";
import { HeroCarouselSkeleton, ProductGridSkeleton } from "@/components/storefront/SkeletonLoader";

import { ProductDetailModal } from "@/components/storefront/ProductDetailModal";
import { CinematicProductDeconstruction } from "@/components/storefront/CinematicProductDeconstruction";
import { CartDrawer } from "@/components/storefront/CartDrawer";
import { CheckoutModal } from "@/components/storefront/CheckoutModal";
import { OrderTrackerModal } from "@/components/storefront/OrderTrackerModal";
import { NotificationsModal } from "@/components/storefront/NotificationsModal";
import { WishlistDrawer } from "@/components/storefront/WishlistDrawer";
import { ProductCompareModal } from "@/components/storefront/ProductCompareModal";
import { ToastNotification } from "@/components/storefront/ToastNotification";
import { RecentlyViewedStrip } from "@/components/storefront/RecentlyViewedStrip";
import { ProductStoryModal } from "@/components/storefront/ProductStoryModal";
import { ProductUniverseModal } from "@/components/storefront/ProductUniverseModal";
import { CartShareModal } from "@/components/storefront/CartShareModal";
import { CustomerSupportHub } from "@/components/storefront/CustomerSupportHub";
import type { SupportContext } from "@/components/storefront/CustomerSupportHub";
import { supabase } from "@/integrations/supabase/client";
import {
  AddToCartAnimationOverlay,
  type FlyingCartItem,
} from "@/components/storefront/AddToCartAnimation";

const homeSearchParamsSchema = z.object({
  category: z.string().trim().max(255).optional(),
  sort: z.enum(["default", "price-high", "price-low", "best-selling", "newest"]).optional(),
  price: z.enum(["all", "under-20k", "20k-50k", "over-50k", "custom"]).optional(),
  minPrice: z.number().nonnegative().optional(),
  maxPrice: z.number().nonnegative().optional(),
  brands: z.array(z.string().trim().max(80)).max(20).optional(),
});

type HomeSearchParams = z.infer<typeof homeSearchParamsSchema>;

export const Route = createFileRoute("/")({
  validateSearch: (search) => homeSearchParamsSchema.parse(search),
  head: () => ({
    meta: [
      { title: "متجر إندكس — INDEXES STORE | التسوق الإلكتروني الفاخر في اليمن" },
      {
        name: "description",
        content:
          "تصفح منتجات متجر إندكس المتاحة مع الأسعار والمخزون المسجلين، وراجع رسوم الشحن قبل تأكيد الطلب.",
      },
      { property: "og:title", content: "متجر إندكس — INDEXES STORE" },
      {
        property: "og:description",
        content: "تصفح المنتجات والأسعار والتوفر، وراجع رسوم الشحن في السلة.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        name: "impact-site-verification",
        value: "7a93fca2-24d7-4478-b1c6-865114269bdf",
        content: "7a93fca2-24d7-4478-b1c6-865114269bdf",
      },
    ],
  }),
  errorComponent: () => (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center dir-rtl">
      <p className="text-lg font-bold text-rose-500">تعذر تحميل المنتجات مؤقتًا</p>
      <p className="text-sm text-[var(--color-text-secondary)]">
        حاول تحديث الصفحة أو العودة لاحقًا.
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="mt-2 rounded-xl bg-[#2F6BFF] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#2458D8]"
      >
        إعادة المحاولة
      </button>
    </div>
  ),
  pendingComponent: HomeSkeleton,
  component: HomePage,
});

function HomeSkeleton() {
  return (
    <div dir="rtl" className="min-h-screen space-y-6 bg-[var(--ix-bg)] p-4 text-[var(--ix-text)]">
      <HeroCarouselSkeleton />
      <ProductGridSkeleton count={8} />
    </div>
  );
}

function HomePage() {
  const navigate = useNavigate();
  const homeSearch = Route.useSearch();
  const { settings: rawAppearanceSettings } = useAppearance();
  const mappedSettings = useMemo(
    () => mapPublishedStorefrontSettings(rawAppearanceSettings),
    [rawAppearanceSettings],
  );

  // These are client queries, not route-loader data. Starting them during SSR
  // leaves pending external Shopify/Supabase promises in the dehydrated query
  // cache and can keep the response stream open during provider outages.
  const clientCatalogEnabled = typeof window !== "undefined";
  const { data: bestSellers = [], isLoading: bestSellersLoading } = useQuery({
    ...bestSellersQuery(12),
    enabled: clientCatalogEnabled,
  });
  const { data: dailyDeals = [], isLoading: dailyDealsLoading } = useQuery({
    ...offersQuery(8),
    enabled: clientCatalogEnabled,
  });
  // Keep the SSR and initial hydration trees identical: disabled queries are
  // not reported as loading by React Query on the server.
  const catalogLoading = !clientCatalogEnabled || bestSellersLoading || dailyDealsLoading;

  // Map production products to AI Studio design products
  const rawProductList = useMemo(() => {
    const unique = new Map<string, LegacyProductShape>();
    [...dailyDeals, ...bestSellers].forEach((product) => unique.set(product.id, product));
    return [...unique.values()];
  }, [dailyDeals, bestSellers]);

  const rawProductMap = useMemo(() => {
    const map = new Map<string, LegacyProductShape>();
    (rawProductList as LegacyProductShape[]).forEach((p) => {
      map.set(p.id, p);
    });
    return map;
  }, [rawProductList]);

  const products: DesignProduct[] = useMemo(() => {
    return (rawProductList as (LegacyProductShape | ProductionProduct)[]).map((p) =>
      mapProductionProductToDesignProduct(p),
    );
  }, [rawProductList]);

  // Real production cart & favorites hooks
  const cartStoreItems = useCart((s) => s.items);
  const cartStoreCount = cartStoreItems.reduce((count, item) => count + item.qty, 0);
  const addToCartStore = useCart((s) => s.add);
  const setQtyCartStore = useCart((s) => s.setQty);
  const removeFromCartStore = useCart((s) => s.remove);

  const { favorites, toggleFavorite } = useFavorites();

  // Map Zustand cart lines to design CartItem[] for CartDrawer & CheckoutModal views
  const cartItems: CartItem[] = useMemo(() => {
    return cartStoreItems.map((item) => {
      const foundRaw = rawProductMap.get(item.productId);
      const designProd = foundRaw
        ? mapProductionProductToDesignProduct(foundRaw)
        : {
            id: item.productId,
            checkoutProductRef:
              item.checkoutProductRef ??
              checkoutProductRefFromCatalogProduct({
                id: item.productId,
                shopify_variant_id: item.variantId,
              }),
            shopifyVariantId: item.variantId ?? null,
            name: item.name,
            subtitle: item.name,
            description: item.name,
            priceYER: item.price,
            originalPriceYER: item.price,
            rating: 0,
            reviewsCount: 0,
            image: item.image,
            category: "all",
            inStock: true,
          };
      return {
        product: designProd,
        quantity: item.qty,
      };
    });
  }, [cartStoreItems, rawProductMap]);

  const { mode: theme, toggleMode: toggleTheme } = useStorefrontTheme();

  // Admin navigation via TanStack router — the /admin route has its own AdminGate
  const handleOpenAdmin = useCallback(() => navigate({ to: "/admin" }), [navigate]);

  // Admin role check: verify confirmed role 'admin' or 'owner' in Supabase user_roles
  const [isAdminUser, setIsAdminUser] = useState<boolean>(false);
  useEffect(() => {
    if (!supabase) return;
    const checkAdminRole = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const session = data.session;
        if (!session?.user) {
          setIsAdminUser(false);
          return;
        }
        const { data: roleRows } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id);
        const roles = (roleRows ?? []).map((r: { role: string }) => r.role);
        setIsAdminUser(roles.includes("admin") || roles.includes("owner"));
      } catch {
        setIsAdminUser(false);
      }
    };
    checkAdminRole();
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      checkAdminRole();
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // UI State
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const selectedCategory = homeSearch.category || "all";
  const [searchQuery, setSearchQuery] = useState<string>("");
  const currency: Currency = "YER";
  const [activeTab, setActiveTab] = useState<ActiveTab>("home");
  const sortBy: SortOption = homeSearch.sort || "default";
  const priceRange: PriceRangePreset = homeSearch.price || "all";
  const customMinPrice = homeSearch.minPrice;
  const customMaxPrice = homeSearch.maxPrice;
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const selectedBrands = homeSearch.brands || [];

  const updateHomeSearch = useCallback(
    (patch: Partial<HomeSearchParams>) =>
      navigate({ to: "/", search: { ...homeSearch, ...patch }, replace: true }),
    [homeSearch, navigate],
  );
  const setSortBy = (sort: SortOption) =>
    updateHomeSearch({ sort: sort === "default" ? undefined : sort });

  // Category change loading feedback
  const handleSelectCategoryWithLoading = (catId: string) => {
    setIsLoading(true);
    void updateHomeSearch({ category: catId === "all" ? undefined : catId });
    setTimeout(() => setIsLoading(false), 250);
  };

  const [compareList, setCompareList] = useState<DesignProduct[]>([]);
  const [userOrders, setUserOrders] = useState<OrderStatus[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: "notif-1",
      title: "مرحباً بك في متجر إندكس 🎉",
      message: "تصفح المنتجات المتاحة، وستظهر رسوم الشحن الفعلية قبل تأكيد الطلب.",
      time: "منذ قليل",
      read: false,
      type: "offer",
    },
  ]);

  // Toast Notification State
  const [toasts, setToasts] = useState<
    { id: string; type: "success" | "error" | "info"; message: string }[]
  >([]);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    const id = "toast-" + Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Modal / Drawer States
  const [selectedProductModal, setSelectedProductModal] = useState<DesignProduct | null>(null);
  const [isDeconstructionOpen, setIsDeconstructionOpen] = useState<boolean>(false);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isTrackerModalOpen, setIsTrackerModalOpen] = useState(false);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [isWishlistDrawerOpen, setIsWishlistDrawerOpen] = useState(false);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [isProductStoryOpen, setIsProductStoryOpen] = useState(false);
  const [isProductUniverseOpen, setIsProductUniverseOpen] = useState(false);
  const [isCartShareOpen, setIsCartShareOpen] = useState(false);
  const [isSupportHubOpen, setIsSupportHubOpen] = useState(false);
  const [isAppDownloadModalOpen, setIsAppDownloadModalOpen] = useState(false);
  const [supportContext, setSupportContext] = useState<SupportContext>("home");
  const [recentlyViewed, setRecentlyViewed] = useState<DesignProduct[]>([]);

  const [appliedCouponDiscount, setAppliedCouponDiscount] = useState(0);

  // AddToCart animation state
  const [activeFlyingItems, setActiveFlyingItems] = useState<FlyingCartItem[]>([]);
  const [lastAddedProduct, setLastAddedProduct] = useState<{
    product: DesignProduct;
    quantity: number;
    selectedColor?: string;
    timestamp: number;
  } | null>(null);
  const flyingIdRef = useRef(0);

  const unreadNotificationsCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  const bestOffers = useMemo(
    () => products.filter((p) => p.isBestOffer && p.originalPriceYER > p.priceYER),
    [products],
  );

  // Track recently viewed products (max 10) and open the full cinematic product route.
  // The modal remains as a safe fallback for legacy products that do not have a slug.
  const handleSelectProduct = (product: DesignProduct) => {
    setRecentlyViewed((prev) => {
      const filtered = prev.filter((p) => p.id !== product.id);
      return [product, ...filtered].slice(0, 10);
    });

    if (product.slug) {
      navigate({ to: "/product/$slug", params: { slug: product.slug } });
      return;
    }

    setSelectedProductModal(product);
  };

  // Handlers using real production cart and favorites
  const handleToggleFavorite = (product: DesignProduct) => {
    toggleFavorite(product.id);
  };

  const handleAddToCart = (product: DesignProduct, quantity: number = 1, e?: React.MouseEvent) => {
    // Trigger flying particle animation & toast
    const id = `flying-${Date.now()}-${flyingIdRef.current++}`;
    const startX = e?.clientX || window.innerWidth / 2;
    const startY = e?.clientY || window.innerHeight / 2;
    setActiveFlyingItems((prev) => [...prev, { id, product, startX, startY }]);
    setLastAddedProduct({ product, quantity, timestamp: Date.now() });

    const raw = rawProductMap.get(product.id) || {
      id: product.id,
      slug: product.id,
      checkoutProductRef:
        product.checkoutProductRef ?? checkoutProductRefFromCatalogProduct(product),
      shopifyVariantId: product.shopifyVariantId ?? null,
      name: product.name,
      description: product.description,
      price: product.priceYER,
      oldPrice: product.originalPriceYER > product.priceYER ? product.originalPriceYER : undefined,
      stock: product.inStock ? Math.max(1, product.stockCount ?? 1) : 0,
      image: product.image,
      rating: product.rating,
      reviews: product.reviewsCount,
      categoryId: product.category,
    };
    addToCartStore(raw, quantity);
  };

  const handleUpdateCartQuantity = (productId: string, quantity: number) => {
    setQtyCartStore(productId, quantity);
  };

  const handleRemoveCartItem = (productId: string) => {
    removeFromCartStore(productId);
  };

  const handleOrderPlaced = (newOrder: OrderStatus) => {
    setUserOrders((prev) => [newOrder, ...prev]);

    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        title: `تم ثبت طلبك برقم #${newOrder.orderNumber}`,
        message: "تم حفظ طلبك وسيتم التواصل معك لتأكيد التوصيل.",
        time: "الآن",
        read: false,
        type: "order",
      },
      ...prev,
    ]);
  };

  const handleMarkAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleBottomNavTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
    if (tab === "cart") {
      setIsCartDrawerOpen(true);
    } else if (tab === "account") {
      navigate({ to: "/account" });
    } else if (tab === "search") {
      navigate({ to: "/search", search: { q: "" } });
    } else if (tab === ("categories" as ActiveTab)) {
      setIsMenuOpen(true);
    }
  };

  return (
    <div className="dir-rtl relative flex min-h-screen flex-col overflow-x-hidden bg-[var(--ix-bg)] pb-20 text-right font-sans text-[var(--ix-text)] transition-colors duration-200 selection:bg-[var(--ix-primary)] selection:text-white md:pb-28">
      {/* Global Toast Notifications */}
      <ToastNotification toasts={toasts} onDismiss={handleDismissToast} />
      <MainMenu open={isMenuOpen} onOpenChange={setIsMenuOpen} />

      {/* Foreground Store Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Keep the install prompt and full desktop header off the reference mobile layout. */}
        <div className="hidden md:block">
          <AppInstallBanner />
        </div>

        <div className="hidden md:block">
          {/* 1. Sticky Header */}
          <Header
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSubmitSearch={(query) => navigate({ to: "/search", search: { q: query } })}
            cartCount={cartStoreCount}
            unreadNotificationsCount={unreadNotificationsCount}
            wishlistCount={favorites.length}
            compareCount={compareList.length}
            products={products}
            currency={currency}
            theme={theme}
            onToggleTheme={toggleTheme}
            onOpenCart={() => setIsCartDrawerOpen(true)}
            onOpenNotifications={() => setIsNotificationsModalOpen(true)}
            onOpenWishlist={() => setIsWishlistDrawerOpen(true)}
            onOpenCompare={() => setIsCompareModalOpen(true)}
            onOpenMenu={() => setIsMenuOpen(true)}
            onOpenTracker={() => setIsTrackerModalOpen(true)}
            onOpenAdmin={handleOpenAdmin}
            isAdminUser={isAdminUser}
            onSelectProduct={handleSelectProduct}
            onOpenAppDownload={() => setIsAppDownloadModalOpen(true)}
            selectedCategory={selectedCategory}
            onSelectCategory={handleSelectCategoryWithLoading}
          />
        </div>

        <MobileReferenceHeader
          selectedCategory={selectedCategory}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSubmitSearch={() => navigate({ to: "/search", search: { q: searchQuery.trim() } })}
          cartCount={cartStoreCount}
          unreadNotificationsCount={unreadNotificationsCount}
          onOpenCart={() => setIsCartDrawerOpen(true)}
          onOpenNotifications={() => setIsNotificationsModalOpen(true)}
          onOpenMenu={() => setIsMenuOpen(true)}
          onOpenWishlist={() => setIsWishlistDrawerOpen(true)}
          onSelectCategory={handleSelectCategoryWithLoading}
        />

        {/* 2. Top Shipping Announcement Banner */}
        <div className="hidden md:block">
          <ShippingBanner
            onOpenShippingInfo={() => setIsTrackerModalOpen(true)}
            shippingConfig={mappedSettings.shipping}
          />
        </div>

        <main className="mx-auto w-full max-w-[1180px] flex-grow pb-28 sm:pb-32">
          {mappedSettings.sections.sectionOrder.map((sectionKey) => {
            switch (sectionKey) {
              case "hero":
                if (!mappedSettings.hero.enabled) return null;
                return (
                  <div key="hero-shein-block" className="space-y-2">
                    <SheinPromoGrid
                      products={products}
                      currency={currency}
                      onShopNow={() =>
                        document
                          .getElementById("store-products")
                          ?.scrollIntoView({ behavior: "smooth" })
                      }
                      onSelectCategory={handleSelectCategoryWithLoading}
                      onSelectProduct={handleSelectProduct}
                    />

                    {/* SHEIN Visual Category Circles */}
                    <VisualCategoryCircles
                      selectedCategoryId={selectedCategory}
                      onSelectCategory={handleSelectCategoryWithLoading}
                      products={products}
                    />

                    <div
                      className="mx-2 mt-3 grid grid-cols-4 gap-1 rounded-xl border border-[var(--ix-line)] bg-[var(--ix-surface)] p-1 text-[10px] font-black shadow-sm md:hidden"
                      role="navigation"
                      aria-label="تصفية المنتجات السريعة"
                    >
                      {[
                        { label: "المنتجات", sortBy: "bestselling" as const },
                        { label: "وصل حديثاً", sortBy: "latest" as const },
                        { label: "العروض", sortBy: "bestselling" as const, dealsOnly: true },
                        { label: "الأقل سعراً", sortBy: "price_asc" as const },
                      ].map((item) => (
                        <button
                          type="button"
                          key={item.label}
                          onClick={() =>
                            navigate({
                              to: "/search",
                              search: {
                                sortBy: item.sortBy,
                                dealsOnly: item.dealsOnly,
                              },
                            })
                          }
                          className="rounded-lg px-1 py-2 text-[var(--ix-text)] transition-colors hover:bg-[var(--color-primary-ui-soft)] hover:text-[var(--ix-primary-contrast)]"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>

                    {/* SHEIN Flash Deals Section with live countdown */}
                    <div className="hidden md:block">
                      <FlashDealsSection
                        products={bestOffers}
                        currency={currency}
                        onSelectProduct={handleSelectProduct}
                        onAddToCart={(prod) => {
                          handleAddToCart(prod, 1);
                          showToast(`تمت إضافة ${prod.name} إلى السلة ⚡`);
                        }}
                      />
                    </div>
                  </div>
                );

              case "discovery":
                return null;

              case "recently_viewed":
                if (recentlyViewed.length === 0) return null;
                return (
                  <RecentlyViewedStrip
                    key="recently_viewed"
                    products={recentlyViewed}
                    currency={currency}
                    onSelectProduct={handleSelectProduct}
                    onClearHistory={() => setRecentlyViewed([])}
                  />
                );

              case "categories":
                if (!mappedSettings.sections.categories.enabled) return null;
                return (
                  <div key="categories" data-section="categories" className="hidden md:block">
                    <CategoryBar
                      selectedCategoryId={selectedCategory}
                      onSelectCategory={handleSelectCategoryWithLoading}
                      selectedSort={sortBy}
                      onSelectSort={(sortOption) => setSortBy(sortOption)}
                      selectedPriceRange={priceRange}
                      customMinPrice={customMinPrice}
                      customMaxPrice={customMaxPrice}
                      onSelectPriceRange={(range, min, max) => {
                        void updateHomeSearch({
                          price: range === "all" ? undefined : range,
                          minPrice: range === "custom" ? min : undefined,
                          maxPrice: range === "custom" ? max : undefined,
                        });
                      }}
                      selectedBrands={selectedBrands}
                      onSelectBrands={(brands) =>
                        void updateHomeSearch({ brands: brands.length ? brands : undefined })
                      }
                      onResetFilters={() =>
                        void updateHomeSearch({
                          category: undefined,
                          sort: undefined,
                          price: undefined,
                          minPrice: undefined,
                          maxPrice: undefined,
                          brands: undefined,
                        })
                      }
                    />
                  </div>
                );

              case "deals":
                if (!mappedSettings.sections.deals.enabled) return null;
                if (selectedCategory !== "all") return null;
                if (!catalogLoading && bestOffers.length === 0) return null;
                return (
                  <div key="deals" className="hidden md:block">
                    <BestOffersSection
                      key="deals"
                      bestOffers={bestOffers.slice(0, mappedSettings.sections.deals.limit)}
                      currency={currency}
                      favorites={favorites}
                      isLoading={isLoading || catalogLoading}
                      onToggleFavorite={handleToggleFavorite}
                      onAddToCart={(prod) => handleAddToCart(prod, 1)}
                      onSelectProduct={handleSelectProduct}
                      onViewAll={() => navigate({ to: "/offers" })}
                    />
                  </div>
                );

              case "ai_search":
                return null;

              case "cinematic":
                return null;

              case "latest":
                if (!mappedSettings.sections.latest.enabled) return null;
                return (
                  <div key="latest">
                    {/* Product Catalog Grid Section */}
                    <section id="store-products" className="scroll-mt-24 px-2 py-5 sm:px-6">
                      <div className="dir-rtl mb-6 hidden flex-col justify-between gap-3 border-b border-[var(--color-border-default)] pb-4 sm:flex-row sm:items-center md:flex">
                        <div>
                          <h2 className="text-xl font-bold text-[var(--color-text-primary)] sm:text-2xl">
                            {selectedCategory === "all"
                              ? mappedSettings.sections.latest.title || "جميع المنتجات المتوفرة"
                              : "منتجات القسم المختار"}
                          </h2>
                          <p className="mt-1 text-xs text-[var(--color-text-secondary)] sm:text-sm">
                            النتائج أدناه تستخدم السعر والتوفر المسجلين في الكتالوج
                          </p>
                        </div>
                        {sortBy !== "default" ? (
                          <div className="flex items-center gap-2 self-start sm:self-center">
                            <div className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-primary-border)] bg-[var(--color-primary-ui-soft)] px-3 py-1.5 text-xs font-black text-[var(--ix-primary-contrast)] shadow-sm">
                              <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--ix-primary)]" />
                              <span>
                                الترتيب المطبق:{" "}
                                {sortBy === "price-high"
                                  ? "الأعلى سعراً"
                                  : sortBy === "price-low"
                                    ? "الأقل سعراً"
                                    : sortBy === "best-selling"
                                      ? "الأكثر رواجاً"
                                      : "الأحدث وصولاً"}
                              </span>
                              <button
                                type="button"
                                onClick={() => setSortBy("default")}
                                className="cursor-pointer rounded-full p-1 text-[var(--ix-primary-contrast)] transition-colors hover:bg-rose-500/20 hover:text-rose-500"
                                title="إلغاء الترتيب والإعادة للافتراضي"
                                aria-label="إلغاء الترتيب"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ) : null}
                      </div>

                      <InfiniteStorefrontCatalog
                        selectedCategoryId={selectedCategory}
                        searchQuery=""
                        sortBy={sortBy}
                        priceRange={priceRange}
                        customMinPrice={customMinPrice}
                        customMaxPrice={customMaxPrice}
                        selectedBrands={selectedBrands}
                        selectedRatings={[]}
                        currency={currency}
                        favorites={favorites}
                        onToggleFavorite={handleToggleFavorite}
                        onAddToCart={(product) => handleAddToCart(product, 1)}
                        onSelectProduct={handleSelectProduct}
                      />
                    </section>
                  </div>
                );

              case "trustBadges":
                if (!mappedSettings.sections.trustBadges.enabled) return null;
                return (
                  <TrustBar key="trustBadges" trustBadges={mappedSettings.sections.trustBadges} />
                );

              case "loyalty":
                return null;

              default:
                return null;
            }
          })}

          {/* Footer */}
          <StoreFooter
            onOpenTracker={() => setIsTrackerModalOpen(true)}
            onOpenAdmin={handleOpenAdmin}
            onOpenSupport={() => setIsSupportHubOpen(true)}
            isAdminUser={isAdminUser}
            footerConfig={mappedSettings.contact}
          />
        </main>

        {/* 12. Bottom Navigation Bar */}
        <BottomNav
          activeTab={activeTab}
          setActiveTab={handleBottomNavTabChange}
          cartCount={cartStoreCount}
        />

        {/* Keep the reference mobile canvas clean; WhatsApp remains available in the footer and desktop support hub. */}
        <div className="hidden md:block">
          <FloatingWhatsAppButton
            isOpen={isSupportHubOpen}
            onToggle={() => setIsSupportHubOpen((open) => !open)}
          />
        </div>

        {/* Modals & Drawers */}
        <ProductDetailModal
          product={selectedProductModal}
          currency={currency}
          isFavorite={selectedProductModal ? favorites.includes(selectedProductModal.id) : false}
          onClose={() => setSelectedProductModal(null)}
          onAddToCart={(prod, qty) => {
            handleAddToCart(prod, qty);
            showToast(`تمت إضافة ${prod.name} إلى السلة بنجاح 🛒`);
          }}
          onToggleFavorite={(p) => {
            handleToggleFavorite(p);
            const isFavNow = !favorites.includes(p.id);
            showToast(
              isFavNow ? `تمت إضافة ${p.name} إلى المفضلة ❤️` : `تمت إزالة ${p.name} من المفضلة`,
            );
          }}
          onAddToCompare={(prod) => {
            if (!compareList.some((c) => c.id === prod.id)) {
              setCompareList((prev) => [...prev, prod]);
              showToast(`تمت إضافة ${prod.name} إلى المقارنة ⚖️`);
            } else {
              showToast("هذا المنتج مضاف بالفعل في قائمة المقارنة", "info");
            }
            setIsCompareModalOpen(true);
          }}
          onOpenDeconstruction={() => setIsDeconstructionOpen(true)}
        />

        {/* Product Story Modal */}
        <ProductStoryModal
          product={selectedProductModal}
          currency={currency}
          isOpen={isProductStoryOpen}
          onClose={() => setIsProductStoryOpen(false)}
          onAddToCart={(prod) => {
            handleAddToCart(prod, 1);
            showToast(`تمت إضافة ${prod.name} إلى السلة بنجاح 🛒`);
          }}
        />

        {/* Product Universe Modal (3D WebGL Product Explorer) */}
        {isProductUniverseOpen && (
          <ProductUniverseModal
            isOpen={isProductUniverseOpen}
            onClose={() => setIsProductUniverseOpen(false)}
            products={products}
            currency={currency}
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
            onAddToCart={(prod, qty) => {
              handleAddToCart(prod, qty ?? 1);
              showToast(`تمت إضافة ${prod.name} إلى السلة بنجاح 🛒`);
            }}
            onSelectProductDetails={handleSelectProduct}
          />
        )}

        {/* Cart Share Modal */}
        <CartShareModal
          isOpen={isCartShareOpen}
          onClose={() => setIsCartShareOpen(false)}
          cartItems={cartItems}
          catalogProducts={products}
          onApplyRecoveredCart={(items) =>
            items.forEach((i) => handleAddToCart(i.product, i.quantity))
          }
        />

        {/* Customer Support Hub */}
        <CustomerSupportHub
          isOpen={isSupportHubOpen}
          onClose={() => setIsSupportHubOpen(false)}
          activeContext={supportContext}
          currentProduct={selectedProductModal}
          cartItems={cartItems}
          currency={currency}
          whatsappNumber={mappedSettings.contact.whatsappPhone}
          phone={mappedSettings.contact.phone}
          onOpenTracker={() => {
            setIsSupportHubOpen(false);
            setIsTrackerModalOpen(true);
          }}
          onOpenSearch={() => {
            setIsSupportHubOpen(false);
            window.scrollTo({ top: 400, behavior: "smooth" });
          }}
        />

        {/* Cinematic 3D Product Deconstruction Modal */}
        {isDeconstructionOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-black/90 backdrop-blur-xl animate-fadeIn">
            <div className="relative w-full max-w-6xl max-h-[96vh]">
              <CinematicProductDeconstruction
                onClose={() => setIsDeconstructionOpen(false)}
                productName={selectedProductModal?.name || "ساعة ذكية AMOLED Ultra 8"}
                productImage={selectedProductModal?.image}
                category={selectedProductModal?.category}
                product={selectedProductModal || undefined}
              />
            </div>
          </div>
        )}

        <CartDrawer
          currency={currency}
          isOpen={isCartDrawerOpen}
          onClose={() => setIsCartDrawerOpen(false)}
          cartItems={cartItems}
          onUpdateQuantity={handleUpdateCartQuantity}
          onRemoveItem={handleRemoveCartItem}
          onOpenShareCart={() => setIsCartShareOpen(true)}
          favorites={favorites}
          catalogProducts={products}
          onSaveForLater={(item) => {
            toggleFavorite(item.product.id);
            handleRemoveCartItem(item.product.id);
            showToast(`تم حفظ ${item.product.name} لوقت لاحق`);
          }}
          onAddRecommended={(product) => {
            handleAddToCart(product, 1);
            showToast(`تمت إضافة ${product.name} إلى السلة`);
          }}
          onCheckout={(discount) => {
            setAppliedCouponDiscount(discount);
            setIsCartDrawerOpen(false);
            setIsCheckoutModalOpen(true);
          }}
        />

        <CheckoutModal
          currency={currency}
          isOpen={isCheckoutModalOpen}
          onClose={() => setIsCheckoutModalOpen(false)}
          cartItems={cartItems}
          couponDiscountPercent={appliedCouponDiscount}
          onOrderPlaced={handleOrderPlaced}
        />

        <OrderTrackerModal
          isOpen={isTrackerModalOpen}
          onClose={() => setIsTrackerModalOpen(false)}
          allOrders={userOrders}
          currency={currency}
        />

        <NotificationsModal
          isOpen={isNotificationsModalOpen}
          onClose={() => setIsNotificationsModalOpen(false)}
          notifications={notifications}
          onMarkAllAsRead={handleMarkAllNotificationsRead}
        />

        <WishlistDrawer
          isOpen={isWishlistDrawerOpen}
          favorites={favorites}
          products={products}
          currency={currency}
          onClose={() => setIsWishlistDrawerOpen(false)}
          onToggleFavorite={handleToggleFavorite}
          onAddToCart={(p, qty) => {
            handleAddToCart(p, qty);
            showToast(`تمت إضافة ${p.name} إلى السلة بنجاح 🛒`);
          }}
          onSelectProduct={(p) => {
            setIsWishlistDrawerOpen(false);
            setSelectedProductModal(p);
          }}
        />

        <ProductCompareModal
          isOpen={isCompareModalOpen}
          compareList={compareList}
          products={products}
          currency={currency}
          onClose={() => setIsCompareModalOpen(false)}
          onRemoveFromCompare={(id) => {
            setCompareList((prev) => prev.filter((item) => item.id !== id));
            showToast("تمت إزالة المنتج من المقارنة");
          }}
          onAddToCart={(p, qty) => {
            handleAddToCart(p, qty);
            showToast(`تمت إضافة ${p.name} إلى السلة بنجاح 🛒`);
          }}
        />

        {/* App Download QR & Store Modal */}
        <AppDownloadModal
          isOpen={isAppDownloadModalOpen}
          onClose={() => setIsAppDownloadModalOpen(false)}
        />

        {/* Flying Cart Item & Toast Overlay */}
        <AddToCartAnimationOverlay
          activeFlyingItems={activeFlyingItems}
          onAnimationComplete={(id) =>
            setActiveFlyingItems((prev) => prev.filter((item) => item.id !== id))
          }
          onOpenCart={() => setIsCartDrawerOpen(true)}
          lastAddedProduct={lastAddedProduct}
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

import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState, useMemo, useEffect } from "react";
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
import { CategoryBar } from "@/components/storefront/CategoryBar";
import { ProductCard } from "@/components/storefront/ProductCard";
import { TrustBar } from "@/components/storefront/TrustBar";
import { LoyaltyBanner } from "@/components/storefront/LoyaltyBanner";
import { StoreFooter } from "@/components/storefront/StoreFooter";
import { BottomNav } from "@/components/storefront/BottomNav";
import { AmbientBackground } from "@/components/storefront/AmbientBackground";
import { FloatingWhatsAppButton } from "@/components/storefront/FloatingWhatsAppButton";
import {
  ProductCardSkeleton,
  HeroCarouselSkeleton,
  ProductGridSkeleton,
} from "@/components/storefront/SkeletonLoader";

import { ProductDetailModal } from "@/components/storefront/ProductDetailModal";
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
    <div className="p-8 text-center text-rose-500 font-bold dir-rtl">حدث خطأ: {error.message}</div>
  ),
  pendingComponent: HomeSkeleton,
  component: HomePage,
});

function HomeSkeleton() {
  return (
    <div dir="rtl" className="min-h-screen bg-[#08060F] text-white p-4 space-y-6">
      <HeroCarouselSkeleton />
      <ProductGridSkeleton count={8} />
    </div>
  );
}

function HomePage() {
  const { data: bestSellers } = useSuspenseQuery(bestSellersQuery(20));
  const { data: dailyDeals } = useSuspenseQuery(offersQuery(20));
  const { data: allProducts } = useSuspenseQuery(globePoolQuery(100));

  // Map production products to AI Studio design products
  const rawProductList = useMemo(() => {
    return allProducts.length ? allProducts : dailyDeals.length ? dailyDeals : bestSellers;
  }, [allProducts, dailyDeals, bestSellers]);

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
  const cartStoreCount = useCart((s) => s.count());
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
      return {
        product: designProd,
        quantity: item.qty,
      };
    });
  }, [cartStoreItems, rawProductMap]);

  // Theme State
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window === "undefined") return "dark";
    const saved = localStorage.getItem("indexes_store_theme");
    if (saved === "dark" || saved === "light") return saved;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches
      ? "light"
      : "dark";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    if (theme === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
    localStorage.setItem("indexes_store_theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  // UI State
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currency, setCurrency] = useState<Currency>("YER");
  const [activeTab, setActiveTab] = useState<ActiveTab>("home");
  const [sortBy, setSortBy] = useState<SortOption>("default");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Category change loading feedback
  const handleSelectCategoryWithLoading = (catId: string) => {
    setIsLoading(true);
    setSelectedCategory(catId);
    setTimeout(() => setIsLoading(false), 250);
  };

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
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isTrackerModalOpen, setIsTrackerModalOpen] = useState(false);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [isAccountDrawerOpen, setIsAccountDrawerOpen] = useState(false);
  const [isWishlistDrawerOpen, setIsWishlistDrawerOpen] = useState(false);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  const [appliedCouponDiscount, setAppliedCouponDiscount] = useState(0);

  const unreadNotificationsCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  const bestOffers = useMemo(
    () => products.filter((p) => p.isBestOffer || (p.discountBadge && p.discountBadge.length > 0)),
    [products],
  );

  const filteredProducts = useMemo(() => {
    const list = products.filter((p) => {
      const matchCategory = selectedCategory === "all" || p.category === selectedCategory;
      const matchSearch =
        !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });

    switch (sortBy) {
      case "price-high":
        return [...list].sort((a, b) => b.priceYER - a.priceYER);
      case "price-low":
        return [...list].sort((a, b) => a.priceYER - b.priceYER);
      case "best-selling":
        return [...list].sort((a, b) => b.reviewsCount - a.reviewsCount);
      case "newest":
        return [...list].sort((a, b) => (b.isNewArrival ? 1 : 0) - (a.isNewArrival ? 1 : 0));
      case "default":
      default:
        return list;
    }
  }, [products, selectedCategory, searchQuery, sortBy]);

  // Handlers using real production cart and favorites
  const handleToggleFavorite = (product: DesignProduct) => {
    toggleFavorite(product.id);
  };

  const handleAddToCart = (product: DesignProduct, quantity: number = 1) => {
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
      setIsAccountDrawerOpen(true);
    } else if (tab === "search") {
      window.scrollTo({ top: 400, behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-[#08060F] text-white flex flex-col font-sans pb-28 selection:bg-[#7B3FFF] selection:text-white relative overflow-x-hidden transition-colors duration-200 dir-rtl text-right">
      {/* High-Tech Ambient Background in Empty Spaces */}
      <AmbientBackground />

      {/* Global Toast Notifications */}
      <ToastNotification toasts={toasts} onDismiss={handleDismissToast} />

      {/* Foreground Store Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* 1. Sticky Header */}
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
          onToggleTheme={toggleTheme}
          onOpenCart={() => setIsCartDrawerOpen(true)}
          onOpenNotifications={() => setIsNotificationsModalOpen(true)}
          onOpenWishlist={() => setIsWishlistDrawerOpen(true)}
          onOpenCompare={() => setIsCompareModalOpen(true)}
          onOpenMenu={() => setIsAccountDrawerOpen(true)}
          onOpenTracker={() => setIsTrackerModalOpen(true)}
          onOpenAdmin={() => setIsAdminOpen(true)}
          onSelectProduct={(p) => setSelectedProductModal(p)}
        />

        {/* 2. Top Shipping Announcement Banner */}
        <ShippingBanner onOpenShippingInfo={() => setIsTrackerModalOpen(true)} />

        {/* Main Container */}
        <main className="flex-grow w-full max-w-7xl mx-auto pb-28 sm:pb-32">
          {/* 3. Hero Carousel Banner ("عروض حصرية 50%") */}
          {isLoading ? (
            <HeroCarouselSkeleton />
          ) : (
            <HeroCarousel
              onSelectCategory={handleSelectCategoryWithLoading}
              onSelectProduct={(prod) => setSelectedProductModal(prod)}
            />
          )}

          {/* 4. 6-Category Grid & Filter/Sort Bar */}
          <CategoryBar
            selectedCategoryId={selectedCategory}
            onSelectCategory={handleSelectCategoryWithLoading}
            selectedSort={sortBy}
            onSelectSort={(sortOption) => setSortBy(sortOption)}
          />

          {/* 5. Best Offers Section (أفضل العروض 🔥) */}
          {selectedCategory === "all" && !searchQuery && (
            <section className="py-2 relative">
              <div className="px-4 sm:px-6 flex justify-between items-center mb-3">
                <h3 className="text-xl sm:text-2xl font-black flex items-center gap-2 text-white">
                  <span>أفضل العروض</span>
                  <span className="text-xl sm:text-2xl">🔥</span>
                </h3>
                <button
                  onClick={() => handleSelectCategoryWithLoading("all")}
                  className="text-[#7B3FFF] text-xs sm:text-sm flex items-center gap-1 font-bold hover:underline cursor-pointer"
                >
                  <span>عرض الكل</span>
                  <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                </button>
              </div>

              {/* Horizontal Snap Scroll / Responsive 4-Card Grid Container */}
              <div className="relative group/scroll">
                <div
                  id="best-offers-scroll"
                  className="px-3 sm:px-6 flex gap-3 sm:gap-4 overflow-x-auto no-scrollbar snap-x pb-2 pt-1"
                >
                  {isLoading
                    ? [1, 2, 3, 4].map((idx) => (
                        <ProductCardSkeleton key={idx} variant="horizontal" />
                      ))
                    : (bestOffers.length ? bestOffers : products.slice(0, 6)).map((product) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          currency={currency}
                          isFavorite={favorites.includes(product.id)}
                          onToggleFavorite={handleToggleFavorite}
                          onAddToCart={(prod) => handleAddToCart(prod, 1)}
                          onSelectProduct={(prod) => setSelectedProductModal(prod)}
                          variant="horizontal"
                        />
                      ))}
                </div>

                {/* Scroll Right Arrow Button */}
                <button
                  onClick={() => {
                    const el = document.getElementById("best-offers-scroll");
                    if (el) el.scrollBy({ left: -220, behavior: "smooth" });
                  }}
                  className="absolute right-1 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-[#100B1A]/95 border border-[#7B3FFF]/60 text-white flex items-center justify-center shadow-[0_0_15px_rgba(123,63,255,0.4)] hover:bg-[#7B3FFF] hover:border-purple-400 transition-all cursor-pointer"
                  aria-label="التمرير لليمين"
                >
                  <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                </button>

                {/* Pagination Dots Indicator */}
                <div className="flex items-center justify-center gap-1.5 mt-3">
                  <span className="w-5 h-1.5 bg-[#7B3FFF] rounded-full shadow-[0_0_8px_#7B3FFF]" />
                  <span className="w-1.5 h-1.5 bg-gray-700/80 rounded-full" />
                  <span className="w-1.5 h-1.5 bg-gray-700/80 rounded-full" />
                  <span className="w-1.5 h-1.5 bg-gray-700/80 rounded-full" />
                  <span className="w-1.5 h-1.5 bg-gray-700/80 rounded-full" />
                </div>
              </div>
            </section>
          )}

          {/* 6. AI-Powered Smart Search Section */}
          <AISearchSection
            currency={currency}
            onSelectProduct={(prod) => setSelectedProductModal(prod)}
            onSearchQuerySubmit={(q) => {
              setIsLoading(true);
              setSearchQuery(q);
              setTimeout(() => setIsLoading(false), 250);
            }}
          />

          {/* 7. Product Catalog Grid Section */}
          <section className="px-4 sm:px-6 py-6">
            <div className="flex justify-between items-center mb-6 border-b border-gray-800/80 pb-4">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-white">
                  {selectedCategory === "all"
                    ? searchQuery
                      ? `نتائج البحث عن "${searchQuery}"`
                      : "جميع المنتجات المتوفرة"
                    : "منتجات القسم المختار"}
                </h3>
                <p className="text-xs sm:text-sm text-gray-400 mt-1">
                  عرض {filteredProducts.length} منتجات أصلية مع ضمان متجر إندكس
                </p>
              </div>
            </div>

            {isLoading ? (
              <ProductGridSkeleton count={8} />
            ) : filteredProducts.length === 0 ? (
              <div className="py-16 text-center text-gray-400 bg-[#100B1A] rounded-3xl border border-gray-800">
                <span className="material-symbols-outlined text-[64px] text-gray-600 mb-2">
                  search_off
                </span>
                <p className="text-lg font-bold text-white">لم نتمكن من العثور على منتجات مطابقة</p>
                <p className="text-sm text-gray-500 mt-1">جرّب تغيير كلمة البحث أو قسم المنتجات.</p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    handleSelectCategoryWithLoading("all");
                  }}
                  className="mt-4 bg-[#7B3FFF] text-white px-6 py-2.5 rounded-2xl text-sm font-bold shadow-lg shadow-[#7B3FFF]/30 cursor-pointer"
                >
                  إعادة ضبط البحث
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    currency={currency}
                    isFavorite={favorites.includes(product.id)}
                    onToggleFavorite={handleToggleFavorite}
                    onAddToCart={(prod) => handleAddToCart(prod, 1)}
                    onSelectProduct={(prod) => setSelectedProductModal(prod)}
                    variant="grid"
                  />
                ))}
              </div>
            )}
          </section>

          {/* 9. Trust Features Bar */}
          <TrustBar />

          {/* 10. Loyalty Banner */}
          <LoyaltyBanner onOpenLoyaltyModal={() => setIsAccountDrawerOpen(true)} />

          {/* 11. Footer */}
          <StoreFooter onOpenTracker={() => setIsTrackerModalOpen(true)} />
        </main>

        {/* 12. Bottom Navigation Bar */}
        <BottomNav
          activeTab={activeTab}
          setActiveTab={handleBottomNavTabChange}
          cartCount={cartStoreCount}
        />

        {/* Floating WhatsApp Quick Contact Button */}
        <FloatingWhatsAppButton />

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
        />

        <CartDrawer
          isOpen={isCartDrawerOpen}
          onClose={() => setIsCartDrawerOpen(false)}
          cartItems={cartItems}
          currency={currency}
          onUpdateQuantity={handleUpdateCartQuantity}
          onRemoveItem={handleRemoveCartItem}
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

        {isAdminOpen && (
          <AdminPanel
            products={products}
            orders={userOrders}
            currency={currency}
            onClose={() => setIsAdminOpen(false)}
          />
        )}

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

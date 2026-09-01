import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  MapPin,
  MessageCircle,
  PackageSearch,
  Truck,
  Instagram,
  Facebook,
  Phone,
} from "lucide-react";
import { useAppearance } from "@/components/appearance-provider";
import { StoreBrand } from "@/components/brand/store-brand";
import { InfiniteStorefrontCatalog } from "@/components/storefront/InfiniteStorefrontCatalog";
import type { Product as DesignProduct, SortOption } from "@/components/storefront/types";
import type { Product as StoreProduct } from "@/lib/store-data";
import { useCart } from "@/lib/cart-store";
import { useFavorites } from "@/lib/use-favorites";
import { whatsappLink } from "@/lib/whatsapp";

export function SiteFooter({ isHome }: { isHome?: boolean }) {
  const { settings } = useAppearance();
  const location = useRouterState({ select: (state) => state.location });
  const navigate = useNavigate();
  const addToCart = useCart((state) => state.add);
  const { favorites, toggleFavorite } = useFavorites();
  const [alreadyRenderedIds, setAlreadyRenderedIds] = useState<string[]>([]);

  const rawSearch = location.search as Record<string, unknown>;
  const searchQuery = typeof rawSearch.q === "string" ? rawSearch.q : "";
  const selectedCategory =
    typeof rawSearch.category === "string" && rawSearch.category ? rawSearch.category : "all";
  const minPrice = typeof rawSearch.minPrice === "number" ? rawSearch.minPrice : undefined;
  const maxPrice = typeof rawSearch.maxPrice === "number" ? rawSearch.maxPrice : undefined;
  const dealsOnly = rawSearch.dealsOnly === true;
  const inStockOnly = rawSearch.inStockOnly === true;

  const infiniteSort = useMemo<SortOption | "rating">(() => {
    switch (rawSearch.sortBy) {
      case "price_asc":
        return "price-low";
      case "price_desc":
        return "price-high";
      case "latest":
        return "newest";
      case "rating":
        return "rating";
      case "bestselling":
        return "best-selling";
      default:
        return "default";
    }
  }, [rawSearch.sortBy]);

  useEffect(() => {
    if (location.pathname !== "/search") return;
    const frame = requestAnimationFrame(() => {
      const ids = Array.from(document.querySelectorAll<HTMLElement>("[data-product-id]"))
        .map((node) => node.dataset.productId)
        .filter((id): id is string => Boolean(id));
      setAlreadyRenderedIds([...new Set(ids)]);
    });
    return () => cancelAnimationFrame(frame);
  }, [location.pathname, searchQuery, selectedCategory, minPrice, maxPrice, dealsOnly, inStockOnly]);

  const handleAddToCart = (product: DesignProduct) => {
    const storeProduct: StoreProduct = {
      id: product.id,
      slug: product.slug || product.id,
      name: product.name,
      description: product.description,
      price: product.priceYER,
      oldPrice:
        product.originalPriceYER > product.priceYER ? product.originalPriceYER : undefined,
      stock: product.inStock === false ? 0 : Math.max(1, product.stockCount ?? 1),
      image: product.image,
      rating: product.rating,
      reviews: product.reviewsCount,
      categoryId: product.category,
    } as StoreProduct;
    addToCart(storeProduct, 1);
  };

  const storeName = settings.navigation.storeName || "اندكس ستور";
  const phone = settings.navigation.whatsappPhone || "967771370740";
  const address = settings.navigation.addressText;
  const deliveryInfo = settings.navigation.deliveryInfoText;
  const copyright = settings.navigation.copyrightText || "جميع الحقوق محفوظة";

  const waHref = whatsappLink("مرحباً، لدي استفسار عن " + storeName, phone);

  const socialLinks = settings.navigation.socialLinks;
  const hasSocialLinks =
    socialLinks &&
    (socialLinks.facebook || socialLinks.instagram || socialLinks.tiktok || socialLinks.twitter);

  return (
    <>
      {location.pathname === "/search" ? (
        <section className="mx-auto w-full max-w-7xl px-4 pb-4" aria-label="متابعة نتائج البحث">
          <InfiniteStorefrontCatalog
            selectedCategoryId={selectedCategory}
            searchQuery={searchQuery}
            sortBy={infiniteSort}
            priceRange={minPrice !== undefined || maxPrice !== undefined ? "custom" : "all"}
            customMinPrice={minPrice}
            customMaxPrice={maxPrice}
            selectedBrands={[]}
            selectedRatings={[]}
            dealsOnly={dealsOnly}
            inStockOnly={inStockOnly}
            currency="YER"
            favorites={favorites}
            excludeIds={alreadyRenderedIds}
            onToggleFavorite={(product) => toggleFavorite(product.id)}
            onAddToCart={handleAddToCart}
            onSelectProduct={(product) => {
              if (product.slug) {
                navigate({ to: "/product/$slug", params: { slug: product.slug } });
              }
            }}
          />
        </section>
      ) : null}

      <footer
        dir="rtl"
        className="mt-8 px-4 pb-6 pt-8"
        style={{
          background: isHome
            ? "linear-gradient(180deg, transparent 0%, rgba(6,10,24,0.6) 100%)"
            : undefined,
          fontFamily: "Tajawal, system-ui, sans-serif",
        }}
      >
        <div className="mx-auto flex max-w-lg flex-col gap-5 md:max-w-3xl">
          <div className="text-center">
            <StoreBrand
              size="md"
              nameClassName={isHome ? "text-showcase-foreground" : "text-primary"}
              taglineClassName={isHome ? "text-showcase-muted" : "text-muted-foreground"}
            />
          </div>

          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2.5 rounded-2xl py-3.5 text-sm font-black text-white shadow-lg transition-all hover:brightness-110"
            style={{
              background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
              boxShadow: "0 8px 24px -8px rgba(37,211,102,0.4)",
            }}
          >
            <MessageCircle className="h-5 w-5" />
            تواصل معنا عبر واتساب
          </a>

          <ul
            className={`flex flex-col gap-3 text-[12px] leading-relaxed ${isHome ? "text-slate-300" : "text-foreground"}`}
          >
            {phone && (
              <li className="flex items-start gap-2.5">
                <Phone className="mt-0.5 h-4 w-4 flex-shrink-0 text-purple-400" />
                <span>
                  للطلب والاستفسار:{" "}
                  <a
                    href={`tel:+${phone}`}
                    className="font-bold text-purple-400 underline-offset-2 hover:underline"
                  >
                    {phone}
                  </a>
                </span>
              </li>
            )}
            {address && (
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-purple-400" />
                <span>العنوان: {address}</span>
              </li>
            )}
            {deliveryInfo && (
              <li className="flex items-start gap-2.5">
                <Truck className="mt-0.5 h-4 w-4 flex-shrink-0 text-purple-400" />
                <span>{deliveryInfo}</span>
              </li>
            )}
            <li className="flex items-start gap-2.5">
              <PackageSearch className="mt-0.5 h-4 w-4 flex-shrink-0 text-purple-400" />
              <span>
                <Link
                  to="/track"
                  className="font-bold text-purple-400 underline-offset-2 hover:underline"
                >
                  تتبع طلبك
                </Link>{" "}
                — برقم الطلب وآخر 4 أرقام من هاتفك
              </span>
            </li>
          </ul>

          {hasSocialLinks && (
            <div className="flex items-center justify-center gap-3 pt-2">
              {socialLinks.instagram && (
                <a
                  href={socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="إنستغرام"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-400 transition hover:border-pink-500/40 hover:bg-pink-500/10 hover:text-pink-400"
                >
                  <Instagram className="h-4.5 w-4.5" />
                </a>
              )}
              {socialLinks.facebook && (
                <a
                  href={socialLinks.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="فيسبوك"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-400 transition hover:border-blue-500/40 hover:bg-blue-500/10 hover:text-blue-400"
                >
                  <Facebook className="h-4.5 w-4.5" />
                </a>
              )}
              {phone && (
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="واتساب"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-400 transition hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-400"
                >
                  <MessageCircle className="h-4.5 w-4.5" />
                </a>
              )}
              {socialLinks.tiktok && (
                <a
                  href={socialLinks.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="تيك توك"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-400 transition hover:border-white/40 hover:bg-white/10 hover:text-white"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16.6 5.82s.51.5 0 0A4.278 4.278 0 0 1 15.54 3h-3.09v12.4a2.592 2.592 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-1.48z" />
                  </svg>
                </a>
              )}
            </div>
          )}

          <div
            className={`flex flex-wrap items-center justify-center gap-x-4 gap-y-2 border-t pt-4 text-[11px] font-semibold ${isHome ? "border-white/8 text-slate-500" : "border-border/20 text-muted-foreground"}`}
          >
            <Link
              to="/pages/$slug"
              params={{ slug: "about-us" }}
              className="hover:text-purple-400 transition"
            >
              من نحن
            </Link>
            <span className="text-white/15">•</span>
            <Link to="/privacy-policy" className="hover:text-purple-400 transition">
              سياسة الخصوصية
            </Link>
            <span className="text-white/15">•</span>
            <Link to="/terms" className="hover:text-purple-400 transition">
              الشروط والأحكام
            </Link>
            <span className="text-white/15">•</span>
            <Link
              to="/pages/$slug"
              params={{ slug: "return-policy" }}
              className="hover:text-purple-400 transition"
            >
              سياسة الإرجاع
            </Link>
            <span className="text-white/15">•</span>
            <Link
              to="/pages/$slug"
              params={{ slug: "shipping-policy" }}
              className="hover:text-purple-400 transition"
            >
              سياسة الشحن
            </Link>
            <span className="text-white/15">•</span>
            <Link
              to="/pages/$slug"
              params={{ slug: "faq" }}
              className="hover:text-purple-400 transition"
            >
              الأسئلة الشائعة
            </Link>
          </div>

          <p
            className={`text-center text-[10px] ${isHome ? "text-slate-600" : "text-muted-foreground"}`}
          >
            © {storeName} {new Date().getFullYear()} — {copyright}
          </p>
        </div>
      </footer>
    </>
  );
}

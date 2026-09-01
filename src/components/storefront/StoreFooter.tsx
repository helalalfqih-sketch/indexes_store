import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { STORE_INFO } from "./constants";
import { MessageCircle, MapPin, Truck, Package, Facebook, Instagram, PhoneCall } from "lucide-react";
import { StoreLogo } from "./StoreLogo";
import { InfiniteStorefrontCatalog } from "./InfiniteStorefrontCatalog";
import { useCart } from "@/lib/cart-store";
import { useFavorites } from "@/lib/use-favorites";
import type { Product as DesignProduct } from "./types";
import type { Product as StoreProduct } from "@/lib/store-data";

export interface StoreFooterProps {
  onOpenTracker: () => void;
  onOpenAdmin?: () => void;
  onOpenSupport?: () => void;
  isAdminUser?: boolean;
  footerConfig?: {
    storeName?: string;
    tagline?: string;
    description?: string;
    address?: string;
    deliveryInfoText?: string;
    phone?: string;
    whatsappPhone?: string;
    supportEmail?: string;
    copyrightText?: string;
    socialLinks?: {
      facebook?: string;
      instagram?: string;
      tiktok?: string;
      twitter?: string;
    };
  };
}

export const StoreFooter: React.FC<StoreFooterProps> = ({
  onOpenTracker,
  onOpenSupport,
  footerConfig,
}) => {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const navigate = useNavigate();
  const addToCart = useCart((state) => state.add);
  const { favorites, toggleFavorite } = useFavorites();
  const [alreadyRenderedIds, setAlreadyRenderedIds] = useState<string[]>([]);

  useEffect(() => {
    if (pathname !== "/") return;
    const frame = requestAnimationFrame(() => {
      const ids = Array.from(document.querySelectorAll<HTMLElement>("[data-storefront-product-id]"))
        .map((node) => node.dataset.storefrontProductId)
        .filter((id): id is string => Boolean(id));
      setAlreadyRenderedIds([...new Set(ids)]);
    });
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

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

  const waNumber = footerConfig?.whatsappPhone || footerConfig?.phone || STORE_INFO.whatsappNumber;
  const whatsappUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(
    "السلام عليكم، أود الاستفسار عن منتجات متجر إندكس",
  )}`;
  const storeAddress = footerConfig?.address || STORE_INFO.address;
  const deliveryInfo =
    footerConfig?.deliveryInfoText || "متوفر لدينا خدمة التوصيل السريع لجميع المحافظات";
  const copyright =
    footerConfig?.copyrightText ||
    `جميع الحقوق محفوظة © ${new Date().getFullYear()} متجر إندكس - INDEXES STORE`;
  const facebookUrl = footerConfig?.socialLinks?.facebook || "#";
  const instagramUrl = footerConfig?.socialLinks?.instagram || "#";

  return (
    <>
      {pathname === "/" ? (
        <section className="px-2 pb-4 sm:px-6" aria-label="جميع منتجات المتجر">
          <InfiniteStorefrontCatalog
            selectedCategoryId="all"
            searchQuery=""
            sortBy="default"
            priceRange="all"
            selectedBrands={[]}
            selectedRatings={[]}
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

      <motion.footer
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="border-t border-[var(--color-border-default)] bg-[var(--color-surface-1)]/80 px-4 pt-8 pb-[calc(88px+env(safe-area-inset-bottom))] backdrop-blur-md sm:px-6 md:pb-8"
      >
        <div className="bg-[var(--color-surface-2)]/80 backdrop-blur-md border border-[var(--color-border-default)] rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex-1 flex flex-col gap-3.5 text-right w-full">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-end gap-2.5 text-[var(--color-text-secondary)] text-xs sm:text-sm hover:text-[var(--color-primary)] transition-colors cursor-pointer group"
            >
              <span>
                للطلب والاستفسار (واتساب):{" "}
                <strong className="text-[var(--color-text-primary)] dir-ltr inline-block group-hover:text-emerald-500 transition-colors">
                  {waNumber}
                </strong>
              </span>
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-500 shrink-0 group-hover:scale-110 transition-transform">
                <MessageCircle className="w-4 h-4 fill-emerald-500/20" />
              </div>
            </a>

            <div className="flex items-center justify-end gap-2.5 text-[var(--color-text-secondary)] text-xs sm:text-sm">
              <span>
                العنوان: <strong className="text-[var(--color-text-primary)]">{storeAddress}</strong>
              </span>
              <div className="w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 text-[var(--color-text-secondary)] text-xs sm:text-sm">
              <span>{deliveryInfo}</span>
              <div className="w-8 h-8 rounded-full bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400 shrink-0">
                <Truck className="w-4 h-4" />
              </div>
            </div>

            <div
              onClick={onOpenTracker}
              className="flex items-center justify-end gap-2.5 text-[var(--color-text-secondary)] text-xs sm:text-sm cursor-pointer group"
            >
              <span>
                <strong className="text-[var(--color-text-primary)] underline decoration-[#2F6BFF] group-hover:text-[#2F6BFF] transition-colors">
                  تتبع طلبك
                </strong>{" "}
                - برقم الطلب وآخر 4 أرقام من هاتفك
              </span>
              <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-500 shrink-0 group-hover:scale-110 transition-transform">
                <Package className="w-4 h-4" />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 mt-2">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-white bg-gradient-to-r from-emerald-600 to-emerald-500 border border-emerald-400/50 px-4 py-2 rounded-full text-xs font-bold hover:shadow-[0_0_15px_rgba(37,211,102,0.4)] hover:scale-105 transition-all cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 fill-white/20" />
                <span>تواصل عبر واتساب المباشر</span>
              </a>

              <div className="flex items-center gap-2">
                <a
                  href={facebookUrl}
                  aria-label="فيسبوك"
                  className="w-9 h-9 rounded-full border border-[var(--color-border-default)] flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-primary)] bg-[var(--color-surface-1)] transition-all"
                >
                  <Facebook className="w-4 h-4" />
                </a>

                <a
                  href={instagramUrl}
                  aria-label="انستغرام"
                  className="w-9 h-9 rounded-full border border-[var(--color-border-default)] flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-pink-500 bg-[var(--color-surface-1)] transition-all"
                >
                  <Instagram className="w-4 h-4" />
                </a>

                <a
                  href={`tel:${waNumber}`}
                  aria-label="اتصال مباشر"
                  className="w-9 h-9 rounded-full border border-[var(--color-border-default)] flex items-center justify-center text-emerald-500 hover:border-emerald-500 bg-[var(--color-surface-1)] transition-all"
                >
                  <PhoneCall className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

          <div className="shrink-0 flex justify-center">
            <StoreLogo
              variant="full"
              className="p-4 bg-[var(--color-surface-2)]/60 border border-[var(--color-border-default)] rounded-3xl shadow-xl backdrop-blur-md"
            />
          </div>
        </div>

        {onOpenSupport && (
          <div className="mt-6 flex justify-center text-xs">
            <button
              onClick={onOpenSupport}
              className="flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 font-bold text-blue-300 transition-all hover:bg-blue-500/20"
            >
              <span>فتح مركز المساعدة</span>
            </button>
          </div>
        )}

        <div className="mt-4 text-center text-gray-500 text-xs">{copyright}</div>
      </motion.footer>
    </>
  );
};
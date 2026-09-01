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

function validExternalUrl(value?: string): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? value : null;
  } catch {
    return null;
  }
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
  const facebookUrl = validExternalUrl(footerConfig?.socialLinks?.facebook);
  const instagramUrl = validExternalUrl(footerConfig?.socialLinks?.instagram);

  return (
    <>
      {pathname === "/" ? (
        <section className="px-2 pb-3 sm:px-6" aria-label="جميع منتجات المتجر">
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
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.3 }}
        className="border-t border-[var(--color-border-default)] bg-[var(--color-surface-1)]/90 px-3 pt-5 pb-[calc(84px+env(safe-area-inset-bottom))] backdrop-blur-md sm:px-6 sm:pt-8 md:pb-8"
      >
        <div className="mx-auto flex max-w-4xl flex-col gap-5 rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface-2)]/80 p-4 backdrop-blur-md sm:rounded-3xl sm:p-6 md:flex-row md:items-center md:justify-between md:gap-8">
          <div className="flex w-full flex-1 flex-col gap-3 text-right">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-end gap-2.5 text-xs text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-primary)] sm:text-sm"
            >
              <span>
                للطلب والاستفسار (واتساب):{" "}
                <strong className="dir-ltr inline-block text-[var(--color-text-primary)]">{waNumber}</strong>
              </span>
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-emerald-500/40 bg-emerald-500/20 text-emerald-500">
                <MessageCircle className="h-4 w-4" />
              </span>
            </a>

            <div className="flex items-center justify-end gap-2.5 text-xs text-[var(--color-text-secondary)] sm:text-sm">
              <span>
                العنوان: <strong className="text-[var(--color-text-primary)]">{storeAddress}</strong>
              </span>
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-purple-500/40 bg-purple-500/20 text-purple-400">
                <MapPin className="h-4 w-4" />
              </span>
            </div>

            <div className="flex items-center justify-end gap-2.5 text-xs text-[var(--color-text-secondary)] sm:text-sm">
              <span>{deliveryInfo}</span>
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-sky-500/40 bg-sky-500/20 text-sky-400">
                <Truck className="h-4 w-4" />
              </span>
            </div>

            <button
              type="button"
              onClick={onOpenTracker}
              className="flex w-full items-center justify-end gap-2.5 text-xs text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)] sm:text-sm"
            >
              <span>
                <strong className="underline decoration-[#2F6BFF]">تتبع طلبك</strong>{" "}
                - برقم الطلب وآخر 4 أرقام من هاتفك
              </span>
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-blue-500/40 bg-blue-500/20 text-blue-500">
                <Package className="h-4 w-4" />
              </span>
            </button>

            <div className="mt-1 flex flex-wrap items-center justify-end gap-2.5">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-11 items-center gap-2 rounded-full border border-emerald-400/50 bg-gradient-to-r from-emerald-600 to-emerald-500 px-4 py-2 text-xs font-bold text-white"
              >
                <MessageCircle className="h-4 w-4" />
                <span>تواصل عبر واتساب</span>
              </a>

              <div className="flex items-center gap-2">
                {facebookUrl ? (
                  <a
                    href={facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="فيسبوك"
                    className="grid h-10 w-10 place-items-center rounded-full border border-[var(--color-border-default)] bg-[var(--color-surface-1)] text-[var(--color-text-secondary)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-text-primary)]"
                  >
                    <Facebook className="h-4 w-4" />
                  </a>
                ) : null}

                {instagramUrl ? (
                  <a
                    href={instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="انستغرام"
                    className="grid h-10 w-10 place-items-center rounded-full border border-[var(--color-border-default)] bg-[var(--color-surface-1)] text-[var(--color-text-secondary)] transition hover:border-pink-500 hover:text-[var(--color-text-primary)]"
                  >
                    <Instagram className="h-4 w-4" />
                  </a>
                ) : null}

                <a
                  href={`tel:${waNumber}`}
                  aria-label="اتصال مباشر"
                  className="grid h-10 w-10 place-items-center rounded-full border border-[var(--color-border-default)] bg-[var(--color-surface-1)] text-emerald-500 transition hover:border-emerald-500"
                >
                  <PhoneCall className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>

          <div className="hidden shrink-0 justify-center md:flex">
            <StoreLogo
              variant="full"
              className="rounded-3xl border border-[var(--color-border-default)] bg-[var(--color-surface-2)]/60 p-4 shadow-xl"
            />
          </div>
        </div>

        {onOpenSupport ? (
          <div className="mt-4 flex justify-center text-xs">
            <button
              type="button"
              onClick={onOpenSupport}
              className="min-h-10 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-2 font-bold text-blue-300 transition hover:bg-blue-500/20"
            >
              فتح مركز المساعدة
            </button>
          </div>
        ) : null}

        <div className="mt-3 text-center text-[11px] text-gray-500">{copyright}</div>
      </motion.footer>
    </>
  );
};
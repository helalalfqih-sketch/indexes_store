import { Link } from "@tanstack/react-router";
import {
  Star,
  Play,
  X,
  Heart,
  Eye,
  ShoppingCart,
  Video,
  Sparkles,
  Trophy,
  Clock,
  Flame,
  Check,
} from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import type { Product } from "@/lib/store-data";
import type { LegacyProductShape } from "@/lib/data-adapter";
import { formatPrice } from "@/lib/store-data";
import { Product3DTile, useModelViewer } from "@/lib/model-viewer";
import MuxPlayer from "@mux/mux-player-react";
import { OptimizedImage } from "@/components/optimized-image";
import { useAppearance } from "@/components/appearance-provider";
import { useCart } from "@/lib/cart-store";
import { useFavorites } from "@/lib/use-favorites";
import { requestProductVideo } from "@/lib/video-request.functions";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import type { ProductCardQAProps } from "@/lib/qa/product-card-contract";

export interface ProductCardProps {
  product: Product | LegacyProductShape;
  qa: ProductCardQAProps;
  eager?: boolean;
}

export function ProductCard({ product, qa, eager = false }: ProductCardProps) {
  const { settings } = useAppearance();
  useModelViewer();
  const cart = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const requestVideoFn = useServerFn(requestProductVideo);
  const dialogId = useId();
  const quickViewTriggerRef = useRef<HTMLButtonElement>(null);
  const quickViewDialogRef = useRef<HTMLDivElement>(null);
  const quickViewCloseRef = useRef<HTMLButtonElement>(null);
  const videoTriggerRef = useRef<HTMLButtonElement>(null);
  const videoCloseRef = useRef<HTMLButtonElement>(null);

  const modelUrl = (product as LegacyProductShape).modelUrl ?? null;
  const pRec = product as Record<string, unknown>;
  const rawPlaybackId =
    (pRec.videoPlaybackId as string) || (pRec.video_playback_id as string) || null;
  const isMuxFormat =
    rawPlaybackId &&
    typeof rawPlaybackId === "string" &&
    !rawPlaybackId.startsWith("demo-") &&
    !rawPlaybackId.startsWith("mux-playback-") &&
    !rawPlaybackId.startsWith("test-") &&
    !rawPlaybackId.includes("http") &&
    !rawPlaybackId.includes("/") &&
    /^[A-Za-z0-9_-]{10,40}$/.test(rawPlaybackId.trim());

  const videoPlaybackId = isMuxFormat ? rawPlaybackId.trim() : null;
  const rawVideoUrl = (pRec.video_url as string) || (pRec.videoUrl as string) || null;
  const directVideoUrl =
    typeof rawVideoUrl === "string" && rawVideoUrl.trim().length > 0 && rawVideoUrl.includes("http")
      ? rawVideoUrl.trim()
      : null;

  const hasValidVideo = Boolean(videoPlaybackId || directVideoUrl);

  const discount =
    product.oldPrice && product.oldPrice > product.price && product.price > 0
      ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
      : 0;

  // Modals state
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showNoVideoModal, setShowNoVideoModal] = useState(false);
  const [showQuickViewModal, setShowQuickViewModal] = useState(false);
  const [isSubmittingVideoReq, setIsSubmittingVideoReq] = useState(false);
  const [addedToCartToast, setAddedToCartToast] = useState(false);

  useEffect(() => {
    if (!showQuickViewModal) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    quickViewCloseRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowQuickViewModal(false);
        return;
      }

      if (event.key !== "Tab") return;
      const focusable = quickViewDialogRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    const triggerEl = quickViewTriggerRef.current;
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      triggerEl?.focus();
    };
  }, [showQuickViewModal]);

  // Video modal lifecycle — scroll-lock, focus, Escape
  useEffect(() => {
    if (!showVideoModal) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Defer focus to close button after portal renders
    const frame = requestAnimationFrame(() => videoCloseRef.current?.focus());

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowVideoModal(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    const videoTriggerEl = videoTriggerRef.current;
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      videoTriggerEl?.focus();
    };
  }, [showVideoModal]);

  // NoVideo modal lifecycle
  useEffect(() => {
    if (!showNoVideoModal) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowNoVideoModal(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [showNoVideoModal]);

  // Badge & Theme determination
  const rawBadge = (pRec.badge as string) || "";
  const isBestSeller =
    Boolean(pRec.is_best_seller) || rawBadge.includes("مبيع") || rawBadge.includes("أكثر");
  const isDeal = Boolean(pRec.is_deal) || rawBadge.includes("صفقة") || discount > 15;
  const isNew = Boolean(pRec.is_new) || rawBadge.includes("جديد");

  const categoryName =
    (pRec.category_name as string) || (pRec.brand as string) || (pRec.sku as string) || null;
  const realViews =
    pRec.views_count && Number(pRec.views_count) > 0 ? `${pRec.views_count} مشاهدة` : null;
  const realRating = product.rating && product.rating > 0 ? product.rating : null;
  const isFav = isFavorite(product.id);

  const handleVideoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (hasValidVideo) {
      setShowVideoModal(true);
    } else {
      setShowNoVideoModal(true);
    }
  };

  const handleSendVideoRequest = async () => {
    setIsSubmittingVideoReq(true);
    try {
      const res = await requestVideoFn({
        data: { productId: product.id, productName: product.name },
      });
      if (res.duplicate) {
        toast.info(res.message);
      } else {
        toast.success(res.message);
      }
      setShowNoVideoModal(false);
    } catch {
      toast.error("حدث خطأ أثناء إرسال طلب الفيديو.");
    } finally {
      setIsSubmittingVideoReq(false);
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    cart.add(product as Product);
    setAddedToCartToast(true);
    toast.success(`تمت إضافة "${product.name}" إلى السلة 🛒`);
    setTimeout(() => setAddedToCartToast(false), 1500);
  };

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      data-testid={`product-card-${qa.productId}`}
      data-element-key={`product.card.${qa.productId}`}
      data-product-id={product.id}
      data-product-slug={product.slug}
      data-product-name={product.name}
      data-product-price={product.price}
      data-product-category={qa.category ?? undefined}
      data-product-brand={qa.brand ?? undefined}
      data-product-rating={qa.rating ?? undefined}
      data-product-stock={qa.stock ?? undefined}
      data-section-source={qa.sectionSource}
      className="group relative flex flex-col h-full overflow-hidden rounded-[24px] sm:rounded-[28px] border border-slate-800 bg-[#0F0C1B] p-3 sm:p-4 shadow-xl transition-all duration-300 hover:border-purple-500/50 hover:shadow-[0_0_20px_rgba(123,63,255,0.25)]"
    >
      <div className="flex flex-col h-full justify-between gap-2.5">
        {/* ================= 1. TOP OVERLAYS (FAVORITE & DISCOUNT) ================= */}
        <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-black/40">
          {/* Favorite button top-right */}
          <button
            type="button"
            data-element-key={`product.favorite.${qa.productId}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleFavorite(product.id);
            }}
            aria-pressed={isFav}
            aria-label={
              isFav ? `إزالة ${product.name} من المفضلة` : `إضافة ${product.name} إلى المفضلة`
            }
            className="absolute top-2.5 end-2.5 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-slate-400 hover:text-purple-400 backdrop-blur-md transition active:scale-95"
            title={isFav ? "إزالة من المفضلة" : "إضافة للمفضلة"}
          >
            <Heart className={`h-4 w-4 ${isFav ? "fill-purple-500 text-purple-500" : ""}`} />
          </button>

          {/* Real Discount Badge top-left */}
          {discount > 0 && (
            <div className="absolute top-2.5 start-2.5 z-20 rounded-xl bg-[#7B3FFF] px-2.5 py-1 text-[11px] font-bold text-white shadow-md">
              خصم {discount}%
            </div>
          )}

          {/* Top Right Video Badge Overlay */}
          {hasValidVideo && (
            <button
              ref={videoTriggerRef}
              type="button"
              onClick={handleVideoClick}
              aria-label={`تشغيل فيديو ${product.name}`}
              className="absolute start-2.5 bottom-2.5 z-20 flex items-center gap-1 rounded-full border border-purple-400/40 bg-black/70 px-2 py-0.5 text-[10px] font-bold text-purple-300 backdrop-blur-md transition hover:bg-purple-600 hover:text-white active:scale-95 shadow-md"
              title="مشاهدة الفيديو"
            >
              <Video className="h-3 w-3" />
              <span>فيديو</span>
            </button>
          )}

          {/* Main Product Image / 3D Viewer */}
          <Link to="/product/$slug" params={{ slug: product.slug }} className="block h-full w-full">
            {modelUrl ? (
              <Product3DTile modelSrc={modelUrl} poster={product.image} alt={product.name} />
            ) : (
              <OptimizedImage
                src={product.image}
                alt={product.name}
                size="card"
                eager={eager}
                draggable={false}
                className="h-full w-full object-contain p-2 transition-transform duration-500 group-hover:scale-105"
              />
            )}
          </Link>

          {/* Bottom Center Views Count Badge */}
          {realViews && (
            <div className="absolute start-1/2 -translate-x-1/2 bottom-2 z-10 rounded-full bg-black/70 border border-white/15 px-2.5 py-0.5 text-[9px] font-medium text-slate-200 backdrop-blur-md whitespace-nowrap">
              {realViews}
            </div>
          )}
        </div>

        {/* ================= 2. PRODUCT INFORMATION ================= */}
        <div className="flex flex-col gap-1 text-center flex-grow justify-end">
          <Link to="/product/$slug" params={{ slug: product.slug }}>
            <h3
              title={product.name}
              className="line-clamp-1 text-sm sm:text-base font-bold text-white transition-colors group-hover:text-purple-300"
            >
              {product.name}
            </h3>
          </Link>

          {categoryName ? (
            <p className="text-xs text-slate-400 truncate">{categoryName}</p>
          ) : (
            <p className="text-xs text-slate-400 truncate font-mono">منتج مميز</p>
          )}

          {/* Rating (only rendered if real rating exists) */}
          {realRating && (
            <div className="flex items-center justify-center gap-1 text-xs my-0.5">
              <span className="text-[#7B3FFF]">★</span>
              <span className="text-white font-bold">{realRating}</span>
            </div>
          )}

          {/* Prices */}
          <div className="flex items-center justify-center gap-2 my-1">
            <span className="text-base sm:text-lg font-bold text-[#7B3FFF]">
              {formatPrice(product.price)}
            </span>
            {product.oldPrice && product.oldPrice > product.price && (
              <span className="text-xs text-slate-500 line-through">
                {formatPrice(product.oldPrice)}
              </span>
            )}
          </div>
        </div>

        {/* ================= 3. CARD ACTION BUTTON ================= */}
        <div className="grid grid-cols-1 gap-1.5 pt-1">
          <button
            type="button"
            onClick={handleAddToCart}
            data-element-key={`product.cart.${qa.productId}`}
            aria-label={`أضف ${product.name} إلى السلة`}
            className={`w-full text-white text-xs sm:text-sm font-bold py-2.5 sm:py-3 rounded-2xl flex items-center justify-center gap-2 transition-colors border border-purple-500/30 ${
              addedToCartToast ? "bg-emerald-600 text-white" : "bg-[#1F1545] hover:bg-[#7B3FFF]"
            }`}
          >
            {addedToCartToast ? (
              <>
                <Check className="h-4 w-4" />
                <span>تمت الإضافة</span>
              </>
            ) : (
              <>
                <span>أضف للسلة</span>
                <ShoppingCart className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* ================= MODAL 1: VIDEO PLAYER MODAL ================= */}
      {typeof document !== "undefined" &&
        showVideoModal &&
        hasValidVideo &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${dialogId}-video-title`}
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowVideoModal(false);
            }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md cursor-pointer"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-slate-900 shadow-2xl p-3 cursor-default"
            >
              <button
                ref={videoCloseRef}
                type="button"
                onClick={() => setShowVideoModal(false)}
                aria-label="إغلاق فيديو المنتج"
                className="absolute top-4 end-4 z-50 flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-black/70 text-white hover:bg-black/90 transition shadow-lg focus-visible:ring-2 focus-visible:ring-white"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="aspect-video w-full overflow-hidden rounded-2xl bg-black">
                {videoPlaybackId ? (
                  <MuxPlayer
                    playbackId={videoPlaybackId}
                    autoPlay={true}
                    style={{ width: "100%", height: "100%" }}
                  />
                ) : directVideoUrl ? (
                  <video
                    src={directVideoUrl}
                    controls
                    autoPlay
                    playsInline
                    className="h-full w-full object-contain"
                  />
                ) : null}
              </div>
              <div className="p-3 text-start">
                <h4 id={`${dialogId}-video-title`} className="text-sm font-black text-white">
                  {product.name}
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">فيديو عرض المنتج التوضيحي</p>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* ================= MODAL 2: NO VIDEO AVAILABLE / REQUEST VIDEO MODAL ================= */}
      {typeof document !== "undefined" &&
        showNoVideoModal &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${dialogId}-novideo-title`}
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowNoVideoModal(false);
            }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md cursor-pointer"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-[#0c1a29] p-6 text-center shadow-2xl space-y-4 cursor-default"
            >
              <button
                type="button"
                onClick={() => setShowNoVideoModal(false)}
                aria-label="إغلاق النافذة"
                className="absolute top-4 end-4 flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Video className="h-7 w-7" />
              </div>

              <h3 id={`${dialogId}-novideo-title`} className="text-base font-black text-white">
                هذا المنتج لا يحتوي على فيديو حالياً
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                يمكنك طلب توفير فيديو توضيحي لمشاهدة تفاصيل وطريقة عمل هذا المنتج عن قرب. سنقوم
                بإنتاجه فوراً!
              </p>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSendVideoRequest}
                  disabled={isSubmittingVideoReq}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-3 text-xs font-black text-slate-950 transition hover:bg-cyan-400 shadow-lg disabled:opacity-50 min-h-[44px]"
                >
                  <Video className="h-4 w-4" />
                  {isSubmittingVideoReq ? "جارٍ إرسال الطلب..." : "🎥 اطلب توفير فيديو للمنتج"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* ================= MODAL 3: QUICK VIEW MODAL ================= */}
      {typeof document !== "undefined" &&
        showQuickViewModal &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${dialogId}-quickview-title`}
            onClick={(event) => {
              if (event.target === event.currentTarget) setShowQuickViewModal(false);
            }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md"
          >
            <div
              ref={quickViewDialogRef}
              className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-[#0c1a29] p-6 shadow-2xl text-start space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <button
                ref={quickViewCloseRef}
                type="button"
                onClick={() => setShowQuickViewModal(false)}
                aria-label="إغلاق المعاينة السريعة"
                className="absolute top-4 end-4 z-50 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="aspect-square w-full overflow-hidden rounded-2xl bg-black/40 border border-white/10">
                    <OptimizedImage
                      src={product.image}
                      alt={product.name}
                      size="large"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  {hasValidVideo && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowQuickViewModal(false);
                        setShowVideoModal(true);
                      }}
                      className="w-full flex items-center justify-center gap-2 rounded-xl border border-cyan-500/40 bg-cyan-500/10 py-2.5 text-xs font-bold text-cyan-300 hover:bg-cyan-500/20 min-h-[44px]"
                    >
                      <Play className="h-4 w-4 fill-cyan-300" />
                      تشغيل الفيديو التوضيحي للمنتج
                    </button>
                  )}
                </div>

                <div className="flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    {categoryName && (
                      <span className="text-xs font-bold text-cyan-400">{categoryName}</span>
                    )}
                    <h3
                      id={`${dialogId}-quickview-title`}
                      className="text-lg font-black text-white leading-tight"
                    >
                      {product.name}
                    </h3>

                    {Number((product as LegacyProductShape).reviews) > 0 && (
                      <div className="flex items-center gap-1.5 text-xs text-amber-400">
                        <Star className="h-4 w-4 fill-amber-400" />
                        <span className="font-bold text-white">{product.rating}</span>
                        <span className="text-slate-400">
                          ({(product as LegacyProductShape).reviews} تقييم)
                        </span>
                      </div>
                    )}

                    <div className="flex items-baseline gap-3 pt-1">
                      <span className="text-2xl font-black text-cyan-400">
                        {formatPrice(product.price)}
                      </span>
                      {product.oldPrice && (
                        <span className="text-sm font-medium text-slate-400 line-through">
                          {formatPrice(product.oldPrice)}
                        </span>
                      )}
                      {discount > 0 && (
                        <span className="rounded-full bg-red-600/80 px-2.5 py-0.5 text-xs font-bold text-white">
                          خصم {discount}%
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed pt-2">
                      {product.description || "للاستفسار عن تفاصيل المنتج والتوصيل، تواصل معنا."}
                    </p>
                  </div>

                  <div className="space-y-2 pt-4 border-t border-white/10">
                    <button
                      type="button"
                      onClick={(e) => {
                        handleAddToCart(e);
                        setShowQuickViewModal(false);
                      }}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-3 text-xs font-black text-slate-950 transition hover:bg-cyan-400 shadow-lg min-h-[44px]"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      أضف إلى السلة الآن
                    </button>

                    <Link
                      to="/product/$slug"
                      params={{ slug: product.slug }}
                      onClick={() => setShowQuickViewModal(false)}
                      className="w-full flex items-center justify-center gap-1 rounded-xl border border-white/20 py-2.5 text-xs font-bold text-white hover:bg-white/5 text-center min-h-[44px]"
                    >
                      عرض صفحة المنتج الكاملة ➔
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </motion.div>
  );
}

import { Link } from "@tanstack/react-router";
import { Star, Play, X, Heart, Eye, ShoppingCart, Video, Sparkles, Trophy, Clock, Flame, Check } from "lucide-react";
import { useState, useRef } from "react";
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

export interface ProductCardProps {
  product: Product | LegacyProductShape;
  eager?: boolean;
}

export function ProductCard({ product, eager = false }: ProductCardProps) {
  const { settings } = useAppearance();
  const lay = settings.products_layout;
  useModelViewer();
  const cart = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const requestVideoFn = useServerFn(requestProductVideo);

  const modelUrl = (product as LegacyProductShape).modelUrl ?? null;
  const videoPlaybackId = (product as any).videoPlaybackId || (product as any).video_playback_id || null;

  const discount = product.oldPrice
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0;

  // Modals state
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showNoVideoModal, setShowNoVideoModal] = useState(false);
  const [showQuickViewModal, setShowQuickViewModal] = useState(false);
  const [isSubmittingVideoReq, setIsSubmittingVideoReq] = useState(false);
  const [addedToCartToast, setAddedToCartToast] = useState(false);

  // Badge & Theme determination
  const rawBadge = (product as any).badge || "";
  const isBestSeller = (product as any).is_best_seller || rawBadge.includes("مبيع") || rawBadge.includes("أكثر");
  const isDeal = (product as any).is_deal || rawBadge.includes("صفقة") || discount > 15;
  const isNew = (product as any).is_new || rawBadge.includes("جديد");

  let badgeLabel = "رائج";
  let badgeIcon = <Sparkles className="h-3 w-3 text-purple-300" />;
  let themeStyle = {
    badgeBg: "bg-purple-950/80 border-purple-500/50 text-purple-200",
    cardGlow: "hover:border-purple-500/60 hover:shadow-[0_0_20px_rgba(168,85,247,0.25)]",
  };

  if (isBestSeller) {
    badgeLabel = "الأكثر مبيعاً";
    badgeIcon = <Trophy className="h-3 w-3 text-amber-400" />;
    themeStyle = {
      badgeBg: "bg-amber-950/80 border-amber-500/60 text-amber-300",
      cardGlow: "hover:border-amber-500/60 hover:shadow-[0_0_20px_rgba(245,158,11,0.25)]",
    };
  } else if (isDeal) {
    badgeLabel = "صفقة اليوم";
    badgeIcon = <Clock className="h-3 w-3 text-orange-400" />;
    themeStyle = {
      badgeBg: "bg-orange-950/80 border-orange-500/60 text-orange-300",
      cardGlow: "hover:border-orange-500/60 hover:shadow-[0_0_20px_rgba(249,115,22,0.25)]",
    };
  } else if (isNew) {
    badgeLabel = "جديد";
    badgeIcon = <Flame className="h-3 w-3 text-emerald-400" />;
    themeStyle = {
      badgeBg: "bg-emerald-950/80 border-emerald-500/60 text-emerald-300",
      cardGlow: "hover:border-emerald-500/60 hover:shadow-[0_0_20px_rgba(34,197,94,0.25)]",
    };
  } else if (product.badge) {
    badgeLabel = product.badge;
  }

  const categoryName = (product as any).category_name || (product as any).brand || "أجهزة منزلية";
  const viewsText = (product as any).views_count || "1.2M مشاهدة";
  const isFav = isFavorite(product.id);

  const handleVideoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (videoPlaybackId) {
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
      data-product-id={product.id}
      data-product-slug={product.slug}
      data-product-name={product.name}
      data-product-price={product.price}
      className="group relative flex flex-col h-full overflow-hidden rounded-2xl sm:rounded-3xl border border-white/10 bg-[#070f1e]/95 backdrop-blur-xl p-2 sm:p-3 shadow-xl transition-all duration-300 hover:border-cyan-400/50 hover:shadow-[0_0_20px_rgba(56,189,248,0.2)]"
    >
      <div className="flex flex-col h-full justify-between gap-2">
        
        {/* ================= 1. TOP PURPLE FLOATING STATUS CAPSULE ================= */}
        <div className="flex items-center justify-between gap-1 rounded-full border border-purple-500/40 bg-purple-950/70 px-2 py-1 backdrop-blur-md text-[10px] text-purple-200">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleFavorite(product.id);
            }}
            className="flex items-center justify-center h-5 w-5 rounded-full bg-white/10 hover:bg-white/20 transition active:scale-95"
            title={isFav ? "إزالة من المفضلة" : "إضافة للمفضلة"}
          >
            <Heart className={`h-3 w-3 ${isFav ? "fill-purple-400 text-purple-400" : "text-purple-300"}`} />
          </button>

          <div className="flex items-center gap-1.5">
            <span className="rounded-md bg-purple-600/80 px-1.5 py-0.5 text-[9px] font-extrabold text-white">
              Video
            </span>
            <div className="flex items-center gap-0.5">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span className="font-bold text-white text-[10px]">{product.rating || 4.5}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleFavorite(product.id);
            }}
            className="flex items-center justify-center h-5 w-5 rounded-full bg-white/10 hover:bg-white/20 transition active:scale-95"
            title={isFav ? "إزالة من المفضلة" : "إضافة للمفضلة"}
          >
            <Heart className={`h-3 w-3 ${isFav ? "fill-red-500 text-red-500" : "text-purple-300"}`} />
          </button>
        </div>

        {/* ================= 2. MEDIA & OVERLAY BADGES ================= */}
        <div className="relative aspect-square w-full overflow-hidden rounded-xl sm:rounded-2xl bg-black/40">
          {/* Top Right Video Badge Overlay */}
          <button
            type="button"
            onClick={handleVideoClick}
            className="absolute start-2 top-2 z-20 flex items-center gap-1 rounded-full border border-cyan-400/40 bg-black/60 px-2 py-0.5 text-[9px] sm:text-[10px] font-bold text-white backdrop-blur-md transition hover:bg-cyan-500 hover:text-slate-950 active:scale-95 shadow-md"
            title="مشاهدة الفيديو"
          >
            <Video className="h-3 w-3 text-cyan-400" />
            <span>فيديو</span>
          </button>

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
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            )}
          </Link>

          {/* Bottom Center Views Count Badge */}
          <div className="absolute start-1/2 -translate-x-1/2 bottom-2 z-10 rounded-full bg-black/70 border border-white/15 px-2.5 py-0.5 text-[9px] font-medium text-slate-200 backdrop-blur-md whitespace-nowrap">
            {viewsText}
          </div>

          {/* Discount Tag */}
          {discount > 0 && (
            <div className="absolute end-2 top-2 z-10 rounded-full bg-red-600/90 border border-red-400/30 px-2 py-0.5 text-[9px] font-black text-white backdrop-blur-md">
              خصم {discount}%
            </div>
          )}
        </div>

        {/* ================= 3. PRODUCT INFORMATION ================= */}
        <div className="flex flex-col gap-0.5 text-start px-0.5">
          {/* Uppercase Brand/Code Label */}
          <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">
            {(product as any).brand || (product as any).sku || categoryName}
          </span>

          {/* Product Title (2-line clamp) */}
          <Link to="/product/$slug" params={{ slug: product.slug }}>
            <h3
              title={product.name}
              className="line-clamp-2 text-xs font-bold leading-snug text-white transition-colors group-hover:text-cyan-300 min-h-[32px]"
            >
              {product.name}
            </h3>
          </Link>

          {/* Price Tag */}
          <div className="mt-0.5 flex items-baseline gap-1.5">
            <span className="text-xs sm:text-sm font-black text-cyan-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.4)]">
              {formatPrice(product.price)}
            </span>
            {product.oldPrice && (
              <span className="text-[10px] font-medium text-slate-500 line-through">
                {formatPrice(product.oldPrice)}
              </span>
            )}
          </div>
        </div>

        {/* ================= 4. CARD ACTIONS (2 EQUAL BUTTONS) ================= */}
        <div className="grid grid-cols-2 gap-1.5 pt-1.5 border-t border-white/10">
          <button
            type="button"
            onClick={handleAddToCart}
            className={`flex items-center justify-center gap-1 rounded-xl px-1.5 py-1.5 sm:py-2 text-[10px] sm:text-xs font-bold transition shadow-md ${
              addedToCartToast
                ? "bg-emerald-500 text-white"
                : "bg-[#112233] hover:bg-cyan-500 hover:text-slate-950 border border-white/15 text-white"
            }`}
          >
            {addedToCartToast ? <Check className="h-3 w-3" /> : <ShoppingCart className="h-3 w-3 text-cyan-400" />}
            <span className="truncate">أضف للسلة</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowQuickViewModal(true);
            }}
            className="flex items-center justify-center gap-1 rounded-xl border border-white/15 bg-[#112233] px-1.5 py-1.5 sm:py-2 text-[10px] sm:text-xs font-bold text-white transition hover:bg-white/15 hover:border-cyan-400/50"
          >
            <Eye className="h-3 w-3 text-cyan-400" />
            <span className="truncate">معاينة سريعة</span>
          </button>
        </div>
      </div>

      {/* ================= MODAL 1: VIDEO PLAYER MODAL ================= */}
      {showVideoModal && videoPlaybackId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-slate-900 shadow-2xl p-3">
            <button
              type="button"
              onClick={() => setShowVideoModal(false)}
              className="absolute top-4 end-4 z-50 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="aspect-video w-full overflow-hidden rounded-2xl bg-black">
              <MuxPlayer playbackId={videoPlaybackId} autoPlay={true} style={{ width: "100%", height: "100%" }} />
            </div>
            <div className="p-3 text-start">
              <h4 className="text-sm font-black text-white">{product.name}</h4>
              <p className="text-xs text-slate-400 mt-0.5">فيديو عرض المنتج التوضيحي</p>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: NO VIDEO AVAILABLE / REQUEST VIDEO MODAL ================= */}
      {showNoVideoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-[#0c1a29] p-6 text-center shadow-2xl space-y-4">
            <button
              type="button"
              onClick={() => setShowNoVideoModal(false)}
              className="absolute top-4 end-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Video className="h-7 w-7" />
            </div>

            <h3 className="text-base font-black text-white">هذا المنتج لا يحتوي على فيديو حالياً</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              يمكنك طلب توفير فيديو توضيحي لمشاهدة تفاصيل وطريقة عمل هذا المنتج عن قرب. سنقوم بإنتاجه فوراً!
            </p>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleSendVideoRequest}
                disabled={isSubmittingVideoReq}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-3 text-xs font-black text-slate-950 transition hover:bg-cyan-400 shadow-lg disabled:opacity-50"
              >
                <Video className="h-4 w-4" />
                {isSubmittingVideoReq ? "جارٍ إرسال الطلب..." : "🎥 اطلب توفير فيديو للمنتج"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: QUICK VIEW MODAL ================= */}
      {showQuickViewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-[#0c1a29] p-6 shadow-2xl text-start space-y-4 max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setShowQuickViewModal(false)}
              className="absolute top-4 end-4 z-50 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Product Gallery / Video */}
              <div className="space-y-3">
                <div className="aspect-square w-full overflow-hidden rounded-2xl bg-black/40 border border-white/10">
                  <OptimizedImage
                    src={product.image}
                    alt={product.name}
                    size="large"
                    className="h-full w-full object-cover"
                  />
                </div>
                {videoPlaybackId && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowQuickViewModal(false);
                      setShowVideoModal(true);
                    }}
                    className="w-full flex items-center justify-center gap-2 rounded-xl border border-cyan-500/40 bg-cyan-500/10 py-2 text-xs font-bold text-cyan-300 hover:bg-cyan-500/20"
                  >
                    <Play className="h-4 w-4 fill-cyan-300" />
                    تشغيل الفيديو التوضيحي للمنتج
                  </button>
                )}
              </div>

              {/* Product Details & Actions */}
              <div className="flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <span className="text-xs font-bold text-cyan-400">{categoryName}</span>
                  <h3 className="text-lg font-black text-white leading-tight">{product.name}</h3>

                  {(product.rating > 0 || (product as any).reviews > 0) && (
                    <div className="flex items-center gap-1.5 text-xs text-amber-400">
                      <Star className="h-4 w-4 fill-amber-400" />
                      <span className="font-bold text-white">{product.rating || 4.8}</span>
                      <span className="text-slate-400">({(product as any).reviews || 42} تقييم)</span>
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
                    {product.description || "منتج عالي الجودة مع ضمان ومتوفر للتوصيل السريع لجميع المحافظات."}
                  </p>
                </div>

                <div className="space-y-2 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={(e) => {
                      handleAddToCart(e);
                      setShowQuickViewModal(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-3 text-xs font-black text-slate-950 transition hover:bg-cyan-400 shadow-lg"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    أضف إلى السلة الآن
                  </button>

                  <Link
                    to="/product/$slug"
                    params={{ slug: product.slug }}
                    onClick={() => setShowQuickViewModal(false)}
                    className="w-full flex items-center justify-center gap-1 rounded-xl border border-white/20 py-2.5 text-xs font-bold text-white hover:bg-white/5 text-center"
                  >
                    عرض صفحة المنتج الكاملة ➔
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

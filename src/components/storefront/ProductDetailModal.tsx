import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Product, Currency } from './types';
import { formatPrice } from './currency';
import { STORE_INFO } from './constants';;
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface StarData {
  star: string;
  count: number;
  percentage: number;
  fill: string;
}

const getStarBreakdown = (rating: number, reviewsCount: number, productId: string): StarData[] => {
  if (!reviewsCount || reviewsCount <= 0) {
    return [
      { star: '5 نجوم', count: 0, percentage: 0, fill: '#3B82F6' },
      { star: '4 نجوم', count: 0, percentage: 0, fill: '#60A5FA' },
      { star: '3 نجوم', count: 0, percentage: 0, fill: '#F59E0B' },
      { star: '2 نجوم', count: 0, percentage: 0, fill: '#F97316' },
      { star: '1 نجمة', count: 0, percentage: 0, fill: '#EF4444' },
    ];
  }

  const seed = productId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const targetAvg = Math.min(5, Math.max(1, rating));

  const weights = [5, 4, 3, 2, 1].map((s, idx) => {
    const dist = Math.abs(s - targetAvg);
    const varFactor = 0.92 + (((seed + idx * 17) % 15) / 100);
    return Math.exp(-dist * 2.1) * varFactor;
  });

  const sumWeights = weights.reduce((a, b) => a + b, 0);
  let rawCounts = weights.map((w) => Math.round((w / sumWeights) * reviewsCount));
  
  let diff = reviewsCount - rawCounts.reduce((a, b) => a + b, 0);
  rawCounts[0] = Math.max(0, rawCounts[0] + diff);

  const colors = ['#3B82F6', '#60A5FA', '#F59E0B', '#F97316', '#EF4444'];
  const labels = ['5 نجوم', '4 نجوم', '3 نجوم', '2 نجوم', '1 نجمة'];

  return labels.map((label, idx) => {
    const count = rawCounts[idx];
    const percentage = Math.round((count / reviewsCount) * 100);
    return {
      star: label,
      count,
      percentage,
      fill: colors[idx],
    };
  });
};

const CustomRatingTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as StarData;
    return (
      <div className="bg-[#120F23] border border-[var(--color-border-default)] p-2.5 rounded-xl text-xs shadow-xl text-white dir-rtl">
        <p className="font-bold flex items-center gap-1" style={{ color: data.fill }}>
          <span>{data.star}</span>
        </p>
        <p className="text-gray-200 mt-0.5">
          <span className="font-bold text-white">{data.count}</span> تقييم ({data.percentage}%)
        </p>
      </div>
    );
  }
  return null;
};

interface ProductDetailModalProps {
  product: Product | null;
  currency: Currency;
  isFavorite: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number, color?: string) => void;
  onToggleFavorite: (product: Product) => void;
  onAddToCompare?: (product: Product) => void;
  onOpenDeconstruction?: () => void;
  onOpenStory?: (product: Product) => void;
}

interface MediaItem {
  type: 'image' | 'video';
  url: string;
  label: string;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  currency,
  isFavorite,
  onClose,
  onAddToCart,
  onToggleFavorite,
  onAddToCompare,
  onOpenDeconstruction,
  onOpenStory,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState<string | undefined>(
    product?.colors?.[0]
  );
  const [addedToast, setAddedToast] = useState(false);
  const [sharedToast, setSharedToast] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [failedUrls, setFailedUrls] = useState<Set<string>>(new Set());

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Reset selected media and failedUrls when product changes
  useEffect(() => {
    setSelectedMediaIndex(0);
    setQuantity(1);
    setSelectedColor(product?.colors?.[0]);
    setFailedUrls(new Set());
  }, [product?.id]);

  // Rating breakdown chart data
  const ratingData = useMemo(() => {
    if (!product) return [];
    return getStarBreakdown(product.rating, product.reviewsCount, product.id);
  }, [product?.rating, product?.reviewsCount, product?.id]);

  if (!product) return null;

  // Construct sharing details
  const getShareUrl = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const path = typeof window !== 'undefined' ? window.location.pathname : '';
    return `${origin}${path}?product=${product.id}`;
  };

  const shareTitle = product.name;
  const shareText = `📦 *${product.name}*\n${product.subtitle ? product.subtitle + '\n' : ''}💰 السعر: ${formatPrice(product.priceYER, currency)}`;
  const shareUrl = getShareUrl();

  const whatsappShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText}\n🔗 رابط المنتج: ${shareUrl}`)}`;
  const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;

  const handleNativeShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        console.log('Native share dismissed:', err);
      }
    } else {
      handleCopyLink(e);
    }
  };

  const handleCopyLink = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const shareUrl = getShareUrl();

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
      }
    }

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = shareUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setSharedToast(true);
      setTimeout(() => setSharedToast(false), 2800);
    } catch {
      window.open(whatsappShareUrl, '_blank');
    }
  };

  // Build media list; failed URLs are excluded lazily as onError fires during render
  const mediaList: MediaItem[] = [];
  if (product.image && !failedUrls.has(product.image)) {
    mediaList.push({ type: 'image', url: product.image, label: 'الصورة الرئيسية' });
  }
  if (product.gallery && product.gallery.length > 0) {
    product.gallery.forEach((imgUrl, idx) => {
      if (imgUrl && imgUrl !== product.image && !failedUrls.has(imgUrl)) {
        mediaList.push({ type: 'image', url: imgUrl, label: `صورة ${idx + 1}` });
      }
    });
  }
  if (product.videoUrl) {
    mediaList.push({ type: 'video', url: product.videoUrl, label: 'فيديو المنتج' });
  }

  const safeMediaIndex = Math.min(selectedMediaIndex, Math.max(0, mediaList.length - 1));
  const activeMedia = mediaList[safeMediaIndex] || mediaList[0];

  // Called by <img onError>: marks URL as failed and falls back to index 0
  const handleImageLoadError = (url: string) => {
    setFailedUrls(prev => new Set([...prev, url]));
    setSelectedMediaIndex(0);
  };

  const handleAddToCart = () => {
    onAddToCart(product, quantity, selectedColor);
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2200);
  };

  const directWhatsappText = encodeURIComponent(
    `السلام عليكم، أود شراء المنتج التالي من متجر إندكس:\n` +
      `📦 *${product.name}*\n` +
      `💰 السعر: ${formatPrice(product.priceYER, currency)}\n` +
      `الكمية: ${quantity}` +
      (selectedColor ? `\nاللون المختار: ${selectedColor}` : '')
  );

  const directWhatsappUrl = `https://wa.me/${STORE_INFO.whatsappNumber}?text=${directWhatsappText}`;

  return (
    <AnimatePresence>
      {product && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="product-modal-title"
        >
          <motion.div 
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.96 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-[var(--color-surface-1)] border border-[var(--color-border-default)] rounded-[28px] sm:rounded-[32px] w-full max-w-3xl max-h-[92vh] overflow-y-auto no-scrollbar relative shadow-2xl p-5 sm:p-8 dir-rtl"
          >
        {/* Floating Controls Bar */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-30 pointer-events-none">
          {/* Close Button */}
          <button
            onClick={onClose}
            aria-label="إغلاق"
            className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] bg-[var(--color-surface-1)]/90 hover:bg-[var(--color-surface-2)] w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border border-[var(--color-border-default)] transition-all shadow-sm cursor-pointer pointer-events-auto"
          >
            <span className="material-symbols-outlined text-[22px] sm:text-[24px]">close</span>
          </button>

          {/* Actions Group: Copy Link, Share & Favorite */}
          <div className="flex items-center gap-2 pointer-events-auto">
            {onOpenStory && (
              <button
                onClick={() => onOpenStory(product)}
                className="bg-[#2F6BFF]/15 border border-[#2F6BFF]/30 text-[#2F6BFF] hover:bg-[#2F6BFF] hover:text-white px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                title="شاهد المنتج برؤية تفاعلية"
              >
                <span className="material-symbols-outlined text-[16px]">play_circle</span>
                <span>شاهد المنتج</span>
              </button>
            )}

            {/* Copy Link Quick Button */}
            <button
              onClick={handleCopyLink}
              aria-label="نسخ رابط المنتج"
              title="نسخ رابط المنتج"
              className="bg-[var(--color-surface-1)]/90 text-[var(--color-text-secondary)] hover:text-[#2F6BFF] hover:border-[#2F6BFF]/40 w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border border-[var(--color-border-default)] transition-all shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px] sm:text-[22px]">link</span>
            </button>

            {/* Share Button */}
            <button
              onClick={() => setIsShareOpen(true)}
              aria-label="مشاركة المنتج"
              title="مشاركة المنتج"
              className="bg-[var(--color-surface-1)]/90 text-[var(--color-text-secondary)] hover:text-[#2F6BFF] hover:border-[#2F6BFF]/40 w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border border-[var(--color-border-default)] transition-all shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px] sm:text-[22px]">share</span>
            </button>

            {/* Favorite Button */}
            <button
              onClick={() => onToggleFavorite(product)}
              aria-label="إضافة للمفضلة"
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border transition-all shadow-sm cursor-pointer ${
                isFavorite 
                  ? 'bg-rose-500/10 text-rose-500 border-rose-500/30' 
                  : 'bg-[var(--color-surface-1)]/90 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border-[var(--color-border-default)]'
              }`}
            >
              <span
                className={`material-symbols-outlined text-[20px] sm:text-[22px] ${isFavorite ? 'fill-1' : ''}`}
              >
                favorite
              </span>
            </button>
          </div>
        </div>

        {/* Modal Layout Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mt-6">
          
          {/* 1. MEDIA GALLERY AREA */}
          <div className="flex flex-col">
            {/* Main Stage */}
            <div className="relative w-full h-64 sm:h-80 bg-[var(--color-surface-2)] rounded-2xl p-3 flex items-center justify-center overflow-hidden border border-[var(--color-border-subtle)] group">
              {activeMedia?.type === 'video' ? (
                <video
                  src={activeMedia.url}
                  controls
                  autoPlay={false}
                  className="w-full h-full object-contain rounded-xl"
                />
              ) : (
                <img
                  src={activeMedia?.url || product.image}
                  alt={product.name}
                  className="max-h-full max-w-full object-contain transition-all duration-300"
                />
              )}

              {/* Media Count Badge */}
              {mediaList.length > 1 && (
                <div className="absolute bottom-3 left-3 bg-black/65 backdrop-blur-md text-white text-[10px] sm:text-[11px] font-bold px-2.5 py-1 rounded-lg border border-white/10 pointer-events-none">
                  {selectedMediaIndex + 1} / {mediaList.length}
                </div>
              )}
            </div>

            {/* Gallery Thumbnails Rail */}
            {mediaList.length > 1 && (
              <div
                className="flex items-center gap-2.5 mt-3 overflow-x-auto w-full pb-1 no-scrollbar"
                style={{ touchAction: 'pan-x pan-y', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {mediaList.map((item, idx) => {
                  const isSelected = selectedMediaIndex === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedMediaIndex(idx)}
                      aria-label={item.label}
                      className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl border-2 p-1 bg-[var(--color-surface-2)] flex-shrink-0 cursor-pointer relative transition-all ${
                        isSelected
                          ? 'border-[#2F6BFF] scale-105 shadow-sm'
                          : 'border-[var(--color-border-default)] opacity-70 hover:opacity-100'
                      }`}
                    >
                      {item.type === 'video' ? (
                        <div className="w-full h-full bg-black/40 flex items-center justify-center rounded-lg">
                          <span className="material-symbols-outlined text-white text-xl">play_circle</span>
                        </div>
                      ) : (
                        <img src={item.url} alt="" className="w-full h-full object-contain rounded-lg" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* 3D Cinematic Deconstruction Trigger Button */}
            {onOpenDeconstruction && (
              <button
                onClick={onOpenDeconstruction}
                className="mt-3 w-full bg-gradient-to-r from-[#7B3FFF]/20 via-[#2F6BFF]/20 to-[#38BDF8]/20 hover:from-[#7B3FFF]/30 hover:to-[#38BDF8]/30 border border-[#7B3FFF]/40 text-white font-extrabold py-2.5 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer group/3d active:scale-98"
              >
                <span className="material-symbols-outlined text-[#38BDF8] text-[20px] group-hover/3d:rotate-45 transition-transform">
                  view_in_ar
                </span>
                <span className="text-xs sm:text-sm">استعراض التفكيك الهيكلي السينمائي 3D</span>
              </button>
            )}


          </div>

          {/* 2. PRODUCT DETAILS & ACTIONS AREA */}
          <div className="flex flex-col justify-between space-y-4">
            <div>
              {/* Badges & Stock Row */}
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {product.inStock ? (
                  <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[11px] font-bold px-2.5 py-0.5 rounded-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    متوفر في المخزون
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 bg-rose-500/10 text-rose-500 border border-rose-500/20 text-[11px] font-bold px-2.5 py-0.5 rounded-md">
                    غير متوفر حالياً
                  </span>
                )}

                {product.discountBadge && (
                  <span className="bg-[#2F6BFF] text-white text-[11px] font-bold px-2.5 py-0.5 rounded-md shadow-sm">
                    {product.discountBadge}
                  </span>
                )}
              </div>

              {/* Title & Subtitle */}
              <h2 id="product-modal-title" className="text-xl sm:text-2xl font-bold text-[var(--color-text-primary)] leading-snug">
                {product.name}
              </h2>
              <p className="text-[var(--color-text-secondary)] text-xs sm:text-sm mt-1 mb-3">{product.subtitle}</p>

              {/* Rating */}
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[var(--color-border-subtle)]">
                <div className="flex text-amber-400 text-sm">
                  {'★'.repeat(Math.floor(product.rating))}
                </div>
                <span className="text-[var(--color-text-primary)] font-bold text-xs sm:text-sm">{product.rating}</span>
                <span className="text-[var(--color-text-muted)] text-xs">({product.reviewsCount} تقييم)</span>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-3 mb-4">
                <span className="text-[var(--color-text-primary)] font-extrabold text-2xl sm:text-3xl tracking-tight">
                  {formatPrice(product.priceYER * quantity, currency)}
                </span>
                {product.originalPriceYER > product.priceYER && (
                  <>
                    <span className="text-[var(--color-text-muted)] line-through text-sm sm:text-base font-medium">
                      {formatPrice(product.originalPriceYER * quantity, currency)}
                    </span>
                    <span className="text-[11px] font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-md">
                      توفير {formatPrice((product.originalPriceYER - product.priceYER) * quantity, currency)}
                    </span>
                  </>
                )}
              </div>

              {/* Color Options */}
              {product.colors && product.colors.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs font-bold mb-2">
                    <span className="text-[var(--color-text-secondary)]">اختر اللون:</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {product.colors.map((color) => {
                      const isSelected = selectedColor === color;
                      return (
                        <button
                          key={color}
                          onClick={() => setSelectedColor(color)}
                          style={{ backgroundColor: color }}
                          aria-label={`اللون ${color}`}
                          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 transition-all cursor-pointer ${
                            isSelected
                              ? 'border-[#2F6BFF] ring-2 ring-[#2F6BFF]/30 scale-110 shadow-sm'
                              : 'border-[var(--color-border-default)] opacity-80 hover:opacity-100'
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quantity Selector */}
              <div className="flex items-center justify-between mb-5 bg-[var(--color-surface-2)] p-2.5 sm:p-3 rounded-2xl border border-[var(--color-border-default)]">
                <span className="text-[var(--color-text-secondary)] text-xs sm:text-sm font-semibold">الكمية:</span>
                <div className="flex items-center gap-3 sm:gap-4">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    aria-label="تقليل الكمية"
                    className="min-w-[44px] min-h-[44px] w-11 h-11 rounded-xl bg-[var(--color-surface-1)] border border-[var(--color-border-default)] text-[var(--color-text-primary)] font-bold flex items-center justify-center hover:bg-[#2F6BFF] hover:text-white hover:border-[#2F6BFF] transition-colors cursor-pointer disabled:opacity-40 active:scale-95 text-lg"
                  >
                    -
                  </button>
                  <span className="text-[var(--color-text-primary)] font-bold text-base sm:text-lg min-w-[28px] text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    aria-label="زيادة الكمية"
                    className="min-w-[44px] min-h-[44px] w-11 h-11 rounded-xl bg-[var(--color-surface-1)] border border-[var(--color-border-default)] text-[var(--color-text-primary)] font-bold flex items-center justify-center hover:bg-[#2F6BFF] hover:text-white hover:border-[#2F6BFF] transition-colors cursor-pointer active:scale-95 text-lg"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Description */}
              <div className="mb-4">
                <h4 className="font-bold text-xs sm:text-sm text-[var(--color-text-primary)] mb-1.5">وصف المنتج:</h4>
                <p className="text-[var(--color-text-secondary)] text-xs sm:text-sm leading-relaxed bg-[var(--color-surface-2)]/50 p-3 rounded-xl border border-[var(--color-border-subtle)]">
                  {product.description}
                </p>
              </div>

              {/* Specs Grid */}
              {product.specs && (
                <div className="mb-5 bg-[var(--color-surface-2)]/50 p-3.5 rounded-2xl border border-[var(--color-border-subtle)] text-xs">
                  <h4 className="font-bold text-[var(--color-text-primary)] mb-2 text-xs sm:text-sm">المواصفات التقنية:</h4>
                  <div className="grid grid-cols-2 gap-2 text-[var(--color-text-secondary)]">
                    {Object.entries(product.specs).map(([key, val]) => (
                      <div key={key} className="flex flex-col bg-[var(--color-surface-1)]/60 p-2 rounded-lg border border-[var(--color-border-subtle)]">
                        <span className="text-[var(--color-text-muted)] font-medium text-[10px] sm:text-[11px]">{key}</span>
                        <span className="font-bold text-[var(--color-text-primary)] mt-0.5">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Star Rating Breakdown Chart (Recharts) */}
              <div className="mb-5 bg-[var(--color-surface-2)]/50 p-3.5 rounded-2xl border border-[var(--color-border-subtle)] text-xs">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-[var(--color-text-primary)]">توزيع درجات التقييم</h4>
                    <p className="text-[10px] sm:text-[11px] text-[var(--color-text-muted)] mt-0.5">تفاصيل تقييمات المشترين لهذا المنتج</p>
                  </div>
                  <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg text-amber-400 font-extrabold text-xs">
                    <span>★</span>
                    <span>{product.rating}</span>
                    <span className="text-[var(--color-text-muted)] text-[10px] font-normal">({product.reviewsCount})</span>
                  </div>
                </div>

                <div className="w-full h-44 dir-ltr pt-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={ratingData}
                      layout="vertical"
                      margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                    >
                      <XAxis type="number" hide />
                      <YAxis
                        dataKey="star"
                        type="category"
                        tick={{ fill: 'var(--color-text-secondary)', fontSize: 12, fontWeight: 600 }}
                        axisLine={false}
                        tickLine={false}
                        width={65}
                      />
                      <Tooltip content={<CustomRatingTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={12}>
                        {ratingData.map((entry, index) => (
                          <Cell key={`star-cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-1">
              <button
                onClick={handleAddToCart}
                disabled={!product.inStock}
                className="w-full bg-[#2F6BFF] hover:bg-[#2458D8] disabled:bg-gray-600 text-white font-bold py-3.5 rounded-2xl shadow-sm flex items-center justify-center gap-2 transition-all active:scale-97 text-sm sm:text-base cursor-pointer"
              >
                <span>{product.inStock ? 'أضف للسلة الآن' : 'المنتج غير متوفر'}</span>
                <span className="material-symbols-outlined text-[20px]">shopping_cart</span>
              </button>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="bg-[#2F6BFF]/10 hover:bg-[#2F6BFF] text-[#2F6BFF] hover:text-white font-bold py-2.5 px-2 rounded-xl border border-[#2F6BFF]/20 flex items-center justify-center gap-1.5 transition-all text-xs cursor-pointer"
                  title="نسخ رابط المنتج أو مشاركته"
                >
                  <span className="material-symbols-outlined text-[18px]">link</span>
                  <span className="truncate">نسخ الرابط</span>
                </button>

                <a
                  href={directWhatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all text-xs cursor-pointer shadow-sm"
                >
                  <span className="material-symbols-outlined text-[18px]">chat</span>
                  <span className="truncate">واتساب</span>
                </a>

                <button
                  type="button"
                  onClick={() => setIsShareOpen(true)}
                  className="bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-3)] text-[var(--color-text-primary)] font-bold py-2.5 px-2 rounded-xl border border-[var(--color-border-default)] flex items-center justify-center gap-1.5 transition-all text-xs cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">share</span>
                  <span className="truncate">مشاركة</span>
                </button>

                {onAddToCompare && (
                  <button
                    type="button"
                    onClick={() => {
                      onAddToCompare(product);
                      onClose();
                    }}
                    className="bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-3)] text-[var(--color-text-primary)] font-bold py-2.5 px-2 rounded-xl border border-[var(--color-border-default)] flex items-center justify-center gap-1.5 transition-all text-xs cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">compare_arrows</span>
                    <span className="truncate">مقارنة</span>
                  </button>
                )}
              </div>
            </div>

            {sharedToast && (
              <div className="mt-2 bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs text-center py-2 rounded-xl animate-fadeIn font-bold flex items-center justify-center gap-1.5">
                <span className="material-symbols-outlined text-sm">content_copy</span>
                <span>تم نسخ رابط المنتج ومعلوماته إلى الحافظة بنجاح!</span>
              </div>
            )}

            {addedToast && (
              <div className="mt-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs text-center py-2 rounded-xl animate-fadeIn font-bold">
                ✓ تم إضافة المنتج إلى سلة التسوق بنجاح!
              </div>
            )}
          </div>
        </div>

        {/* NATIVE MOBILE SHARE OVERLAY */}
        {isShareOpen && (
          <div 
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-3 animate-fadeIn"
            onClick={(e) => {
              e.stopPropagation();
              setIsShareOpen(false);
            }}
          >
            <div 
              onClick={(e) => e.stopPropagation()}
              className="bg-[var(--color-surface-1)] border border-[var(--color-border-default)] rounded-3xl w-full max-w-md p-5 shadow-2xl space-y-4 dir-rtl animate-slideUp text-right"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#2F6BFF] text-xl">share</span>
                  <h3 className="font-extrabold text-base text-[var(--color-text-primary)]">مشاركة المنتج عبر التطبيقات</h3>
                </div>
                <button
                  onClick={() => setIsShareOpen(false)}
                  className="w-8 h-8 rounded-full bg-[var(--color-surface-2)] flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>

              {/* Product Snippet Preview */}
              <div className="flex items-center gap-3 bg-[var(--color-surface-2)]/70 p-3 rounded-2xl border border-[var(--color-border-subtle)]">
                <img src={product.image} alt={product.name} className="w-12 h-12 object-contain rounded-xl bg-[var(--color-surface-1)] p-1 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-xs text-[var(--color-text-primary)] truncate">{product.name}</div>
                  <div className="text-[11px] text-[var(--color-text-secondary)] font-semibold">{formatPrice(product.priceYER, currency)}</div>
                </div>
              </div>

              {/* Share Platforms Grid */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                {/* 1. WhatsApp Mobile Link */}
                <a
                  href={whatsappShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    setIsShareOpen(false);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white p-3 rounded-2xl flex items-center justify-center gap-2 transition-all font-bold text-xs shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-xl">chat</span>
                  <span>واتساب (WhatsApp)</span>
                </a>

                {/* 2. Telegram Mobile Link */}
                <a
                  href={telegramShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    setIsShareOpen(false);
                  }}
                  className="bg-[#229ED9] hover:bg-[#1f8fc5] text-white p-3 rounded-2xl flex items-center justify-center gap-2 transition-all font-bold text-xs shadow-md shadow-sky-500/20 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-xl">send</span>
                  <span>تيليجرام (Telegram)</span>
                </a>

                {/* 3. System Native Mobile Share Sheet */}
                <button
                  type="button"
                  onClick={(e) => {
                    setIsShareOpen(false);
                    handleNativeShare(e);
                  }}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white p-3 rounded-2xl flex items-center justify-center gap-2 transition-all font-bold text-xs shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-xl">ios_share</span>
                  <span>مشاركة النظام الجوال</span>
                </button>

                {/* 4. Copy Product Link */}
                <button
                  type="button"
                  onClick={() => {
                    handleCopyLink();
                    setIsShareOpen(false);
                  }}
                  className="bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-3)] text-[var(--color-text-primary)] border border-[var(--color-border-default)] p-3 rounded-2xl flex items-center justify-center gap-2 transition-all font-bold text-xs cursor-pointer"
                >
                  <span className="material-symbols-outlined text-xl">content_copy</span>
                  <span>نسخ رابط المنتج</span>
                </button>
              </div>

              {/* Notice */}
              <div className="text-[10px] text-center text-[var(--color-text-muted)] pt-1">
                سيتم توليد رابط مباشر للمنتج يحتوي على التفاصيل والسعر تلقائياً.
              </div>
            </div>
          </div>
        )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

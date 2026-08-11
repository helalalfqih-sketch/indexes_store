import React, { useRef, useState, useEffect, useCallback } from "react";
import { Product, Currency } from "./types";
import { ProductCard } from "./ProductCard";
import { ProductCardSkeleton } from "./SkeletonLoader";
import { ChevronRight, ChevronLeft, Flame, ArrowLeft, Clock, Zap } from "lucide-react";

interface BestOffersSectionProps {
  bestOffers: Product[];
  currency: Currency;
  favorites: string[];
  isLoading: boolean;
  onToggleFavorite: (product: Product) => void;
  onAddToCart: (product: Product, selectedColor?: string) => void;
  onSelectProduct: (product: Product) => void;
  onViewAll: () => void;
}

export const BestOffersSection: React.FC<BestOffersSectionProps> = ({
  bestOffers,
  currency,
  favorites,
  isLoading,
  onToggleFavorite,
  onAddToCart,
  onSelectProduct,
  onViewAll,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [draggedDistance, setDraggedDistance] = useState(0);

  const [activeIndex, setActiveIndex] = useState(0);

  // Flash Deal Timer State
  const [timeLeft, setTimeLeft] = useState({ hours: 4, minutes: 18, seconds: 45 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 12, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Check scroll positions for active dot indicator
  const updateScrollStatus = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const { scrollLeft: currentScroll, scrollWidth, clientWidth } = el;
    const maxScroll = scrollWidth - clientWidth;
    const absScroll = Math.abs(currentScroll);

    const totalItems = bestOffers.length;
    if (totalItems > 0 && maxScroll > 0) {
      const index = Math.round((absScroll / maxScroll) * (totalItems - 1));
      setActiveIndex(Math.min(Math.max(0, index), totalItems - 1));
    }
  }, [bestOffers.length]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    updateScrollStatus();
    el.addEventListener("scroll", updateScrollStatus, { passive: true });
    window.addEventListener("resize", updateScrollStatus);

    return () => {
      el.removeEventListener("scroll", updateScrollStatus);
      window.removeEventListener("resize", updateScrollStatus);
    };
  }, [updateScrollStatus, isLoading]);

  // Mouse drag handlers for desktop drag-to-scroll
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const el = scrollRef.current;
    if (!el) return;

    setIsDragging(true);
    setStartX(e.pageX - el.offsetLeft);
    setScrollLeft(el.scrollLeft);
    setDraggedDistance(0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const el = scrollRef.current;
    if (!el) return;

    const x = e.pageX - el.offsetLeft;
    const walk = (x - startX) * 1.5; // Drag speed multiplier
    if (Math.abs(walk) > 3) {
      setDraggedDistance(Math.abs(walk));
      el.scrollLeft = scrollLeft - walk;
    }
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  // Scroll controls
  const handleScroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;

    const scrollAmount = el.clientWidth * 0.75;
    const delta = direction === "right" ? scrollAmount : -scrollAmount;

    el.scrollBy({ left: delta, behavior: "smooth" });
  };

  const scrollToItem = (index: number) => {
    const el = scrollRef.current;
    if (!el) return;

    const items = el.querySelectorAll<HTMLElement>("[data-offer-card]");
    if (items[index]) {
      items[index].scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
    }
  };

  return (
    <section className="py-3 relative" id="best-offers-section">
      {/* Header with Flash Deal Badge & Live Countdown Timer */}
      <div className="px-4 sm:px-6 flex flex-wrap justify-between items-center gap-2 mb-3 dir-rtl">
        <div className="flex items-center gap-3">
          <h3 className="text-xl sm:text-2xl font-black flex items-center gap-2 text-[var(--color-text-primary)]">
            <span>صفقات خاطفة</span>
            <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400 fill-amber-400 animate-pulse" />
          </h3>

          {/* Flash Timer Pills */}
          <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500/10 to-amber-500/5 border border-amber-500/30 px-2.5 py-1 rounded-full text-xs font-mono font-bold text-amber-400 shadow-sm">
            <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
            <span>
              {String(timeLeft.hours).padStart(2, "0")}:{String(timeLeft.minutes).padStart(2, "0")}:
              {String(timeLeft.seconds).padStart(2, "0")}
            </span>
            <Zap className="w-3 h-3 text-amber-300 fill-amber-300" />
          </div>
        </div>

        <button
          onClick={onViewAll}
          className="text-[#2F6BFF] text-xs sm:text-sm flex items-center gap-1 font-bold hover:underline cursor-pointer group"
        >
          <span>عرض كل العروض</span>
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        </button>
      </div>

      {/* Offers Carousel Container */}
      <div className="relative group/scroll">
        {/* Navigation Arrows */}
        {/* Right Arrow */}
        <button
          type="button"
          onClick={() => handleScroll("right")}
          className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[var(--color-surface-1)]/95 backdrop-blur-md border border-[var(--color-border-default)] text-[var(--color-text-primary)] flex items-center justify-center shadow-lg hover:bg-[#2F6BFF] hover:text-white hover:border-[#2F6BFF] transition-all cursor-pointer opacity-90 hover:opacity-100 active:scale-95"
          aria-label="التمرير لليمين"
          title="التمرير لليمين"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Left Arrow */}
        <button
          type="button"
          onClick={() => handleScroll("left")}
          className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[var(--color-surface-1)]/95 backdrop-blur-md border border-[var(--color-border-default)] text-[var(--color-text-primary)] flex items-center justify-center shadow-lg hover:bg-[#2F6BFF] hover:text-white hover:border-[#2F6BFF] transition-all cursor-pointer opacity-90 hover:opacity-100 active:scale-95"
          aria-label="التمرير لليسار"
          title="التمرير لليسار"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Scrollable Container with Mouse Drag & Touch Support */}
        <div
          ref={scrollRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          className={`px-4 sm:px-8 flex gap-3 sm:gap-4 overflow-x-auto no-scrollbar snap-x pb-3 pt-1 cursor-grab ${
            isDragging ? "cursor-grabbing select-none snap-none" : "scroll-smooth"
          }`}
          style={{ scrollbarWidth: "none", msOverflowStyle: "none", touchAction: "pan-x pan-y" }}
        >
          {isLoading
            ? [1, 2, 3, 4, 5].map((idx) => (
                <div key={idx} className="shrink-0" data-offer-card>
                  <ProductCardSkeleton variant="horizontal" />
                </div>
              ))
            : bestOffers.map((product) => (
                <div
                  key={product.id}
                  data-offer-card
                  className="shrink-0 pointer-events-auto"
                  onClickCapture={(e) => {
                    // Prevent accidental clicks when dragging
                    if (draggedDistance > 8) {
                      e.stopPropagation();
                      e.preventDefault();
                    }
                  }}
                >
                  <ProductCard
                    product={product}
                    currency={currency}
                    isFavorite={favorites.includes(product.id)}
                    onToggleFavorite={onToggleFavorite}
                    onAddToCart={(prod, col) => onAddToCart(prod, col)}
                    onSelectProduct={(prod) => {
                      if (draggedDistance <= 8) {
                        onSelectProduct(prod);
                      }
                    }}
                    variant="horizontal"
                  />
                </div>
              ))}
        </div>

        {/* Interactive Pagination Dots Indicator */}
        {!isLoading && bestOffers.length > 0 && (
          <div className="flex items-center justify-center gap-1.5 mt-2">
            {bestOffers.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => scrollToItem(idx)}
                aria-label={`الانتقال للعرض ${idx + 1}`}
                className={`transition-all cursor-pointer ${
                  activeIndex === idx
                    ? "w-6 h-1.5 bg-[#2F6BFF] rounded-full shadow-sm shadow-blue-500/30"
                    : "w-1.5 h-1.5 bg-[var(--color-border-subtle)] hover:bg-[var(--color-text-secondary)] rounded-full"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Check, Sparkles } from 'lucide-react';
import { Product } from './types';

const NEUTRAL_FALLBACK_IMAGE = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect width="400" height="400" fill="%23181825"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%2371717a" font-family="sans-serif" font-size="16">لا تتوفر صورة</text></svg>';

export interface FlyingCartItem {
  id: string;
  product: Product;
  startX: number;
  startY: number;
  selectedColor?: string;
}

interface AddToCartAnimationProps {
  activeFlyingItems: FlyingCartItem[];
  onAnimationComplete: (id: string) => void;
  onOpenCart?: () => void;
  lastAddedProduct?: { product: Product; quantity: number; selectedColor?: string; timestamp: number } | null;
}

export const AddToCartAnimationOverlay: React.FC<AddToCartAnimationProps> = ({
  activeFlyingItems,
  onAnimationComplete,
  onOpenCart,
  lastAddedProduct,
}) => {
  const [showToast, setShowToast] = useState(false);
  const [currentToast, setCurrentToast] = useState<typeof lastAddedProduct>(null);

  // Trigger floating popup banner whenever a new product is added
  useEffect(() => {
    if (lastAddedProduct && lastAddedProduct.timestamp) {
      setCurrentToast(lastAddedProduct);
      setShowToast(true);
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [lastAddedProduct]);

  // Determine cart icon location on screen (defaults to top-left for RTL header)
  const getCartTargetPosition = () => {
    if (typeof document === 'undefined') return { x: 36, y: 32 };
    const cartButton = document.querySelector('[aria-label="سلة التسوق"]');
    if (cartButton) {
      const rect = cartButton.getBoundingClientRect();
      return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
    }
    return { x: 36, y: 32 };
  };

  const target = getCartTargetPosition();

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden dir-rtl">
      {/* 1. FLYING PRODUCT PARTICLES ANIMATION */}
      <AnimatePresence>
        {activeFlyingItems.map((item) => {
          const startX = item.startX || (typeof window !== 'undefined' ? window.innerWidth / 2 : 200);
          const startY = item.startY || (typeof window !== 'undefined' ? window.innerHeight / 2 : 400);

          // Midpoint for parabolic flight trajectory
          const midX = (startX + target.x) / 2 + (startX > target.x ? -30 : 30);
          const midY = Math.min(startX, target.y) - 90;

          return (
            <React.Fragment key={item.id}>
              {/* Trailing Glow Sparkles */}
              <motion.div
                initial={{ opacity: 0, scale: 0.5, x: startX, y: startY }}
                animate={{
                  opacity: [0, 0.8, 0],
                  scale: [0.5, 1.2, 0.2],
                  x: [startX, midX, target.x],
                  y: [startY, midY, target.y],
                }}
                transition={{ duration: 0.75, ease: 'easeOut' }}
                className="absolute w-8 h-8 rounded-full bg-blue-500/30 blur-md pointer-events-none"
              />

              {/* Main Flying Product Card/Thumbnail */}
              <motion.div
                initial={{
                  x: startX - 28,
                  y: startY - 28,
                  scale: 1,
                  opacity: 1,
                  rotate: 0,
                }}
                animate={{
                  x: [startX - 28, midX - 20, target.x - 16],
                  y: [startY - 28, midY - 20, target.y - 16],
                  scale: [1, 1.25, 0.25],
                  rotate: [0, -15, 20, -5],
                  opacity: [1, 1, 0.9, 0],
                }}
                transition={{
                  duration: 0.75,
                  ease: [0.2, 0.8, 0.2, 1],
                }}
                onAnimationComplete={() => onAnimationComplete(item.id)}
                className="absolute z-50 w-14 h-14 rounded-2xl bg-[var(--color-surface-1)] border-2 border-[#2F6BFF] shadow-2xl shadow-blue-500/50 p-1 flex items-center justify-center overflow-hidden"
              >
                <img
                  src={item.product.image || NEUTRAL_FALLBACK_IMAGE}
                  alt={item.product.name}
                  onError={(e) => { e.currentTarget.src = NEUTRAL_FALLBACK_IMAGE; }}
                  className="w-full h-full object-contain rounded-xl"
                />
                <div className="absolute inset-0 bg-blue-500/10 backdrop-blur-[1px]" />
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  className="absolute -top-1 -right-1 bg-amber-400 text-black p-0.5 rounded-full"
                >
                  <Sparkles className="w-3 h-3" />
                </motion.div>
              </motion.div>
            </React.Fragment>
          );
        })}
      </AnimatePresence>

      {/* 2. ELEGANT BOTTOM FLOATING ACTION TOAST POPUP */}
      <AnimatePresence>
        {showToast && currentToast && (
          <motion.div
            key={`add-cart-toast-${currentToast.timestamp}`}
            initial={{ opacity: 0, y: 50, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: 'spring', damping: 22, stiffness: 300 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md bg-[var(--color-surface-1)]/95 backdrop-blur-xl border border-[#2F6BFF]/40 shadow-2xl rounded-2xl p-3 sm:p-3.5 flex items-center justify-between gap-3 text-right pointer-events-auto"
          >
            {/* Left Product Image & Status */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="relative w-12 h-12 rounded-xl bg-[var(--color-surface-2)] p-1 border border-[var(--color-border-default)] shrink-0 overflow-hidden">
                <img
                  src={currentToast.product.image || NEUTRAL_FALLBACK_IMAGE}
                  alt={currentToast.product.name}
                  onError={(e) => { e.currentTarget.src = NEUTRAL_FALLBACK_IMAGE; }}
                  className="w-full h-full object-contain"
                />
                <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 shadow-sm">
                  <Check className="w-3 h-3" />
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400">
                  <Sparkles className="w-3 h-3" />
                  <span>تمت الإضافة إلى سلة التسوق!</span>
                </div>
                <h5 className="text-xs sm:text-sm font-black text-[var(--color-text-primary)] truncate">
                  {currentToast.product.name}
                </h5>
                <p className="text-[10px] text-[var(--color-text-secondary)] truncate">
                  الكمية: {currentToast.quantity} {currentToast.selectedColor ? `• اللون: ${currentToast.selectedColor}` : ''}
                </p>
              </div>
            </div>

            {/* Right Action Button: View Cart */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowToast(false);
                  if (onOpenCart) onOpenCart();
                }}
                className="px-3.5 py-2 bg-[#2F6BFF] hover:bg-[#2458D8] active:scale-95 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-blue-500/25"
              >
                <span>السلة</span>
                <ShoppingCart className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setShowToast(false)}
                className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors rounded-lg hover:bg-[var(--color-surface-2)] cursor-pointer"
                title="إغلاق"
              >
                ✕
              </button>
            </div>

            {/* Progress Timer Line */}
            <motion.div
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: 4, ease: 'linear' }}
              className="absolute bottom-0 left-3 right-3 h-0.5 bg-gradient-to-r from-[#2F6BFF] to-emerald-400 rounded-full origin-right"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

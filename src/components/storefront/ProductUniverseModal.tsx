import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Compass, Heart, Info, ShoppingCart, Shuffle, Sparkles, X } from "lucide-react";
import type { Currency, Product } from "./types";
import { formatPrice } from "./currency";

interface ProductUniverseModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  currency: Currency;
  favorites: string[];
  onToggleFavorite: (product: Product) => void;
  onAddToCart: (product: Product, quantity: number) => void;
  onSelectProductDetails: (product: Product) => void;
  onOpenStory?: (product: Product) => void;
  onOpenCart?: () => void;
}

const UNIVERSE_LIMIT = 14;

export const ProductUniverseModal: React.FC<ProductUniverseModalProps> = ({
  isOpen,
  onClose,
  products,
  currency,
  favorites,
  onToggleFavorite,
  onAddToCart,
  onSelectProductDetails,
  onOpenStory,
  onOpenCart,
}) => {
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [seed, setSeed] = useState(0);

  const visibleProducts = useMemo(() => {
    if (!products.length) return [];
    const offset = seed % products.length;
    return [...products.slice(offset), ...products.slice(0, offset)].slice(0, UNIVERSE_LIMIT);
  }, [products, seed]);

  const focused = useMemo(
    () => visibleProducts.find((product) => product.id === focusedId) ?? visibleProducts[0] ?? null,
    [focusedId, visibleProducts],
  );

  if (!isOpen) return null;

  const reshuffle = () => {
    if (!products.length) return;
    setSeed((value) => value + Math.max(1, Math.floor(products.length / 3)));
    setFocusedId(null);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[130] overflow-hidden bg-[#05060a] text-white"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(47,107,255,0.22),transparent_28%),radial-gradient(circle_at_30%_20%,rgba(168,85,247,0.12),transparent_30%),radial-gradient(circle_at_70%_75%,rgba(16,185,129,0.10),transparent_28%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-35 [background-image:radial-gradient(rgba(255,255,255,0.35)_0.7px,transparent_0.7px)] [background-size:24px_24px]" />

        <header className="dir-rtl relative z-20 flex items-center justify-between border-b border-white/10 bg-black/30 px-4 py-3 backdrop-blur-xl sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-violet-400/30 bg-violet-500/15 text-violet-300">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-black sm:text-lg">كون منتجات إندكس</h2>
              <p className="text-[11px] text-white/55">استكشف المنتجات الحقيقية بطريقة تفاعلية</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={reshuffle} className="flex cursor-pointer items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white/80 hover:bg-white/10">
              <Shuffle className="h-4 w-4" /> تبديل
            </button>
            <button type="button" onClick={onClose} aria-label="إغلاق" className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-white/5 hover:bg-white/10">
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        <div className="relative z-10 mx-auto grid h-[calc(100vh-68px)] max-w-7xl grid-rows-[1fr_auto] gap-3 p-3 sm:grid-cols-[1fr_360px] sm:grid-rows-1 sm:p-5">
          <section className="relative min-h-[420px] overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.025]">
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full border border-blue-400/20 shadow-[0_0_100px_rgba(47,107,255,0.3)] sm:h-72 sm:w-72" />
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-violet-400/10 sm:h-[560px] sm:w-[560px]" />

            {visibleProducts.map((product, index) => {
              const total = Math.max(visibleProducts.length, 1);
              const angle = (index / total) * Math.PI * 2 - Math.PI / 2;
              const radiusX = 38;
              const radiusY = 32;
              const x = 50 + Math.cos(angle) * radiusX;
              const y = 50 + Math.sin(angle) * radiusY;
              const isFocused = focused?.id === product.id;
              return (
                <motion.button
                  type="button"
                  key={product.id}
                  onClick={() => setFocusedId(product.id)}
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: isFocused ? 1.12 : 1 }}
                  transition={{ delay: index * 0.02, type: "spring", stiffness: 180, damping: 18 }}
                  style={{ left: `${x}%`, top: `${y}%` }}
                  className={`absolute z-10 -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-2xl border p-1.5 backdrop-blur-xl transition-shadow ${
                    isFocused
                      ? "border-blue-400/70 bg-blue-500/20 shadow-[0_0_30px_rgba(47,107,255,0.55)]"
                      : "border-white/15 bg-black/45 hover:border-violet-400/60 hover:shadow-[0_0_22px_rgba(139,92,246,0.35)]"
                  }`}
                >
                  <img src={product.image} alt={product.name} className="h-12 w-12 rounded-xl bg-white/5 object-contain p-1 sm:h-16 sm:w-16" />
                </motion.button>
              );
            })}

            <div className="pointer-events-none absolute left-1/2 top-1/2 flex h-28 w-28 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-blue-400/30 bg-blue-500/10 shadow-[0_0_55px_rgba(47,107,255,0.35)] backdrop-blur-md sm:h-36 sm:w-36">
              <div className="text-center">
                <Sparkles className="mx-auto mb-1 h-5 w-5 text-blue-300" />
                <div className="text-xs font-black">INDEXES</div>
                <div className="text-[9px] text-white/50">PRODUCT UNIVERSE</div>
              </div>
            </div>
          </section>

          <aside className="dir-rtl rounded-[28px] border border-white/10 bg-black/35 p-4 backdrop-blur-xl sm:overflow-y-auto">
            {focused ? (
              <div className="space-y-4">
                <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                  <img src={focused.image} alt={focused.name} className="mx-auto h-44 w-full object-contain" />
                  <button type="button" onClick={() => onToggleFavorite(focused)} className="absolute left-3 top-3 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-black/55">
                    <Heart className={`h-4 w-4 ${favorites.includes(focused.id) ? "fill-rose-400 text-rose-400" : "text-white"}`} />
                  </button>
                </div>

                <div>
                  <h3 className="text-lg font-black leading-snug">{focused.name}</h3>
                  <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-white/55">{focused.description}</p>
                </div>

                <div className="text-xl font-black text-blue-300">{formatPrice(focused.priceYER, currency)}</div>

                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => onSelectProductDetails(focused)} className="flex cursor-pointer items-center justify-center gap-1.5 rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-xs font-bold hover:bg-white/10">
                    <Info className="h-4 w-4" /> التفاصيل
                  </button>
                  {onOpenStory ? (
                    <button type="button" onClick={() => onOpenStory(focused)} className="flex cursor-pointer items-center justify-center gap-1.5 rounded-2xl border border-violet-400/20 bg-violet-500/10 px-3 py-3 text-xs font-bold text-violet-200 hover:bg-violet-500/15">
                      <Sparkles className="h-4 w-4" /> القصة
                    </button>
                  ) : null}
                </div>

                <button type="button" onClick={() => onAddToCart(focused, 1)} className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#2F6BFF] px-4 py-3.5 text-sm font-black shadow-lg shadow-blue-500/20 hover:bg-[#2458D8]">
                  <ShoppingCart className="h-4 w-4" /> إضافة إلى السلة
                </button>
                {onOpenCart ? (
                  <button type="button" onClick={onOpenCart} className="w-full cursor-pointer rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-bold text-white/75 hover:bg-white/10">
                    فتح السلة
                  </button>
                ) : null}
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-center text-sm text-white/50">لا توجد منتجات متاحة.</div>
            )}
          </aside>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

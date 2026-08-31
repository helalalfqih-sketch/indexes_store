import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CartItem, Currency, Product } from "./types";
import { formatPrice } from "./currency";
import { STORE_INFO } from "./constants";
import {
  ShoppingCart,
  X,
  Trash2,
  Plus,
  Minus,
  Tag,
  ArrowLeft,
  Truck,
  Sparkles,
  CheckCircle2,
  Share2,
  Heart,
  CheckSquare2,
} from "lucide-react";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  currency: Currency;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onCheckout: (couponDiscountPercent: number) => void;
  onOpenShareCart?: () => void;
  favorites?: string[];
  onSaveForLater?: (item: CartItem) => void;
  catalogProducts?: Product[];
  onAddRecommended?: (product: Product) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  currency,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  onOpenShareCart,
  favorites = [],
  onSaveForLater,
  catalogProducts = [],
  onAddRecommended,
}) => {
  const [coupon, setCoupon] = useState("");
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState("");
  const [couponAppliedText, setCouponAppliedText] = useState("");

  const subtotalYER = cartItems.reduce(
    (sum, item) => sum + item.product.priceYER * item.quantity,
    0,
  );

  const isFreeShipping = subtotalYER >= STORE_INFO.freeShippingThresholdYER;
  const shippingFeeYER = isFreeShipping || cartItems.length === 0 ? 0 : 3000;
  const discountAmountYER = (subtotalYER * couponDiscount) / 100;
  const totalYER = subtotalYER - discountAmountYER + shippingFeeYER;
  const selectedCount = selectedItemIds.length;
  const recommendedProducts = catalogProducts
    .filter((product) => !cartItems.some((item) => item.product.id === product.id))
    .slice(0, 4);

  useEffect(() => {
    const availableIds = new Set(cartItems.map((item) => item.product.id));
    setSelectedItemIds((ids) => ids.filter((id) => availableIds.has(id)));
  }, [cartItems]);

  const toggleItemSelection = (productId: string) => {
    setSelectedItemIds((ids) =>
      ids.includes(productId) ? ids.filter((id) => id !== productId) : [...ids, productId],
    );
  };

  const selectAllItems = () => {
    setSelectedItemIds(
      selectedCount === cartItems.length ? [] : cartItems.map((item) => item.product.id),
    );
  };

  const removeSelectedItems = () => {
    selectedItemIds.forEach((productId) => onRemoveItem(productId));
    setSelectedItemIds([]);
  };

  const progressPercent = Math.min(
    100,
    Math.round((subtotalYER / STORE_INFO.freeShippingThresholdYER) * 100),
  );

  const applyCoupon = (codeToApply?: string) => {
    const code = (codeToApply || coupon).trim().toUpperCase();
    if (code === "INDEXES10") {
      setCouponDiscount(10);
      setCouponAppliedText("تم تطبيق كود الخصم (10% خصم)! 🎉");
      setCouponError("");
      setCoupon("INDEXES10");
    } else if (code === "INDEXES20") {
      setCouponDiscount(20);
      setCouponAppliedText("تم تطبيق كود الخصم (20% خصم VIP)! 🔥");
      setCouponError("");
      setCoupon("INDEXES20");
    } else {
      setCouponError("كود الخصم غير صحيح أو منتهي الصلاحية");
      setCouponAppliedText("");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="cart-drawer-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex justify-end bg-black/80 backdrop-blur-md dir-rtl"
        >
          {/* Backdrop click to close */}
          <div className="flex-1 cursor-pointer" onClick={onClose} />

          {/* Drawer Content */}
          <motion.div
            key="cart-drawer-content"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="w-full max-w-md bg-[var(--color-surface-1)] border-r border-[var(--color-border-default)] h-full flex flex-col p-4 sm:p-6 shadow-2xl relative overflow-hidden"
          >
            {/* Header */}
            <div className="min-h-0 flex-1 overflow-y-auto no-scrollbar pr-0.5">
              <div className="flex items-center justify-between gap-3 pb-4 border-b border-[var(--color-border-default)] mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-[#2F6BFF]/10 border border-[#2F6BFF]/30 flex items-center justify-center text-[#2F6BFF]">
                    <ShoppingCart className="w-5 h-5 text-[#2F6BFF]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-[var(--color-text-primary)]">
                      سلة التسوق
                    </h3>
                    <p className="text-[11px] text-[var(--color-text-secondary)] font-medium">
                      {cartItems.reduce((acc, i) => acc + i.quantity, 0)} منتجات مضافة
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {onOpenShareCart && (
                    <button
                      onClick={onOpenShareCart}
                      aria-label="مشاركة أو استعادة السلة"
                      title="حفظ ومشاركة السلة"
                      className="w-9 h-9 rounded-2xl bg-[#2F6BFF]/10 border border-[#2F6BFF]/30 flex items-center justify-center text-[#2F6BFF] hover:bg-[#2F6BFF]/20 transition-colors cursor-pointer"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={onClose}
                    aria-label="إغلاق السلة"
                    className="w-9 h-9 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-border-default)] flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {cartItems.length > 0 && (
                <div className="mb-3 flex items-center justify-between rounded-xl bg-[var(--color-surface-2)] px-3 py-2 text-[11px] font-bold text-[var(--color-text-secondary)]">
                  <button
                    type="button"
                    onClick={selectAllItems}
                    className="text-[#2F6BFF] hover:underline"
                  >
                    {selectedCount === cartItems.length ? "إلغاء تحديد الكل" : "تحديد الكل"}
                  </button>
                  {selectedCount > 0 ? (
                    <button
                      type="button"
                      onClick={removeSelectedItems}
                      className="flex items-center gap-1 text-rose-500 hover:underline"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> حذف المحدد ({selectedCount})
                    </button>
                  ) : (
                    <span>تعديل محتويات السلة</span>
                  )}
                </div>
              )}

              {/* Free Shipping Progress Indicator */}
              <div className="bg-[#eef6ff] dark:bg-[var(--color-surface-2)] p-3.5 rounded-2xl border border-[#b8d7ff] dark:border-[var(--color-border-default)] mb-4 relative overflow-hidden">
                <div className="flex justify-between items-center text-xs text-[var(--color-text-secondary)] font-bold mb-2">
                  <span className="flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-[#2F6BFF]" />
                    {isFreeShipping ? (
                      <strong className="text-emerald-400 font-black">
                        🎉 مبروك! حصلت على شحن مجاني!
                      </strong>
                    ) : (
                      <span>
                        تبقي{" "}
                        <strong className="text-[#2F6BFF] font-black">
                          {formatPrice(STORE_INFO.freeShippingThresholdYER - subtotalYER, currency)}
                        </strong>{" "}
                        للحصول على شحن مجاني
                      </span>
                    )}
                  </span>
                  <span className="text-amber-400 font-mono font-bold">{progressPercent}%</span>
                </div>
                <div className="w-full bg-[var(--color-surface-3)] h-2 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="bg-gradient-to-r from-[#2F6BFF] to-blue-400 h-full rounded-full"
                  />
                </div>
              </div>

              {/* Item List */}
              {cartItems.length === 0 ? (
                <div className="py-16 text-center text-[var(--color-text-muted)] flex flex-col items-center gap-3">
                  <div className="w-20 h-20 rounded-full bg-[var(--color-surface-2)] border border-[var(--color-border-default)] flex items-center justify-center text-[var(--color-text-muted)]">
                    <ShoppingCart className="w-10 h-10 stroke-[1.5]" />
                  </div>
                  <p className="text-base font-bold text-[var(--color-text-primary)]">
                    سلة التسوق فارغة حالياً
                  </p>
                  <p className="text-xs text-[var(--color-text-secondary)] max-w-xs">
                    استكشف أحدث عروض متجر إندكس وأضف المنتجات إلى سلتك
                  </p>
                  <button
                    onClick={onClose}
                    className="mt-3 bg-[#2F6BFF] hover:bg-[#2458D8] text-white font-bold px-6 py-2.5 rounded-full text-xs transition-all shadow-md shadow-blue-500/20 cursor-pointer"
                  >
                    تصفح المنتجات الآن
                  </button>
                </div>
              ) : (
                <div className="space-y-3 pr-1">
                  {cartItems.map((item) => {
                    const isSelected = selectedItemIds.includes(item.product.id);
                    const isSaved = favorites.includes(item.product.id);
                    return (
                      <div
                        key={item.product.id}
                        className={`bg-[var(--color-surface-2)] p-3 rounded-2xl border flex items-center gap-2.5 relative group transition-all ${isSelected ? "border-[#2F6BFF] ring-2 ring-[#2F6BFF]/10" : "border-[var(--color-border-subtle)] hover:border-[var(--color-border-default)]"}`}
                      >
                        <button
                          type="button"
                          onClick={() => toggleItemSelection(item.product.id)}
                          aria-label={isSelected ? "إلغاء تحديد المنتج" : "تحديد المنتج"}
                          className={`shrink-0 ${isSelected ? "text-[#2F6BFF]" : "text-[var(--color-text-muted)]"}`}
                        >
                          <CheckSquare2 className="h-4.5 w-4.5" />
                        </button>

                        {/* Thumbnail */}
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="w-16 h-16 object-contain bg-[var(--color-surface-1)] rounded-xl p-1 border border-[var(--color-border-default)] shrink-0"
                        />

                        {/* Info */}
                        <div className="flex-grow min-w-0">
                          <h4 className="text-xs sm:text-sm font-bold text-[var(--color-text-primary)] truncate">
                            {item.product.name}
                          </h4>
                          {item.selectedColor && (
                            <div className="flex items-center gap-1 mt-1 text-[11px] text-[var(--color-text-muted)]">
                              <span>اللون:</span>
                              <span
                                className="w-3 h-3 rounded-full border border-white/20 inline-block"
                                style={{ backgroundColor: item.selectedColor }}
                              />
                            </div>
                          )}
                          <span className="text-[#2F6BFF] font-black text-xs sm:text-sm block mt-1">
                            {formatPrice(item.product.priceYER, currency)}
                          </span>
                        </div>

                        {/* Quantity Controls & Delete */}
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <div className="flex items-center gap-1">
                            {onSaveForLater && (
                              <button
                                type="button"
                                onClick={() => onSaveForLater(item)}
                                className={`p-1 transition-colors ${isSaved ? "text-rose-500" : "text-[var(--color-text-muted)] hover:text-rose-400"}`}
                                aria-label="حفظ لوقت لاحق"
                                title="حفظ لوقت لاحق"
                              >
                                <Heart className={`h-4 w-4 ${isSaved ? "fill-current" : ""}`} />
                              </button>
                            )}
                            <button
                              onClick={() => onRemoveItem(item.product.id)}
                              className="text-[var(--color-text-muted)] hover:text-rose-400 transition-colors p-1 cursor-pointer"
                              aria-label="حذف المنتج"
                              title="حذف من السلة"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="flex items-center gap-1.5 bg-[var(--color-surface-3)] border border-[var(--color-border-default)] px-2 py-1 rounded-xl">
                            <button
                              onClick={() =>
                                onUpdateQuantity(item.product.id, Math.max(1, item.quantity - 1))
                              }
                              className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] font-bold text-xs p-0.5 cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-[var(--color-text-primary)] font-black text-xs px-1">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                              className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] font-bold text-xs p-0.5 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {cartItems.length > 0 && recommendedProducts.length > 0 && (
                <section
                  className="mt-5 border-t border-[var(--color-border-subtle)] pt-4"
                  aria-label="قد يعجبك أيضاً"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="text-sm font-black text-[var(--color-text-primary)]">
                      أكمل طلبك
                    </h4>
                    <span className="text-[10px] text-[var(--color-text-muted)]">
                      اختيارات مناسبة
                    </span>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                    {recommendedProducts.map((product) => (
                      <button
                        type="button"
                        key={`cart-recommended-${product.id}`}
                        onClick={() => onAddRecommended?.(product)}
                        className="w-20 shrink-0 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-2)] p-1.5 text-right"
                      >
                        <img
                          src={product.image}
                          alt={product.name}
                          className="h-14 w-full rounded-lg bg-[var(--color-surface-1)] object-contain"
                          loading="lazy"
                        />
                        <span className="mt-1 block truncate text-[10px] font-bold text-[var(--color-text-primary)]">
                          {product.name}
                        </span>
                        <span className="mt-0.5 block text-[10px] font-black text-[#2F6BFF]">
                          {formatPrice(product.priceYER, currency)}
                        </span>
                      </button>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Footer Summary & Checkout */}
            {cartItems.length > 0 && (
              <div className="shrink-0 border-t border-[var(--color-border-default)] bg-[var(--color-surface-1)] pt-3 space-y-3 mt-3">
                {/* Coupon Code Section */}
                <div>
                  <div className="flex gap-2">
                    <div className="relative flex-grow">
                      <input
                        type="text"
                        value={coupon}
                        onChange={(e) => setCoupon(e.target.value)}
                        placeholder="كود الخصم (INDEXES10)"
                        className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border-default)] rounded-xl pl-8 pr-3 py-2 text-xs text-[var(--color-text-primary)] uppercase placeholder-[var(--color-text-muted)] focus:border-[#2F6BFF] outline-none font-mono"
                      />
                      <Tag className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                    </div>
                    <button
                      onClick={() => applyCoupon()}
                      className="bg-[#2F6BFF]/15 hover:bg-[#2F6BFF] text-[#2F6BFF] hover:text-white border border-[#2F6BFF]/30 text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer shrink-0"
                    >
                      تطبيق
                    </button>
                  </div>

                  {/* Coupon Quick Preset Chips */}
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="text-[10px] text-[var(--color-text-muted)] font-medium">
                      جرّب:
                    </span>
                    <button
                      onClick={() => applyCoupon("INDEXES10")}
                      className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-md hover:bg-blue-500/20 transition-colors font-mono font-bold"
                    >
                      INDEXES10 (-10%)
                    </button>
                    <button
                      onClick={() => applyCoupon("INDEXES20")}
                      className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-md hover:bg-amber-500/20 transition-colors font-mono font-bold"
                    >
                      INDEXES20 (-20% VIP)
                    </button>
                  </div>

                  {couponAppliedText && (
                    <p className="text-emerald-400 text-xs mt-1.5 flex items-center gap-1 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{couponAppliedText}</span>
                    </p>
                  )}
                  {couponError && (
                    <p className="text-rose-400 text-xs mt-1 font-medium">{couponError}</p>
                  )}
                </div>

                {/* Price Calculations */}
                <div className="space-y-2 text-xs text-[var(--color-text-secondary)] pt-3 border-t border-[var(--color-border-subtle)]">
                  <div className="flex justify-between font-medium">
                    <span>المجموع الفرعي:</span>
                    <span className="font-bold text-[var(--color-text-primary)]">
                      {formatPrice(subtotalYER, currency)}
                    </span>
                  </div>

                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-emerald-400 font-bold">
                      <span>خصم الكوبون ({couponDiscount}%):</span>
                      <span>-{formatPrice(discountAmountYER, currency)}</span>
                    </div>
                  )}

                  <div className="flex justify-between font-medium">
                    <span>رسوم الشحن والتوصيل:</span>
                    <span className="font-bold text-[var(--color-text-primary)]">
                      {isFreeShipping ? (
                        <strong className="text-emerald-400 font-black">مجاني 🚚</strong>
                      ) : (
                        formatPrice(shippingFeeYER, currency)
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-sm font-black text-[var(--color-text-primary)] pt-2.5 border-t border-[var(--color-border-default)]">
                    <span>الإجمالي النهائي:</span>
                    <span className="text-[#2F6BFF] text-lg font-black">
                      {formatPrice(totalYER, currency)}
                    </span>
                  </div>
                </div>

                {/* Checkout Button */}
                <button
                  onClick={() => onCheckout(couponDiscount)}
                  className="w-full bg-gradient-to-r from-[#2F6BFF] to-[#3B75FF] hover:from-[#2458D8] hover:to-[#2F6BFF] text-white font-black py-3.5 rounded-2xl shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 transition-all active:scale-98 text-sm cursor-pointer"
                >
                  <span>المتابعة لإتمام الطلب</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

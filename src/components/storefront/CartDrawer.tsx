import React, { useState } from "react";
import { CartItem, Currency } from "./types";
import { formatPrice } from "./currency";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  currency: Currency;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onCheckout: (couponDiscountPercent: number) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  currency,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
}) => {
  const [coupon, setCoupon] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState("");
  const [couponAppliedText, setCouponAppliedText] = useState("");

  if (!isOpen) return null;

  const freeShippingThresholdYER = 30000;

  const subtotalYER = cartItems.reduce(
    (sum, item) => sum + item.product.priceYER * item.quantity,
    0,
  );

  const isFreeShipping = subtotalYER >= freeShippingThresholdYER;
  const shippingFeeYER = isFreeShipping || cartItems.length === 0 ? 0 : 3000;
  const discountAmountYER = (subtotalYER * couponDiscount) / 100;
  const totalYER = subtotalYER - discountAmountYER + shippingFeeYER;

  const progressPercent = Math.min(100, Math.round((subtotalYER / freeShippingThresholdYER) * 100));

  const applyCoupon = () => {
    if (coupon.trim().toUpperCase() === "INDEXES10") {
      setCouponDiscount(10);
      setCouponAppliedText("تم تطبيق كود الخصم (10% خصم)!");
      setCouponError("");
    } else if (coupon.trim().toUpperCase() === "INDEXES20") {
      setCouponDiscount(20);
      setCouponAppliedText("تم تطبيق كود الخصم (20% خصم VIP)!");
      setCouponError("");
    } else {
      setCouponError("كود الخصم غير صحيح أو منتهي الصلاحية");
      setCouponAppliedText("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-fadeIn text-right dir-rtl">
      {/* Backdrop click to close */}
      <div className="flex-1" onClick={onClose} />

      {/* Drawer */}
      <div className="w-full max-w-md bg-[#100B1A] border-r border-gray-800 h-full flex flex-col justify-between p-6 shadow-2xl relative overflow-y-auto no-scrollbar">
        {/* Header */}
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-gray-800 mb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[28px] text-[#7B3FFF]">
                shopping_cart
              </span>
              <h3 className="text-xl font-bold text-white">سلة التسوق</h3>
              <span className="bg-[#7B3FFF]/15 text-[#7B3FFF] text-xs font-bold px-2.5 py-0.5 rounded-full border border-[#7B3FFF]/30">
                {cartItems.reduce((acc, i) => acc + i.quantity, 0)} منتجات
              </span>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-[#18112B] border border-gray-800 flex items-center justify-center text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* Free Shipping Progress Indicator */}
          <div className="bg-[#18112B] p-4 rounded-2xl border border-gray-800 mb-5">
            <div className="flex justify-between items-center text-xs text-gray-300 font-semibold mb-2">
              <span>
                {isFreeShipping ? (
                  <strong className="text-emerald-400">🎉 مبروك! حصلت على شحن مجاني!</strong>
                ) : (
                  <span>
                    تبقي{" "}
                    <strong className="text-[#7B3FFF]">
                      {formatPrice(freeShippingThresholdYER - subtotalYER, currency)}
                    </strong>{" "}
                    للحصول على شحن مجاني 🚚
                  </span>
                )}
              </span>
              <span>{progressPercent}%</span>
            </div>
            <div className="w-full bg-[#120D22] h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#7B3FFF] to-[#3B82F6] h-full transition-all duration-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Item List */}
          {cartItems.length === 0 ? (
            <div className="py-12 text-center text-gray-500 flex flex-col items-center gap-3">
              <span className="material-symbols-outlined text-[64px] text-gray-600">
                remove_shopping_cart
              </span>
              <p className="text-base font-medium">سلة التسوق فارغة حالياً</p>
              <button
                onClick={onClose}
                className="mt-2 text-[#7B3FFF] font-bold text-sm hover:underline"
              >
                تصفح المنتجات الآن
              </button>
            </div>
          ) : (
            <div className="space-y-4 max-h-[380px] overflow-y-auto no-scrollbar pr-1">
              {cartItems.map((item) => (
                <div
                  key={item.product.id}
                  className="bg-[#18112B] p-3.5 rounded-2xl border border-gray-800/60 flex items-center gap-3 relative group"
                >
                  {/* Thumbnail */}
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-16 h-16 object-contain bg-[#100B1A] rounded-xl p-1 border border-gray-800 shrink-0"
                  />

                  {/* Info */}
                  <div className="flex-grow min-w-0">
                    <h4 className="text-sm font-bold text-white truncate">{item.product.name}</h4>
                    {item.selectedColor && (
                      <span className="text-[11px] text-gray-400 block">
                        اللون: {item.selectedColor}
                      </span>
                    )}
                    <span className="text-white font-bold text-sm block mt-1">
                      {formatPrice(item.product.priceYER, currency)}
                    </span>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <button
                      onClick={() => onRemoveItem(item.product.id)}
                      className="text-gray-400 hover:text-rose-500 transition-colors p-1"
                      aria-label="حذف"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>

                    <div className="flex items-center gap-2 bg-[#120D22] border border-gray-800 px-2 py-1 rounded-xl">
                      <button
                        onClick={() =>
                          onUpdateQuantity(item.product.id, Math.max(1, item.quantity - 1))
                        }
                        className="text-gray-300 hover:text-white font-bold text-xs px-1"
                      >
                        -
                      </button>
                      <span className="text-white font-bold text-xs">{item.quantity}</span>
                      <button
                        onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                        className="text-gray-300 hover:text-white font-bold text-xs px-1"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Summary & Checkout */}
        {cartItems.length > 0 && (
          <div className="pt-4 border-t border-gray-800 space-y-3 mt-4">
            {/* Coupon Code Input */}
            <div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                  placeholder="كود الخصم (جرّب INDEXES10)"
                  className="flex-grow bg-[#18112B] border border-gray-800 rounded-xl px-3 py-2 text-xs text-white uppercase placeholder-gray-500 focus:border-[#7B3FFF] outline-none text-right"
                />
                <button
                  onClick={applyCoupon}
                  className="bg-[#120D22] hover:bg-[#7B3FFF] border border-gray-800 text-white font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer shrink-0 text-xs"
                >
                  تطبيق
                </button>
              </div>
              {couponAppliedText && (
                <p className="text-emerald-400 text-xs mt-1">{couponAppliedText}</p>
              )}
              {couponError && <p className="text-rose-400 text-xs mt-1">{couponError}</p>}
            </div>

            {/* Price Calculations */}
            <div className="space-y-1.5 text-xs text-gray-300 pt-2 border-t border-gray-800/60">
              <div className="flex justify-between">
                <span>المجموع الفرعي:</span>
                <span className="font-semibold text-white">
                  {formatPrice(subtotalYER, currency)}
                </span>
              </div>

              {couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>خصم الكوبون ({couponDiscount}%):</span>
                  <span>-{formatPrice(discountAmountYER, currency)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>رسوم التوصيل:</span>
                <span className="font-semibold text-white">
                  {isFreeShipping ? (
                    <strong className="text-emerald-400">مجاني 🚚</strong>
                  ) : (
                    formatPrice(shippingFeeYER, currency)
                  )}
                </span>
              </div>

              <div className="flex justify-between text-base font-extrabold text-white pt-2 border-t border-gray-800">
                <span>الإجمالي النهائي:</span>
                <span className="text-white text-xl">{formatPrice(totalYER, currency)}</span>
              </div>
            </div>

            {/* Checkout Button */}
            <button
              onClick={() => onCheckout(couponDiscount)}
              className="w-full bg-[#7B3FFF] hover:bg-[#682BDD] text-white font-bold py-3.5 rounded-2xl shadow-xl shadow-purple-500/20 flex items-center justify-center gap-2 transition-all active:scale-95 text-base cursor-pointer"
            >
              <span>متابعة لإتمام الطلب</span>
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

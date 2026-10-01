import { useEffect, useRef, useState } from "react";
import { VStack } from "@astryxdesign/core/VStack";
import { ShoppingCart, X, Trash2, Plus, Minus, Heart } from "lucide-react";
import type { CartItem, Currency, Product } from "./types";
import { formatPrice } from "./currency";
import { useAppearance } from "@/components/appearance-provider";
import { discountPercentForCoupon } from "@/lib/checkout-pricing";
interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  currency: Currency;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onCheckout: (discount: number) => void;
  onOpenShareCart?: () => void;
  favorites?: string[];
  onSaveForLater?: (item: CartItem) => void;
  catalogProducts?: Product[];
  onAddRecommended?: (product: Product) => void;
}
export function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  currency,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  onSaveForLater,
}: CartDrawerProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const { settings } = useAppearance();
  const config = settings.cart_config;
  const [coupon, setCoupon] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [couponMessage, setCouponMessage] = useState("");
  useEffect(() => {
    if (isOpen) dialog.current?.showModal();
    else dialog.current?.close();
  }, [isOpen]);
  const subtotal = cartItems.reduce((sum, item) => sum + item.product.priceYER * item.quantity, 0);
  const discount = Math.round((subtotal * discountPercent) / 100);
  const shipping =
    !cartItems.length ||
    (config.freeShippingThreshold > 0 && subtotal - discount >= config.freeShippingThreshold)
      ? 0
      : config.shippingFee;
  return (
    <dialog
      ref={dialog}
      className="sf-cart-dialog"
      aria-labelledby="cart-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <VStack gap={4} className="sf-cart-content">
        <header className="sf-dialog-header">
          <h1 id="cart-title">
            <ShoppingCart aria-hidden="true" /> سلة التسوق
          </h1>
          <button className="sf-icon-button" onClick={onClose} aria-label="إغلاق السلة">
            <X />
          </button>
        </header>
        {!cartItems.length ? (
          <section className="sf-empty">
            <ShoppingCart aria-hidden="true" />
            <h2>سلتك فارغة</h2>
            <p>أضف المنتجات التي ترغب في طلبها.</p>
            <button className="sf-primary-button" onClick={onClose}>
              متابعة التسوق
            </button>
          </section>
        ) : (
          <>
            <ul className="sf-cart-lines">
              {cartItems.map((item) => (
                <li className="sf-cart-line" key={item.product.id}>
                  <img src={item.product.image} alt={item.product.name} />
                  <VStack gap={2}>
                    <h2>{item.product.name}</h2>
                    <p className="sf-product-price">
                      {formatPrice(item.product.priceYER, currency)}
                    </p>
                    <section className="sf-quantity" aria-label={`كمية ${item.product.name}`}>
                      <button
                        aria-label={`تقليل كمية ${item.product.name}`}
                        disabled={item.quantity <= 1}
                        onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                      >
                        <Minus />
                      </button>
                      <output>{item.quantity}</output>
                      <button
                        aria-label={`زيادة كمية ${item.product.name}`}
                        onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                      >
                        <Plus />
                      </button>
                    </section>
                  </VStack>
                  <section className="sf-line-actions">
                    <button
                      className="sf-icon-button"
                      aria-label={`حذف ${item.product.name}`}
                      onClick={() => onRemoveItem(item.product.id)}
                    >
                      <Trash2 />
                    </button>
                    {onSaveForLater && (
                      <button
                        className="sf-icon-button"
                        aria-label={`حفظ ${item.product.name} للمفضلة`}
                        onClick={() => onSaveForLater(item)}
                      >
                        <Heart />
                      </button>
                    )}
                  </section>
                </li>
              ))}
            </ul>
            {config.couponFieldEnabled && (
              <form
                className="sf-coupon-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  const value = discountPercentForCoupon(coupon);
                  setDiscountPercent(value);
                  setCouponMessage(value ? "تم تطبيق كود الخصم" : "كود الخصم غير صحيح أو غير متاح");
                }}
              >
                <label htmlFor="cart-coupon">كود الخصم</label>
                <section className="sf-search-form">
                  <input
                    id="cart-coupon"
                    value={coupon}
                    onChange={(event) => setCoupon(event.target.value)}
                    placeholder="أدخل كود الخصم"
                  />
                  <button className="sf-secondary-button" type="submit">
                    تطبيق
                  </button>
                </section>
                {couponMessage && <p role="status">{couponMessage}</p>}
              </form>
            )}
            <section className="sf-order-summary" aria-label="ملخص السلة">
              <p>
                <span>المجموع الفرعي</span>
                <strong>{formatPrice(subtotal, currency)}</strong>
              </p>
              {discount > 0 && (
                <p>
                  <span>الخصم</span>
                  <strong>−{formatPrice(discount, currency)}</strong>
                </p>
              )}
              <p>
                <span>الشحن</span>
                <strong>{shipping === 0 ? "مجاني" : formatPrice(shipping, currency)}</strong>
              </p>
              <p className="sf-total">
                <span>الإجمالي</span>
                <strong>{formatPrice(subtotal - discount + shipping, currency)}</strong>
              </p>
            </section>
            <button className="sf-primary-button" onClick={() => onCheckout(discountPercent)}>
              المتابعة لإتمام الطلب
            </button>
            <p className="sf-muted">ستراجع بيانات التسليم قبل تأكيد الطلب.</p>
          </>
        )}
      </VStack>
    </dialog>
  );
}

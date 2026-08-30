import { createFileRoute, Link } from "@tanstack/react-router";
import { MessageCircle, Minus, Plus, ShoppingBag, Trash2, Truck } from "lucide-react";
import { useState, useId } from "react";
import { useCart } from "@/lib/cart-store";
import { formatPrice } from "@/lib/store-data";
import { yemeniPhoneSchema } from "@/lib/validation/phone";
import { useAppearance } from "@/components/appearance-provider";
import { OptimizedImage } from "@/components/optimized-image";
import { computeShippingFee, amountToFreeShipping } from "@/lib/shipping";

export const Route = createFileRoute("/cart")({
  validateSearch: (search): { coupon?: string } => ({
    coupon: typeof search.coupon === "string" ? search.coupon : undefined,
  }),
  head: () => ({
    meta: [
      { title: "سلة المشتريات — اندكس ستور" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { coupon } = Route.useSearch();
  const items = useCart((s) => s.items);
  const total = useCart((s) => s.total());
  const itemCount = useCart((s) => s.count());
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);
  const checkoutUrl = useCart((s) => s.checkoutUrl);
  const syncing = useCart((s) => s.syncing);
  const cartSyncError = useCart((s) => s.syncError);
  const { settings } = useAppearance();

  const discount = coupon ? Math.round(total * 0.1) : 0;
  const subtotalAfterDiscount = total - discount;

  // Centralized shipping config
  const freeShippingThreshold = settings.cart_config.freeShippingThreshold;
  const shippingFee = computeShippingFee(
    subtotalAfterDiscount,
    freeShippingThreshold,
    settings.cart_config.defaultShippingFee,
  );
  const remainingForFree = amountToFreeShipping(subtotalAfterDiscount, freeShippingThreshold);
  const finalTotal = subtotalAfterDiscount + shippingFee;

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [orderError, setOrderError] = useState<string | null>(null);

  const formId = useId();

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 px-6 py-20 text-center">
        <div className="grid h-24 w-24 place-items-center rounded-full bg-primary-soft/20">
          <ShoppingBag className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-lg font-black">سلتك فارغة</h2>
        <p className="text-sm text-muted-foreground">ابدأ التسوق وأضف المنتجات لسلتك</p>
        <Link
          to="/"
          className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-brand"
        >
          تصفح المنتجات
        </Link>
      </div>
    );
  }

  /**
   * Validate the delivery form fields. Returns true if valid.
   */
  function validateForm(): boolean {
    const errors: Record<string, string> = {};
    if (!name || name.trim().length < 2) {
      errors.name = "الرجاء إدخال الاسم الكامل (حرفان على الأقل).";
    }
    const phoneResult = yemeniPhoneSchema.safeParse(phone);
    if (!phoneResult.success) {
      errors.phone =
        phoneResult.error.issues[0]?.message || "الرجاء إدخال رقم هاتف صالح لإتمام الطلب.";
    }
    if (!address || address.trim().length < 3) {
      errors.address = "الرجاء إدخال عنوان التسليم (المدينة والحي).";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  const handleSubmitOrder = async () => {
    setOrderError(null);

    if (settings.cart_config.deliveryFormEnabled !== false) {
      if (!validateForm()) return;
    }

    setIsSubmitting(true);
    try {
      if (!checkoutUrl) throw new Error("سلة Shopify لم تكتمل مزامنتها بعد");
      window.location.assign(checkoutUrl);
    } catch (err) {
      console.error("Order submission failed:", err);
      const message =
        err instanceof Error ? err.message : "فشل في إنشاء الطلب. الرجاء المحاولة مرة أخرى.";
      setOrderError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deliveryFormEnabled = settings.cart_config.deliveryFormEnabled !== false;
  const couponEnabled = settings.cart_config.couponFieldEnabled !== false;

  return (
    <div className="flex flex-col gap-4 px-4 pt-4">
      {/* Cart header with clear unit/type labels */}
      <h1 className="text-lg font-black">
        سلة المشتريات ({items.length}{" "}
        {items.length === 1 ? "منتج" : items.length === 2 ? "منتجان" : "منتجات"})
      </h1>
      <p className="text-xs text-muted-foreground -mt-3">
        {itemCount} {itemCount === 1 ? "قطعة" : itemCount === 2 ? "قطعتان" : "قطع"} إجمالاً
      </p>

      {/* Free shipping threshold banner */}
      {freeShippingThreshold > 0 && (
        <div className="flex items-center gap-2 rounded-2xl glass-float p-3 text-xs">
          <Truck className="h-4 w-4 text-success shrink-0" />
          {remainingForFree > 0 ? (
            <span>
              أضف <strong className="text-primary">{formatPrice(remainingForFree)}</strong> لتحصل
              على شحن مجاني 🚚
            </span>
          ) : (
            <span className="font-bold text-success">🎉 مبروك! طلبك مؤهل للشحن المجاني</span>
          )}
        </div>
      )}

      {/* Cart items with line totals and aria-labels */}
      <ul className="flex flex-col gap-2" aria-label="عناصر السلة">
        {items.map((it) => (
          <li key={it.productId} className="flex gap-3 rounded-3xl glass-float p-3">
            <OptimizedImage
              src={it.image}
              alt={it.name}
              size="thumbnail"
              className="h-24 w-24 rounded-2xl object-cover"
            />
            <div className="flex flex-1 flex-col justify-between">
              <div className="flex items-start justify-between gap-2">
                <h3 className="line-clamp-2 text-xs font-bold leading-tight">{it.name}</h3>
                <button
                  onClick={() => remove(it.productId)}
                  className="text-destructive min-h-[44px] min-w-[44px] grid place-items-center"
                  aria-label={`حذف ${it.name} من السلة`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-sm font-black text-primary">{formatPrice(it.price)}</span>
                  {it.qty > 1 && (
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {formatPrice(it.price)} × {it.qty} = {formatPrice(it.price * it.qty)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQty(it.productId, it.qty - 1)}
                    className="grid h-9 w-9 min-h-[44px] min-w-[44px] place-items-center rounded-full bg-white/10 text-showcase-foreground backdrop-blur-sm"
                    aria-label={`تقليل كمية ${it.name}`}
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-5 text-center text-sm font-bold">{it.qty}</span>
                  <button
                    onClick={() => setQty(it.productId, it.qty + 1)}
                    className="grid h-9 w-9 min-h-[44px] min-w-[44px] place-items-center rounded-full bg-primary text-primary-foreground"
                    aria-label={`زيادة كمية ${it.name}`}
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {/* Delivery form with field-level validation */}
      {deliveryFormEnabled && (
        <section className="rounded-3xl glass-float p-4">
          <h3 className="mb-3 text-sm font-black">بيانات التسليم</h3>
          <div className="flex flex-col gap-3">
            <label
              className="grid gap-1.5 text-xs font-bold text-muted-foreground"
              htmlFor={`${formId}-name`}
            >
              الاسم الكامل <span className="text-destructive">*</span>
              <input
                id={`${formId}-name`}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (fieldErrors.name) setFieldErrors((p) => ({ ...p, name: "" }));
                }}
                placeholder="الاسم الكامل"
                autoComplete="name"
                aria-invalid={Boolean(fieldErrors.name)}
                aria-describedby={fieldErrors.name ? `${formId}-name-error` : undefined}
                className={`w-full rounded-xl border bg-black/40 px-3 py-2.5 text-sm font-normal text-showcase-foreground outline-none transition-colors focus:ring-2 focus:ring-primary/20 placeholder:text-showcase-muted ${
                  fieldErrors.name
                    ? "border-destructive focus:border-destructive"
                    : "border-showcase-border/50 focus:border-primary"
                }`}
              />
              {fieldErrors.name && (
                <p
                  id={`${formId}-name-error`}
                  role="alert"
                  className="text-[11px] font-semibold text-destructive"
                >
                  {fieldErrors.name}
                </p>
              )}
            </label>
            <label
              className="grid gap-1.5 text-xs font-bold text-muted-foreground"
              htmlFor={`${formId}-phone`}
            >
              رقم الهاتف <span className="text-destructive">*</span>
              <input
                id={`${formId}-phone`}
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (fieldErrors.phone) setFieldErrors((p) => ({ ...p, phone: "" }));
                }}
                placeholder="رقم الهاتف"
                inputMode="tel"
                autoComplete="tel"
                aria-invalid={Boolean(fieldErrors.phone)}
                aria-describedby={fieldErrors.phone ? `${formId}-phone-error` : undefined}
                className={`w-full rounded-xl border bg-black/40 px-3 py-2.5 text-sm font-normal text-showcase-foreground outline-none transition-colors focus:ring-2 focus:ring-primary/20 placeholder:text-showcase-muted ${
                  fieldErrors.phone
                    ? "border-destructive focus:border-destructive"
                    : "border-showcase-border/50 focus:border-primary"
                }`}
              />
              {fieldErrors.phone && (
                <p
                  id={`${formId}-phone-error`}
                  role="alert"
                  className="text-[11px] font-semibold text-destructive"
                >
                  {fieldErrors.phone}
                </p>
              )}
            </label>
            <label
              className="grid gap-1.5 text-xs font-bold text-muted-foreground"
              htmlFor={`${formId}-address`}
            >
              عنوان التسليم <span className="text-destructive">*</span>
              <input
                id={`${formId}-address`}
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  if (fieldErrors.address) setFieldErrors((p) => ({ ...p, address: "" }));
                }}
                placeholder="المدينة، الحي"
                autoComplete="street-address"
                aria-invalid={Boolean(fieldErrors.address)}
                aria-describedby={fieldErrors.address ? `${formId}-address-error` : undefined}
                className={`w-full rounded-xl border bg-black/40 px-3 py-2.5 text-sm font-normal text-showcase-foreground outline-none transition-colors focus:ring-2 focus:ring-primary/20 placeholder:text-showcase-muted ${
                  fieldErrors.address
                    ? "border-destructive focus:border-destructive"
                    : "border-showcase-border/50 focus:border-primary"
                }`}
              />
              {fieldErrors.address && (
                <p
                  id={`${formId}-address-error`}
                  role="alert"
                  className="text-[11px] font-semibold text-destructive"
                >
                  {fieldErrors.address}
                </p>
              )}
            </label>
            <label
              className="grid gap-1.5 text-xs font-bold text-muted-foreground"
              htmlFor={`${formId}-notes`}
            >
              ملاحظات إضافية <span className="font-normal">(اختياري)</span>
              <textarea
                id={`${formId}-notes`}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="أضف أي تفاصيل مهمة للتسليم"
                rows={2}
                className="w-full resize-none rounded-xl border border-showcase-border/50 bg-black/40 px-3 py-2.5 text-sm font-normal text-showcase-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-showcase-muted"
              />
            </label>
          </div>
          {orderError && (
            <p
              id="order-error"
              role="alert"
              className="mt-3 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive"
            >
              {orderError}
            </p>
          )}
        </section>
      )}

      {/* Order summary with centralized shipping */}
      <section className="rounded-3xl glass-float p-4" aria-live="polite">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">المجموع الفرعي</span>
          <span className="font-bold">{formatPrice(total)}</span>
        </div>
        {couponEnabled && coupon && discount > 0 && (
          <div className="flex items-center justify-between text-sm text-success">
            <span>خصم الكوبون ({coupon})</span>
            <span className="font-bold">-{formatPrice(discount)}</span>
          </div>
        )}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">الشحن</span>
          <span className={`font-bold ${shippingFee === 0 ? "text-success" : ""}`}>
            {shippingFee === 0 ? "مجاني 🎉" : formatPrice(shippingFee)}
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-showcase-border/60 pt-3">
          <span className="text-sm font-bold">الإجمالي</span>
          <span className="text-lg font-black text-primary">{formatPrice(finalTotal)}</span>
        </div>
      </section>

      <button
        onClick={handleSubmitOrder}
        disabled={isSubmitting || syncing || !checkoutUrl}
        className="mb-2 flex items-center justify-center gap-2 rounded-2xl bg-success py-3.5 text-sm font-black text-success-foreground shadow-brand transition-colors hover:bg-success/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success/40 disabled:opacity-60"
      >
        <MessageCircle className="h-5 w-5" />
        {isSubmitting || syncing ? "جاري تجهيز دفع Shopify..." : "المتابعة إلى الدفع الآمن"}
      </button>
      {cartSyncError && (
        <p className="pb-1 text-center text-xs text-destructive">{cartSyncError}</p>
      )}
      <p className="pb-2 text-center text-[11px] text-muted-foreground">
        تتم مراجعة الشحن والدفع وإنشاء الطلب بأمان داخل Shopify Checkout
      </p>
    </div>
  );
}

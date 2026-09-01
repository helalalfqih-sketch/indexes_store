import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, ChevronDown, ChevronUp, ShoppingBag } from "lucide-react";
import { useId, useMemo, useRef, useState } from "react";
import { useAppearance } from "@/components/appearance-provider";
import { submitOrder } from "@/lib/actions/order.actions";
import { useCart } from "@/lib/cart-store";
import { computeShippingFee } from "@/lib/shipping";
import { formatPrice } from "@/lib/store-data";
import { yemeniPhoneSchema } from "@/lib/validation/phone";

export const Route = createFileRoute("/cart")({
  validateSearch: (search): { coupon?: string } => ({
    coupon: typeof search.coupon === "string" ? search.coupon : undefined,
  }),
  head: () => ({
    meta: [
      { title: "إتمام الطلب — اندكس ستور" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: CartPage,
});

function getCouponPercent(coupon?: string): number {
  const code = coupon?.trim().toUpperCase();
  if (code === "INDEXES20") return 20;
  if (code === "INDEXES10") return 10;
  return 0;
}

function createIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `order-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function CartPage() {
  const { coupon } = Route.useSearch();
  const items = useCart((s) => s.items);
  const total = useCart((s) => s.total());
  const itemCount = useCart((s) => s.count());
  const clearCart = useCart((s) => s.clear);
  const { settings } = useAppearance();

  const couponPercent = getCouponPercent(coupon);
  const normalizedCoupon = couponPercent > 0 ? coupon?.trim().toUpperCase() : undefined;
  const discount = Math.round((total * couponPercent) / 100);
  const subtotalAfterDiscount = total - discount;
  const shippingFee = computeShippingFee(
    subtotalAfterDiscount,
    settings.cart_config.freeShippingThreshold,
    settings.cart_config.defaultShippingFee,
  );
  const finalTotal = subtotalAfterDiscount + shippingFee;

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [orderError, setOrderError] = useState<string | null>(null);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const idempotencyKeyRef = useRef<string | null>(null);
  const formId = useId();

  const previewItems = useMemo(() => items.slice(0, 3), [items]);

  if (createdOrderId) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-6 text-center" dir="rtl">
        <div className="grid h-20 w-20 place-items-center rounded-full bg-success/15 text-success">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <div>
          <h1 className="text-xl font-black">تم إنشاء طلبك بنجاح</h1>
          <p className="mt-2 text-sm text-muted-foreground">تم حفظ الطلب داخل نظام Indexes Store.</p>
        </div>
        <div className="rounded-2xl border border-showcase-border/50 bg-white/5 px-4 py-3">
          <span className="text-xs text-muted-foreground">رقم الطلب</span>
          <p className="mt-1 break-all font-mono text-sm font-black text-primary">{createdOrderId}</p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Link to="/" className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground">
            العودة للمتجر
          </Link>
          <Link to="/track" className="rounded-xl border border-showcase-border/50 px-5 py-2.5 text-sm font-bold">
            تتبع الطلب
          </Link>
        </div>
      </div>
    );
  }

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
    if (isSubmitting) return;
    setOrderError(null);
    if (settings.cart_config.deliveryFormEnabled !== false && !validateForm()) return;

    if (!idempotencyKeyRef.current) {
      idempotencyKeyRef.current = createIdempotencyKey();
    }

    setIsSubmitting(true);
    try {
      const result = await submitOrder({
        items: items.map((item) => ({ productId: item.productId, quantity: item.qty })),
        customerName: name.trim(),
        customerPhone: phone.trim(),
        customerAddress: address.trim(),
        notes: notes.trim() || undefined,
        couponCode: normalizedCoupon,
        paymentProvider: "cash",
        idempotencyKey: idempotencyKeyRef.current,
      });

      setCreatedOrderId(result.orderId);
      clearCart();
    } catch (err) {
      console.error("Order submission failed:", err);
      setOrderError(
        err instanceof Error ? err.message : "فشل في إنشاء الطلب. الرجاء المحاولة مرة أخرى.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const deliveryFormEnabled = settings.cart_config.deliveryFormEnabled !== false;

  return (
    <div className="flex flex-col gap-4 px-4 pt-4" dir="rtl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-black">إتمام الطلب</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {items.length} {items.length === 1 ? "منتج" : "منتجات"} · {itemCount} قطعة
          </p>
        </div>
        <Link to="/" className="text-xs font-bold text-primary hover:underline">
          متابعة التسوق
        </Link>
      </div>

      <section className="rounded-3xl glass-float p-4" aria-label="ملخص الطلب">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-black">ملخص الطلب</h2>
            <p className="mt-1 text-[11px] text-muted-foreground">راجع الطلب قبل التأكيد</p>
          </div>
          <div className="flex -space-x-2 space-x-reverse">
            {previewItems.map((item) => (
              <img
                key={item.productId}
                src={item.image}
                alt=""
                className="h-10 w-10 rounded-xl border-2 border-background bg-white object-cover"
              />
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowDetails((value) => !value)}
          className="mt-3 flex w-full items-center justify-between rounded-xl bg-white/5 px-3 py-2 text-xs font-bold"
          aria-expanded={showDetails}
        >
          <span>{showDetails ? "إخفاء تفاصيل الطلب" : "عرض تفاصيل الطلب"}</span>
          {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {showDetails && (
          <ul className="mt-3 divide-y divide-white/10" aria-label="تفاصيل عناصر الطلب">
            {items.map((item) => (
              <li key={item.productId} className="flex items-center justify-between gap-3 py-2 text-xs">
                <div className="min-w-0">
                  <p className="truncate font-bold">{item.name}</p>
                  <p className="text-[11px] text-muted-foreground">الكمية: {item.qty}</p>
                </div>
                <span className="shrink-0 font-black">{formatPrice(item.price * item.qty)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {deliveryFormEnabled && (
        <section className="rounded-3xl glass-float p-4">
          <h2 className="mb-3 text-sm font-black">بيانات التسليم</h2>
          <div className="flex flex-col gap-3">
            <Field
              id={`${formId}-name`}
              label="الاسم الكامل"
              value={name}
              onChange={(value) => {
                setName(value);
                if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: "" }));
              }}
              error={fieldErrors.name}
              autoComplete="name"
            />
            <Field
              id={`${formId}-phone`}
              label="رقم الهاتف"
              value={phone}
              onChange={(value) => {
                setPhone(value);
                if (fieldErrors.phone) setFieldErrors((prev) => ({ ...prev, phone: "" }));
              }}
              error={fieldErrors.phone}
              autoComplete="tel"
              inputMode="tel"
            />
            <Field
              id={`${formId}-address`}
              label="عنوان التسليم"
              value={address}
              onChange={(value) => {
                setAddress(value);
                if (fieldErrors.address) setFieldErrors((prev) => ({ ...prev, address: "" }));
              }}
              error={fieldErrors.address}
              autoComplete="street-address"
            />
            <label className="grid gap-1.5 text-xs font-bold text-muted-foreground" htmlFor={`${formId}-notes`}>
              ملاحظات إضافية <span className="font-normal">(اختياري)</span>
              <textarea
                id={`${formId}-notes`}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={2}
                className="w-full resize-none rounded-xl border border-showcase-border/50 bg-black/40 px-3 py-2.5 text-sm font-normal text-showcase-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </label>
          </div>
          {orderError && (
            <p role="alert" className="mt-3 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive">
              {orderError}
            </p>
          )}
        </section>
      )}

      <section className="rounded-3xl glass-float p-4" aria-live="polite">
        <SummaryRow label="المجموع الفرعي" value={formatPrice(total)} />
        {couponPercent > 0 && (
          <SummaryRow label={`خصم الكوبون (${normalizedCoupon})`} value={`-${formatPrice(discount)}`} emphasis="success" />
        )}
        <SummaryRow
          label="الشحن"
          value={shippingFee === 0 ? "مجاني 🎉" : formatPrice(shippingFee)}
          emphasis={shippingFee === 0 ? "success" : undefined}
        />
        <div className="mt-3 flex items-center justify-between border-t border-showcase-border/60 pt-3">
          <span className="text-sm font-bold">الإجمالي</span>
          <span className="text-lg font-black text-primary">{formatPrice(finalTotal)}</span>
        </div>
        <p className="mt-2 text-[10px] text-muted-foreground">
          المبلغ المعروض للتوضيح، ويعاد التحقق من الأسعار والخصم والشحن على الخادم قبل إنشاء الطلب.
        </p>
      </section>

      <button
        type="button"
        onClick={handleSubmitOrder}
        disabled={isSubmitting}
        className="mb-2 flex items-center justify-center gap-2 rounded-2xl bg-success py-3.5 text-sm font-black text-success-foreground shadow-brand transition-colors hover:bg-success/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success/40 disabled:opacity-60"
      >
        <CheckCircle2 className="h-5 w-5" />
        {isSubmitting ? "جاري إنشاء الطلب..." : "تأكيد الطلب"}
      </button>

      <p className="pb-2 text-center text-[11px] text-muted-foreground">
        يتم إنشاء الطلب وحفظه داخل Indexes Store، بدون Shopify Checkout.
      </p>
    </div>
  );
}

type FieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  autoComplete?: string;
  inputMode?: "text" | "tel";
};

function Field({ id, label, value, onChange, error, autoComplete, inputMode = "text" }: FieldProps) {
  return (
    <label className="grid gap-1.5 text-xs font-bold text-muted-foreground" htmlFor={id}>
      {label} <span className="text-destructive">*</span>
      <input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        inputMode={inputMode}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`w-full rounded-xl border bg-black/40 px-3 py-2.5 text-sm font-normal text-showcase-foreground outline-none focus:ring-2 focus:ring-primary/20 ${error ? "border-destructive focus:border-destructive" : "border-showcase-border/50 focus:border-primary"}`}
      />
      {error && (
        <p id={`${id}-error`} role="alert" className="text-[11px] font-semibold text-destructive">
          {error}
        </p>
      )}
    </label>
  );
}

function SummaryRow({ label, value, emphasis }: { label: string; value: string; emphasis?: "success" }) {
  return (
    <div className={`flex items-center justify-between text-sm ${emphasis === "success" ? "text-success" : ""}`}>
      <span className={emphasis ? "" : "text-muted-foreground"}>{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  );
}

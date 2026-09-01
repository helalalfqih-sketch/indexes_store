import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, CheckCircle2, Loader2, MapPin, Phone, User } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { CartDrawer } from "./CartDrawer";
import type { CartItem, Currency, Product } from "./types";
import { formatPrice } from "./currency";
import { STORE_INFO } from "./constants";
import { submitOrder } from "@/lib/actions/order.actions";
import { useCart } from "@/lib/cart-store";
import { yemeniPhoneSchema } from "@/lib/validation/phone";

interface UnifiedCartFlowProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  currency: Currency;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onCheckout?: (couponDiscountPercent: number) => void;
  onOpenShareCart?: () => void;
  favorites?: string[];
  onSaveForLater?: (item: CartItem) => void;
  catalogProducts?: Product[];
  onAddRecommended?: (product: Product) => void;
}

type FlowStep = "cart" | "delivery" | "success";

function makeIdempotencyKey() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `order-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function UnifiedCartFlow(props: UnifiedCartFlowProps) {
  const [step, setStep] = useState<FlowStep>("cart");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const idempotencyKeyRef = useRef<string | null>(null);
  const clearCart = useCart((state) => state.clear);

  useEffect(() => {
    if (!props.isOpen) {
      setStep("cart");
      setSubmitError(null);
      setErrors({});
      setOrderId(null);
      idempotencyKeyRef.current = null;
    }
  }, [props.isOpen]);

  const subtotal = useMemo(
    () => props.cartItems.reduce((sum, item) => sum + item.product.priceYER * item.quantity, 0),
    [props.cartItems],
  );
  const discountAmount = Math.round((subtotal * discountPercent) / 100);
  const afterDiscount = subtotal - discountAmount;
  const shipping = afterDiscount >= STORE_INFO.freeShippingThresholdYER ? 0 : 3000;
  const total = afterDiscount + shipping;
  const couponCode = discountPercent >= 20 ? "INDEXES20" : discountPercent >= 10 ? "INDEXES10" : undefined;

  const validate = () => {
    const next: Record<string, string> = {};
    if (name.trim().length < 2) next.name = "أدخل الاسم الكامل.";
    const phoneResult = yemeniPhoneSchema.safeParse(phone);
    if (!phoneResult.success) next.phone = phoneResult.error.issues[0]?.message || "أدخل رقم هاتف صحيح.";
    if (address.trim().length < 3) next.address = "أدخل عنوان التسليم.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (submitting || !validate()) return;
    setSubmitError(null);
    idempotencyKeyRef.current ??= makeIdempotencyKey();
    setSubmitting(true);
    try {
      const result = await submitOrder({
        items: props.cartItems.map((item) => ({ productId: item.product.id, quantity: item.quantity })),
        customerName: name.trim(),
        customerPhone: phone.trim(),
        customerAddress: address.trim(),
        notes: notes.trim() || undefined,
        couponCode,
        paymentProvider: "cash",
        idempotencyKey: idempotencyKeyRef.current,
      });
      clearCart();
      setOrderId(result.orderId);
      setStep("success");
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "تعذر إنشاء الطلب. حاول مرة أخرى.");
    } finally {
      setSubmitting(false);
    }
  };

  if (step === "cart") {
    return (
      <CartDrawer
        {...props}
        onCheckout={(discount) => {
          setDiscountPercent(discount);
          setStep("delivery");
        }}
      />
    );
  }

  return (
    <AnimatePresence>
      {props.isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex justify-end bg-black/80 backdrop-blur-md dir-rtl"
        >
          <div className="flex-1 cursor-pointer" onClick={props.onClose} />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="h-full w-full max-w-md overflow-hidden border-r border-[var(--color-border-default)] bg-[var(--color-surface-1)] shadow-2xl"
            dir="rtl"
          >
            {step === "success" ? (
              <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
                <div className="grid h-20 w-20 place-items-center rounded-full bg-emerald-500/15 text-emerald-500">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <h2 className="text-xl font-black text-[var(--color-text-primary)]">تم إنشاء طلبك بنجاح</h2>
                <p className="text-sm text-[var(--color-text-secondary)]">تم حفظ الطلب داخل Indexes Store.</p>
                {orderId && (
                  <div className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface-2)] px-4 py-3">
                    <span className="text-[11px] text-[var(--color-text-muted)]">رقم الطلب</span>
                    <p className="mt-1 break-all font-mono text-sm font-black text-[#2F6BFF]">{orderId}</p>
                  </div>
                )}
                <button
                  type="button"
                  onClick={props.onClose}
                  className="mt-2 rounded-2xl bg-[#2F6BFF] px-6 py-3 text-sm font-black text-white"
                >
                  العودة للمتجر
                </button>
              </div>
            ) : (
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between border-b border-[var(--color-border-default)] p-4">
                  <div>
                    <h2 className="text-lg font-black text-[var(--color-text-primary)]">بيانات التسليم</h2>
                    <p className="mt-0.5 text-[11px] text-[var(--color-text-secondary)]">أكمل الطلب داخل نفس السلة</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep("cart")}
                    className="flex items-center gap-1 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-2)] px-3 py-2 text-xs font-bold text-[var(--color-text-primary)]"
                  >
                    <ArrowRight className="h-4 w-4" />
                    العودة للسلة
                  </button>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto p-4">
                  <div className="space-y-3">
                    <Field icon={<User className="h-4 w-4" />} label="الاسم الكامل" value={name} onChange={setName} error={errors.name} autoComplete="name" />
                    <Field icon={<Phone className="h-4 w-4" />} label="رقم الهاتف" value={phone} onChange={setPhone} error={errors.phone} autoComplete="tel" inputMode="tel" />
                    <Field icon={<MapPin className="h-4 w-4" />} label="عنوان التسليم" value={address} onChange={setAddress} error={errors.address} autoComplete="street-address" />
                    <label className="block text-xs font-bold text-[var(--color-text-secondary)]">
                      ملاحظات إضافية <span className="font-normal">(اختياري)</span>
                      <textarea
                        value={notes}
                        onChange={(event) => setNotes(event.target.value)}
                        rows={3}
                        className="mt-1.5 w-full resize-none rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface-2)] px-3 py-3 text-sm text-[var(--color-text-primary)] outline-none focus:border-[#2F6BFF]"
                      />
                    </label>
                  </div>

                  <div className="mt-5 rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface-2)] p-4 text-xs">
                    <Summary label="المجموع الفرعي" value={formatPrice(subtotal, props.currency)} />
                    {discountPercent > 0 && <Summary label={`الخصم (${discountPercent}%)`} value={`-${formatPrice(discountAmount, props.currency)}`} success />}
                    <Summary label="الشحن" value={shipping === 0 ? "مجاني 🚚" : formatPrice(shipping, props.currency)} success={shipping === 0} />
                    <div className="mt-3 flex items-center justify-between border-t border-[var(--color-border-default)] pt-3 text-base font-black">
                      <span>الإجمالي</span>
                      <span className="text-[#2F6BFF]">{formatPrice(total, props.currency)}</span>
                    </div>
                  </div>

                  {submitError && (
                    <p className="mt-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-500">
                      {submitError}
                    </p>
                  )}
                </div>

                <div className="border-t border-[var(--color-border-default)] p-4">
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#2F6BFF] to-[#3B75FF] py-3.5 text-sm font-black text-white shadow-lg shadow-blue-600/25 disabled:opacity-60"
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    {submitting ? "جاري إنشاء الطلب..." : "تأكيد الطلب"}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Field({
  icon,
  label,
  value,
  onChange,
  error,
  autoComplete,
  inputMode = "text",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  autoComplete?: string;
  inputMode?: "text" | "tel";
}) {
  return (
    <label className="block text-xs font-bold text-[var(--color-text-secondary)]">
      <span className="flex items-center gap-1.5">{icon}{label}<span className="text-rose-500">*</span></span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        inputMode={inputMode}
        className={`mt-1.5 w-full rounded-2xl border bg-[var(--color-surface-2)] px-3 py-3 text-sm text-[var(--color-text-primary)] outline-none focus:border-[#2F6BFF] ${error ? "border-rose-500" : "border-[var(--color-border-default)]"}`}
      />
      {error && <span className="mt-1 block text-[11px] font-semibold text-rose-500">{error}</span>}
    </label>
  );
}

function Summary({ label, value, success = false }: { label: string; value: string; success?: boolean }) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <span className="text-[var(--color-text-secondary)]">{label}</span>
      <span className={`font-bold ${success ? "text-emerald-500" : "text-[var(--color-text-primary)]"}`}>{value}</span>
    </div>
  );
}

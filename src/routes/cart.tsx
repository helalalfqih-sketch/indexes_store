import { createFileRoute, Link } from "@tanstack/react-router";
import { MessageCircle, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/lib/cart-store";
import { formatPrice } from "@/lib/store-data";
import { buildOrderMessage, whatsappLink } from "@/lib/whatsapp";
import { formatOrderNumber } from "@/lib/order-status";
import { submitOrder } from "@/lib/actions/order.actions";
import type { CreateOrderInput } from "@/lib/actions/order.actions";
import { useAppearance } from "@/components/appearance-provider";
import { OptimizedImage } from "@/components/optimized-image";

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
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);
  const { settings } = useAppearance();

  const discount = coupon ? Math.round(total * 0.1) : 0;
  const finalTotal = total - discount;

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);

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

  const handleSubmitOrder = async () => {
    setOrderError(null);
    if (settings.cart_config.deliveryFormEnabled && (!phone || phone.trim().length < 5)) {
      setOrderError("الرجاء إدخال رقم هاتف صالح لإتمام الطلب.");
      return;
    }
    setIsSubmitting(true);
    try {
      const input: CreateOrderInput = {
        items: items.map((it) => ({ productId: it.productId, quantity: it.qty })),
        customerName: name || undefined,
        customerPhone: phone || "000000000",
        customerAddress: address || undefined,
        notes: notes || undefined,
        couponCode: coupon || undefined,
        discountAmount: discount || undefined,
        paymentProvider: "cod",
      };
      const result = await submitOrder(input);
      setOrderId(result.orderId);

      // Human-friendly order number (matches DB orders.order_number) + tracking link.
      const orderNumber = formatOrderNumber(result.orderId);
      const trackUrl = `${window.location.origin}/track`;
      const orderFooter = `\n🆔 رقم الطلب: ${orderNumber}\n📦 تتبع طلبك: ${trackUrl}`;

      // Read template from cart config or use fallback
      let orderMessage = "";
      const template = settings.cart_config.whatsappOrderTemplate;
      if (template) {
        const prodList = items.map((it) => `- ${it.name} (${it.qty}x)`).join("\n");
        orderMessage = template
          .replace("{products}", prodList)
          .replace("{total}", formatPrice(finalTotal))
          .replace("{name}", name || "غير محدد")
          .replace("{address}", address || "غير محدد") + orderFooter;
      } else {
        orderMessage =
          buildOrderMessage(items, finalTotal, { name, phone, address, notes }, coupon, discount) +
          orderFooter;
      }

      const waPhone = settings.cart_config.whatsappPhone || "967771370740";
      window.open(whatsappLink(orderMessage, waPhone), "_blank");
    } catch (err) {
      console.error("Order submission failed:", err);
      setOrderError("فشل في إنشاء الطلب. الرجاء المحاولة مرة أخرى.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const deliveryFormEnabled = settings.cart_config.deliveryFormEnabled !== false;
  const couponEnabled = settings.cart_config.couponFieldEnabled !== false;
  const shippingText = settings.cart_config.defaultShippingText || "يتم الاتفاق عليه";

  return (
    <div className="flex flex-col gap-4 px-4 pt-4">
      <h1 className="text-lg font-black">سلة المشتريات ({items.length})</h1>

      <ul className="flex flex-col gap-2">
        {items.map((it) => (
          <li
            key={it.productId}
            className="flex gap-3 rounded-2xl border border-showcase-border bg-showcase-foreground/5 p-2.5 shadow-card backdrop-blur-md"
          >
            <OptimizedImage src={it.image} alt={it.name} size="thumbnail" className="h-20 w-20 rounded-xl object-cover" />
            <div className="flex flex-1 flex-col justify-between">
              <div className="flex items-start justify-between gap-2">
                <h3 className="line-clamp-2 text-xs font-bold leading-tight">{it.name}</h3>
                <button onClick={() => remove(it.productId)} className="text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-black text-primary">{formatPrice(it.price)}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQty(it.productId, it.qty - 1)}
                    className="grid h-7 w-7 place-items-center rounded-full bg-muted"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-5 text-center text-sm font-bold">{it.qty}</span>
                  <button
                    onClick={() => setQty(it.productId, it.qty + 1)}
                    className="grid h-7 w-7 place-items-center rounded-full bg-primary text-primary-foreground"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {deliveryFormEnabled && (
        <section className="rounded-2xl border border-showcase-border bg-showcase-foreground/5 p-4 shadow-card backdrop-blur-md">
          <h3 className="mb-3 text-sm font-black">بيانات التسليم</h3>
          <div className="flex flex-col gap-3">
            <label
              className="grid gap-1.5 text-xs font-bold text-muted-foreground"
              htmlFor="customer-name"
            >
              الاسم الكامل
              <input
                id="customer-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="الاسم الكامل"
                autoComplete="name"
                className="w-full rounded-xl border border-showcase-border/50 bg-black/40 px-3 py-2.5 text-sm font-normal text-showcase-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-showcase-muted"
              />
            </label>
            <label
              className="grid gap-1.5 text-xs font-bold text-muted-foreground"
              htmlFor="customer-phone"
            >
              رقم الهاتف <span className="text-destructive">*</span>
              <input
                id="customer-phone"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (orderError) setOrderError(null);
                }}
                placeholder="رقم الهاتف"
                inputMode="tel"
                autoComplete="tel"
                aria-invalid={Boolean(orderError)}
                aria-describedby={orderError ? "order-error" : undefined}
                className={`w-full rounded-xl border bg-black/40 px-3 py-2.5 text-sm font-normal text-showcase-foreground outline-none transition-colors focus:ring-2 focus:ring-primary/20 placeholder:text-showcase-muted ${
                  orderError
                    ? "border-destructive focus:border-destructive"
                    : "border-showcase-border/50 focus:border-primary"
                }`}
              />
            </label>
            <label
              className="grid gap-1.5 text-xs font-bold text-muted-foreground"
              htmlFor="delivery-address"
            >
              عنوان التسليم
              <input
                id="delivery-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="المدينة، الحي"
                autoComplete="street-address"
                className="w-full rounded-xl border border-showcase-border/50 bg-black/40 px-3 py-2.5 text-sm font-normal text-showcase-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-showcase-muted"
              />
            </label>
            <label
              className="grid gap-1.5 text-xs font-bold text-muted-foreground"
              htmlFor="order-notes"
            >
              ملاحظات إضافية <span className="font-normal">(اختياري)</span>
              <textarea
                id="order-notes"
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

      <section className="rounded-2xl border border-showcase-border bg-showcase-foreground/5 p-4 shadow-card backdrop-blur-md">
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
          <span className="font-bold text-success">{shippingText}</span>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-showcase-border/60 pt-3">
          <span className="text-sm font-bold">الإجمالي</span>
          <span className="text-lg font-black text-primary">{formatPrice(finalTotal)}</span>
        </div>
      </section>

      <button
        onClick={handleSubmitOrder}
        disabled={isSubmitting}
        className="mb-2 flex items-center justify-center gap-2 rounded-2xl bg-success py-3.5 text-sm font-black text-success-foreground shadow-brand transition-colors hover:bg-success/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success/40 disabled:opacity-60"
      >
        <MessageCircle className="h-5 w-5" />
        {isSubmitting ? "جاري إنشاء الطلب..." : "إتمام الطلب عبر واتساب"}
      </button>
      {orderId && (
        <p className="pb-1 text-center text-xs text-success">
          ✅ تم إنشاء الطلب رقم {formatOrderNumber(orderId)} —{" "}
          <Link to="/track" className="font-bold underline underline-offset-2">
            تتبع طلبك
          </Link>
        </p>
      )}
      <p className="pb-2 text-center text-[11px] text-muted-foreground">
        الدفع عند الاستلام متاح • تأكيد الطلب مباشرة مع الإدارة
      </p>
    </div>
  );
}




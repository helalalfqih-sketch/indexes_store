import { createFileRoute, Link } from "@tanstack/react-router";
import { MessageCircle, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/lib/cart-store";
import { formatPrice } from "@/lib/store-data";
import { buildOrderMessage, whatsappLink } from "@/lib/whatsapp";

export const Route = createFileRoute("/cart")({
  validateSearch: (search): { coupon?: string } => ({
    coupon: typeof search.coupon === "string" ? search.coupon : undefined,
  }),
  head: () => ({ meta: [{ title: "السلة — اندكس ستور" }] }),
  component: CartPage,
});

function CartPage() {
  const { coupon } = Route.useSearch();
  const items = useCart((s) => s.items);
  const total = useCart((s) => s.total());
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);

  const discount = coupon ? Math.round(total * 0.1) : 0;
  const finalTotal = total - discount;

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

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
          className="rounded-xl gradient-brand px-5 py-2.5 text-sm font-bold text-white shadow-brand"
        >
          تصفح المنتجات
        </Link>
      </div>
    );
  }

  const message = buildOrderMessage(items, finalTotal, { name, phone, address, notes }, coupon, discount);

  return (
    <div className="flex flex-col gap-4 px-4 pt-4">
      <h1 className="text-lg font-black">سلة المشتريات ({items.length})</h1>

      <ul className="flex flex-col gap-2">
        {items.map((it) => (
          <li key={it.productId} className="flex gap-3 rounded-2xl bg-surface p-2.5 shadow-card">
            <img src={it.image} alt={it.name} className="h-20 w-20 rounded-xl object-cover" />
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
                    className="grid h-7 w-7 place-items-center rounded-full gradient-brand text-white"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <section className="rounded-2xl bg-surface p-4 shadow-card">
        <h3 className="mb-3 text-sm font-black">بيانات التسليم</h3>
        <div className="flex flex-col gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="الاسم الكامل"
            className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
          />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="رقم الهاتف"
            inputMode="tel"
            className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
          />
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="عنوان التسليم (المدينة، الحي)"
            className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
          />
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="ملاحظات إضافية (اختياري)"
            rows={2}
            className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
          />
        </div>
      </section>

      <section className="rounded-2xl bg-surface p-4 shadow-card">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">المجموع الفرعي</span>
          <span className="font-bold">{formatPrice(total)}</span>
        </div>
        {coupon && discount > 0 && (
          <div className="flex items-center justify-between text-sm text-success">
            <span>خصم الكوبون ({coupon})</span>
            <span className="font-bold">-{formatPrice(discount)}</span>
          </div>
        )}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">الشحن</span>
          <span className="font-bold text-success">يتم الاتفاق عليه</span>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
          <span className="text-sm font-bold">الإجمالي</span>
          <span className="text-lg font-black text-primary">{formatPrice(finalTotal)}</span>
        </div>
      </section>

      <a
        href={whatsappLink(message)}
        target="_blank"
        rel="noopener noreferrer"
        className="mb-2 flex items-center justify-center gap-2 rounded-2xl bg-success py-3.5 text-sm font-black text-success-foreground shadow-brand"
      >
        <MessageCircle className="h-5 w-5" />
        إتمام الطلب عبر واتساب
      </a>
      <p className="pb-2 text-center text-[11px] text-muted-foreground">
        الدفع عند الاستلام متاح • تأكيد الطلب مباشرة مع الإدارة
      </p>
    </div>
  );
}

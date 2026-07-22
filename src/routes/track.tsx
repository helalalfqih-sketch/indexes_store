import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  PackageSearch,
  Loader2,
  Package,
  CheckCircle2,
  Circle,
  XCircle,
  RotateCcw,
} from "lucide-react";
import { useSession } from "@/hooks/use-session";
import { getMyOrderDetails, getTrackedOrder } from "@/lib/order.functions";
import type { MyOrderDetails } from "@/lib/services/order-history.service";
import {
  orderStatusLabel,
  orderStatusTone,
  paymentStatusLabel,
  normalizeOrderNumber,
  type OrderStatus,
} from "@/lib/order-status";
import { formatPrice } from "@/lib/store-data";

export const Route = createFileRoute("/track")({
  head: () => ({
    meta: [
      { title: "تتبع الطلب — اندكس ستور" },
      { name: "description", content: "تتبع حالة طلبك في اندكس ستور برقم الطلب." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TrackPage,
});

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The linear fulfillment path; cancelled/refunded render as a banner instead. */
const FLOW: OrderStatus[] = ["pending", "confirmed", "processing", "shipped", "delivered"];

function TrackPage() {
  const { user } = useSession();
  const [orderId, setOrderId] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<MyOrderDetails | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setOrder(null);

    const input = orderId.trim();
    const orderNumber = normalizeOrderNumber(input);
    if (!orderNumber) {
      setError("رقم الطلب غير صالح — الصيغة: ORD-XXXXXXXX كما في رسالة تأكيد الطلب.");
      return;
    }
    const last4 = phone.trim();

    setBusy(true);
    try {
      let found: MyOrderDetails | null = null;
      // Signed-in customers who pasted a full order id: try their own orders
      // first (RLS-scoped, no phone needed).
      if (user && UUID_RE.test(input)) {
        try {
          found = await getMyOrderDetails({ data: { orderId: input.toLowerCase() } });
        } catch {
          found = null;
        }
      }
      // Public path: order number + last-4 phone digits, verified server-side
      // (never an open read; response carries no personal data).
      if (!found) {
        if (!/^\d{4}$/.test(last4)) {
          setError("أدخل آخر 4 أرقام من رقم الهاتف المستخدم عند الطلب.");
          return;
        }
        found = await getTrackedOrder({ data: { orderNumber, phoneLast4: last4 } });
      }
      if (!found) {
        setError("لم نعثر على الطلب — تأكد من رقم الطلب وآخر 4 أرقام من هاتفك.");
      } else {
        setOrder(found);
      }
    } catch {
      setError("تعذّر الاتصال بالخادم — أعد المحاولة.");
    } finally {
      setBusy(false);
    }
  };

  const reachedIndex = order ? FLOW.indexOf(order.status) : -1;
  const isTerminatedBadly = order && (order.status === "cancelled" || order.status === "refunded");
  const dateFor = (s: OrderStatus): string | null => {
    if (!order) return null;
    if (s === "pending") {
      const h = order.history.find((x) => x.to_status === "pending");
      return h?.created_at ?? order.created_at;
    }
    return order.history.find((x) => x.to_status === s)?.created_at ?? null;
  };

  return (
    <div className="flex flex-col gap-5 px-4 pt-4 max-w-2xl mx-auto pb-12" dir="rtl">
      {/* Header */}
      <section className="flex items-center gap-3.5 rounded-3xl bg-primary p-5 text-primary-foreground shadow-brand">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary-foreground/20 shrink-0">
          <PackageSearch className="h-7 w-7" />
        </div>
        <div>
          <h1 className="text-base font-black">تتبع الطلب</h1>
          <p className="text-xs text-primary-foreground/80">
            أدخل رقم الطلب من رسالة التأكيد وآخر 4 أرقام من هاتفك لعرض حالة طلبك.
          </p>
        </div>
      </section>

      {/* Form */}
      <form
        onSubmit={onSubmit}
        className="rounded-2xl border border-showcase-border/50 bg-showcase-foreground/5 p-5 shadow-card backdrop-blur-md space-y-3"
      >
        <label className="block text-xs font-bold space-y-1">
          رقم الطلب
          <input
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="ORD-XXXXXXXX"
            dir="ltr"
            className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm font-mono outline-none focus:border-primary"
            required
          />
        </label>
        <label className="block text-xs font-bold space-y-1">
          آخر 4 أرقام من رقم الهاتف
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="مثال: 0740"
            dir="ltr"
            type="tel"
            inputMode="numeric"
            maxLength={4}
            className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
          />
        </label>
        {error && (
          <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3 text-sm font-black text-primary-foreground shadow-brand disabled:opacity-60 hover:scale-[1.01] transition-transform"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <PackageSearch className="h-4 w-4" />}
          {busy ? "جارٍ البحث..." : "تتبع الطلب"}
        </button>
      </form>

      {/* Result */}
      {order && (
        <section className="rounded-2xl border border-showcase-border/50 bg-showcase-foreground/5 p-5 shadow-card backdrop-blur-md space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-showcase-border/50 pb-3">
            <span className="font-mono text-sm font-bold text-primary">{order.order_number}</span>
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${orderStatusTone(order.status)}`}>
              {orderStatusLabel(order.status)}
            </span>
          </div>

          <div className="flex flex-wrap justify-between gap-2 text-xs text-showcase-muted">
            <span>التاريخ: {new Date(order.created_at).toLocaleString("ar-EG")}</span>
            <span>الدفع: {paymentStatusLabel(order.payment_status)}</span>
            <span className="font-black text-showcase-foreground">{formatPrice(order.total)}</span>
          </div>

          {/* Terminated states */}
          {isTerminatedBadly ? (
            <div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              {order.status === "cancelled" ? <XCircle className="h-5 w-5 shrink-0" /> : <RotateCcw className="h-5 w-5 shrink-0" />}
              <div>
                <p className="font-bold">{orderStatusLabel(order.status)}</p>
                {order.history.length > 0 && (
                  <p className="text-xs opacity-80">
                    {new Date(order.history[order.history.length - 1].created_at).toLocaleString("ar-EG")}
                  </p>
                )}
              </div>
            </div>
          ) : (
            /* Timeline stepper */
            <ol className="space-y-0">
              {FLOW.map((s, i) => {
                const reached = reachedIndex >= i;
                const date = reached ? dateFor(s) : null;
                const isLast = i === FLOW.length - 1;
                return (
                  <li key={s} className="relative flex gap-3 pb-5 last:pb-0">
                    {!isLast && (
                      <span
                        className={`absolute right-[9px] top-6 h-full w-0.5 ${
                          reachedIndex > i ? "bg-success" : "bg-showcase-border/50"
                        }`}
                      />
                    )}
                    <span className="relative z-10 mt-0.5">
                      {reached ? (
                        <CheckCircle2 className="h-5 w-5 text-success" />
                      ) : (
                        <Circle className="h-5 w-5 text-showcase-muted/50" />
                      )}
                    </span>
                    <div>
                      <p className={`text-sm font-bold ${reached ? "text-showcase-foreground" : "text-showcase-muted"}`}>
                        {orderStatusLabel(s)}
                      </p>
                      {date && (
                        <p className="text-[11px] text-showcase-muted">
                          {new Date(date).toLocaleString("ar-EG")}
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}

          {/* Items */}
          <ul className="space-y-2 border-t border-showcase-border/50 pt-3">
            {order.items.map((it) => (
              <li key={it.id} className="flex items-center gap-3">
                {it.image ? (
                  <img src={it.image} alt={it.name} className="h-11 w-11 rounded-lg border border-showcase-border/50 object-cover" />
                ) : (
                  <div className="grid h-11 w-11 place-items-center rounded-lg bg-showcase-foreground/10 text-showcase-muted">
                    <Package className="h-4 w-4" />
                  </div>
                )}
                <span className="flex-1 text-xs font-bold text-showcase-foreground line-clamp-1">{it.name}</span>
                <span className="text-[11px] text-showcase-muted">
                  {it.quantity} × {formatPrice(it.unit_price)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="text-center text-xs text-showcase-muted">
        <Link to="/" className="hover:text-showcase-foreground transition-colors">
          ← العودة للمتجر
        </Link>
      </p>
    </div>
  );
}

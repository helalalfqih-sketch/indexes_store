import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useId } from "react";
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
const FLOW: OrderStatus[] = ["pending", "confirmed", "processing", "shipped", "delivered"];

function TrackPage() {
  const { user } = useSession();
  const [orderId, setOrderId] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<MyOrderDetails | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ orderId?: string; phone?: string }>({});
  const [lastAttemptTime, setLastAttemptTime] = useState<number>(0);

  const formId = useId();

  const validate = (): boolean => {
    const errs: { orderId?: string; phone?: string } = {};
    const input = orderId.trim();
    const orderNumber = normalizeOrderNumber(input);

    if (!input) {
      errs.orderId = "الرجاء إدخال رقم الطلب (مثال: ORD-XXXXXXXX).";
    } else if (!orderNumber) {
      errs.orderId = "صيغة رقم الطلب غير صحيحة. مثال: ORD-XXXXXXXX";
    }

    const last4 = phone.trim();
    if (!last4) {
      errs.phone = "الرجاء إدخال آخر 4 أرقام من رقم الهاتف.";
    } else if (!/^\d{4}$/.test(last4)) {
      errs.phone = "يجب إدخال 4 أرقام فقط (مثال: 0740).";
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setOrder(null);

    // Rate limiting: allow max 1 attempt per 2 seconds
    const now = Date.now();
    if (now - lastAttemptTime < 2000) {
      setError("الرجاء الانتظار لحظة قبل إعادة البحث.");
      return;
    }
    setLastAttemptTime(now);

    if (!validate()) return;

    const input = orderId.trim();
    const orderNumber = normalizeOrderNumber(input)!;
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
        found = await getTrackedOrder({ data: { orderNumber, phoneLast4: last4 } });
      }

      if (!found) {
        setError("لم نعثر على أي طلب بهاتف ورمز متطابقين. التأكد من البيانات وإعادة المحاولة.");
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
    <div className="sf-page sf-track-page flex flex-col gap-5" dir="rtl">
      {/* Header */}
      <section className="sf-page-heading flex items-center gap-4">
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

      {/* Form with custom Arabic validation */}
      <form onSubmit={onSubmit} noValidate className="sf-panel space-y-3">
        <label className="block text-xs font-bold space-y-1" htmlFor={`${formId}-order-id`}>
          <span>
            رقم الطلب <span className="text-destructive">*</span>
          </span>
          <input
            id={`${formId}-order-id`}
            value={orderId}
            onChange={(e) => {
              setOrderId(e.target.value);
              if (fieldErrors.orderId) setFieldErrors((p) => ({ ...p, orderId: "" }));
            }}
            placeholder="ORD-XXXXXXXX"
            dir="ltr"
            aria-invalid={Boolean(fieldErrors.orderId)}
            aria-describedby={fieldErrors.orderId ? `${formId}-order-error` : undefined}
            className={`w-full rounded-xl border bg-background px-3 py-2.5 text-sm font-mono outline-none transition-colors ${
              fieldErrors.orderId
                ? "border-destructive focus:border-destructive"
                : "border-input focus:border-primary"
            }`}
          />
          {fieldErrors.orderId && (
            <p
              id={`${formId}-order-error`}
              role="alert"
              className="text-[11px] font-semibold text-destructive"
            >
              {fieldErrors.orderId}
            </p>
          )}
        </label>

        <label className="block text-xs font-bold space-y-1" htmlFor={`${formId}-phone`}>
          <span>
            آخر 4 أرقام من رقم الهاتف <span className="text-destructive">*</span>
          </span>
          <input
            id={`${formId}-phone`}
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              if (fieldErrors.phone) setFieldErrors((p) => ({ ...p, phone: "" }));
            }}
            placeholder="مثال: 0740"
            dir="ltr"
            type="tel"
            inputMode="numeric"
            maxLength={4}
            aria-invalid={Boolean(fieldErrors.phone)}
            aria-describedby={fieldErrors.phone ? `${formId}-phone-error` : undefined}
            className={`w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none transition-colors ${
              fieldErrors.phone
                ? "border-destructive focus:border-destructive"
                : "border-input focus:border-primary"
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

        {error && (
          <div
            role="alert"
            className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive"
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-black text-primary-foreground shadow-brand disabled:opacity-60 hover:scale-[1.01] transition-transform min-h-[44px]"
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <PackageSearch className="h-4 w-4" />
          )}
          {busy ? "جارٍ البحث..." : "تتبع الطلب"}
        </button>
      </form>

      {/* Result */}
      {order && (
        <section
          className="rounded-2xl border border-showcase-border/50 bg-showcase-foreground/5 p-5 shadow-card backdrop-blur-md space-y-4"
          aria-live="polite"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-showcase-border/50 pb-3">
            <span className="font-mono text-sm font-bold text-primary">{order.order_number}</span>
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${orderStatusTone(order.status)}`}
            >
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
              {order.status === "cancelled" ? (
                <XCircle className="h-5 w-5 shrink-0" />
              ) : (
                <RotateCcw className="h-5 w-5 shrink-0" />
              )}
              <div>
                <p className="font-bold">{orderStatusLabel(order.status)}</p>
                {order.history.length > 0 && (
                  <p className="text-xs opacity-80">
                    {new Date(order.history[order.history.length - 1].created_at).toLocaleString(
                      "ar-EG",
                    )}
                  </p>
                )}
              </div>
            </div>
          ) : (
            /* Timeline stepper */
            <ol className="space-y-0" aria-label="مراحل تنفيذ الطلب">
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
                      <p
                        className={`text-sm font-bold ${reached ? "text-showcase-foreground" : "text-showcase-muted"}`}
                      >
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
          <ul
            className="space-y-2 border-t border-showcase-border/50 pt-3"
            aria-label="منتجات الطلب"
          >
            {order.items.map((it) => (
              <li key={it.id} className="flex items-center gap-3">
                {it.image ? (
                  <img
                    src={it.image}
                    alt={it.name}
                    className="h-11 w-11 rounded-lg border border-showcase-border/50 object-cover"
                  />
                ) : (
                  <div className="grid h-11 w-11 place-items-center rounded-lg bg-showcase-foreground/10 text-showcase-muted">
                    <Package className="h-4 w-4" />
                  </div>
                )}
                <span className="flex-1 text-xs font-bold text-showcase-foreground line-clamp-1">
                  {it.name}
                </span>
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

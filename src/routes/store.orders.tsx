import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ShoppingBag, ChevronDown, ChevronUp, Loader2, Package } from "lucide-react";
import { listTenantOrders, getTenantOrderDetails, updateOrderStatus } from "@/lib/orders-admin.functions";
import {
  ORDER_STATUS_LABELS_AR,
  ORDER_STATUS_TRANSITIONS,
  orderStatusLabel,
  orderStatusTone,
  paymentStatusLabel,
  formatOrderNumber,
  type OrderStatus,
} from "@/lib/order-status";
import { useStoreContext } from "@/components/store/store-shell";
import { StorefrontRealtimeService } from "@/lib/services/storefront-realtime.service";
import { formatPrice } from "@/lib/store-data";

export const Route = createFileRoute("/store/orders")({
  component: StoreOrdersPage,
});

const FILTERS = ["all", "pending", "confirmed", "processing", "shipped", "delivered", "cancelled"] as const;

function StoreOrdersPage() {
  const { can } = useStoreContext();
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<(typeof FILTERS)[number]>("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const listQ = useQuery({
    queryKey: ["store-orders", statusFilter],
    queryFn: () =>
      listTenantOrders({ data: { status: statusFilter === "all" ? undefined : statusFilter, limit: 30 } }),
  });

  const detailsQ = useQuery({
    queryKey: ["store-order-details", openId],
    queryFn: () => getTenantOrderDetails({ data: { orderId: openId! } }),
    enabled: !!openId,
  });

  const statusMut = useMutation({
    mutationFn: (v: { orderId: string; toStatus: OrderStatus }) => updateOrderStatus({ data: v }),
    onSuccess: (r) => {
      toast.success(`الحالة: ${orderStatusLabel(r.from)} ← ${orderStatusLabel(r.to)}`);
      qc.invalidateQueries({ queryKey: ["store-orders"] });
      if (openId) qc.invalidateQueries({ queryKey: ["store-order-details", openId] });
      // P4: delivered/refunded writes the financial ledger — notify dashboards.
      if (r.to === "delivered" || r.to === "refunded") {
        void StorefrontRealtimeService.notifyFinancialUpdated();
        qc.invalidateQueries({ queryKey: ["store-earnings"] });
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = listQ.data?.rows ?? [];
  const canWrite = can("staff");

  return (
    <div className="space-y-5">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-black">
          <ShoppingBag className="h-6 w-6 text-primary" /> الطلبات
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">{listQ.isLoading ? "جارٍ التحميل..." : `${listQ.data?.count ?? 0} طلب`}</p>
      </div>

      <div className="rounded-2xl glass p-3">
        <div className="flex gap-1 overflow-x-auto rounded-xl border border-border bg-surface p-1">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold whitespace-nowrap ${
                statusFilter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f === "all" ? "الكل" : ORDER_STATUS_LABELS_AR[f]}
            </button>
          ))}
        </div>
      </div>

      {listQ.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl glass" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl glass p-10 text-center space-y-2">
          <Package className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-bold">لا طلبات مطابقة</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((ord) => {
            const open = openId === ord.id;
            const d = open ? detailsQ.data : null;
            const allowed = d ? (ORDER_STATUS_TRANSITIONS[d.status] ?? []) : [];
            return (
              <div key={ord.id} className="rounded-2xl glass overflow-hidden">
                <button onClick={() => setOpenId(open ? null : ord.id)} className="flex w-full flex-wrap items-center gap-3 p-4 text-start hover:bg-foreground/5">
                  <span className="font-mono text-xs font-bold text-primary">{formatOrderNumber(ord.id)}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${orderStatusTone(ord.status)}`}>{orderStatusLabel(ord.status)}</span>
                  <span className="text-xs text-muted-foreground">{ord.customer_name || "ضيف"}</span>
                  <span className="ms-auto flex items-center gap-3">
                    <span className="text-sm font-black">{formatPrice(ord.total)}</span>
                    {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </span>
                </button>
                {open && (
                  <div className="space-y-3 border-t border-border/50 p-4">
                    {detailsQ.isLoading || !d ? (
                      <div className="flex h-20 items-center justify-center">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      </div>
                    ) : (
                      <>
                        <div className="grid gap-1.5 text-xs text-muted-foreground sm:grid-cols-2">
                          <span dir="ltr">📞 {d.customer_phone || "—"}</span>
                          <span>الدفع: {paymentStatusLabel(d.payment_status)}</span>
                          <span className="sm:col-span-2">📍 {d.customer_address || "—"}</span>
                        </div>
                        <ul className="space-y-1.5 border-t border-border/50 pt-2 text-xs">
                          {d.items.map((it) => (
                            <li key={it.id} className="flex items-center gap-2">
                              <span className="flex-1 font-bold line-clamp-1">{it.name}</span>
                              <span className="text-muted-foreground">{it.quantity} × {formatPrice(it.unit_price)}</span>
                              <span className="font-black">{formatPrice(it.total_price)}</span>
                            </li>
                          ))}
                        </ul>
                        {canWrite && allowed.length > 0 && (
                          <div className="flex flex-wrap items-center gap-2 border-t border-border/50 pt-3">
                            <span className="text-xs text-muted-foreground">نقل «{orderStatusLabel(d.status)}» إلى:</span>
                            {allowed.map((s) => (
                              <button
                                key={s}
                                onClick={() => statusMut.mutate({ orderId: d.id, toStatus: s })}
                                disabled={statusMut.isPending}
                                className="rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/20 disabled:opacity-50"
                              >
                                {ORDER_STATUS_LABELS_AR[s]}
                              </button>
                            ))}
                          </div>
                        )}
                        {canWrite && allowed.length === 0 && (
                          <p className="border-t border-border/50 pt-2 text-xs text-muted-foreground">حالة نهائية — لا انتقالات متاحة.</p>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

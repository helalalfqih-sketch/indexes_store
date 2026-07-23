import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Search,
  Loader2,
  ShoppingBag,
  ChevronDown,
  ChevronUp,
  Package,
  Phone,
  MapPin,
  Mail,
  StickyNote,
  History,
} from "lucide-react";
import {
  listTenantOrders,
  getTenantOrderDetails,
  updateOrderStatus,
} from "@/lib/orders-admin.functions";
import {
  ORDER_STATUS_LABELS_AR,
  ORDER_STATUS_TRANSITIONS,
  orderStatusLabel,
  orderStatusTone,
  paymentStatusLabel,
  paymentProviderLabel,
  formatOrderNumber,
  type OrderStatus,
} from "@/lib/order-status";
import { formatPrice } from "@/lib/store-data";

export const Route = createFileRoute("/admin/orders")({
  component: AdminOrdersPage,
});

const PAGE_SIZE = 20;
const STATUS_FILTERS = [
  "all",
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
] as const;

function AdminOrdersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>("all");
  const [page, setPage] = useState(0);
  const [openId, setOpenId] = useState<string | null>(null);
  const [note, setNote] = useState("");

  const listQ = useQuery({
    queryKey: ["admin-orders", { statusFilter, search: search.trim() || undefined, page }],
    queryFn: () =>
      listTenantOrders({
        data: {
          status: statusFilter === "all" ? undefined : statusFilter,
          search: search.trim() || undefined,
          limit: PAGE_SIZE,
          offset: page * PAGE_SIZE,
        },
      }),
  });

  const detailsQ = useQuery({
    queryKey: ["admin-order-details", openId],
    queryFn: () => getTenantOrderDetails({ data: { orderId: openId! } }),
    enabled: !!openId,
  });

  const statusMut = useMutation({
    mutationFn: (v: { orderId: string; toStatus: OrderStatus }) =>
      updateOrderStatus({
        data: { orderId: v.orderId, toStatus: v.toStatus, note: note.trim() || undefined },
      }),
    onSuccess: (res) => {
      toast.success(`تم تحديث الحالة: ${orderStatusLabel(res.from)} ← ${orderStatusLabel(res.to)}`);
      setNote("");
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
      if (openId) qc.invalidateQueries({ queryKey: ["admin-order-details", openId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = listQ.data?.rows ?? [];
  const count = listQ.data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black lg:text-4xl text-foreground flex items-center gap-3">
            <ShoppingBag className="h-8 w-8 text-primary" />
            الطلبات
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {listQ.isLoading ? "جارٍ التحميل..." : `${count} طلب`}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-2xl glass p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute top-1/2 -translate-y-1/2 start-3 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="بحث بالاسم أو الهاتف أو معرّف الطلب..."
            className="w-full rounded-xl border border-border bg-surface ps-9 pe-3 py-2 text-sm outline-none focus:border-primary"
          />
        </div>
        <div className="flex gap-1 rounded-xl border border-border bg-surface p-1 overflow-x-auto">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => {
                setStatusFilter(f);
                setPage(0);
              }}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold whitespace-nowrap ${
                statusFilter === f
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f === "all" ? "الكل" : ORDER_STATUS_LABELS_AR[f]}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {listQ.isError ? (
        <div className="rounded-2xl glass p-8 text-center text-sm text-destructive">
          تعذّر تحميل الطلبات — تأكد من صلاحياتك.
        </div>
      ) : listQ.isLoading ? (
        <div className="flex h-40 items-center justify-center rounded-2xl glass">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl glass p-10 text-center space-y-2">
          <Package className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-bold">لا توجد طلبات مطابقة</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((ord) => {
            const open = openId === ord.id;
            const d = open ? detailsQ.data : null;
            return (
              <div key={ord.id} className="rounded-2xl glass overflow-hidden">
                {/* Row header */}
                <button
                  onClick={() => setOpenId(open ? null : ord.id)}
                  className="w-full flex flex-wrap items-center gap-3 p-4 text-start hover:bg-foreground/5 transition"
                >
                  <span className="font-mono text-xs font-bold text-primary">
                    {formatOrderNumber(ord.id)}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${orderStatusTone(ord.status)}`}>
                    {orderStatusLabel(ord.status)}
                  </span>
                  {ord.notes?.includes("طلب توفير كمية") && (
                    <span className="rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold">
                      📦 طلب توفير كمية
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {ord.customer_name || "ضيف"} {ord.customer_phone ? `· ${ord.customer_phone}` : ""}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(ord.created_at).toLocaleString("ar-EG")}
                  </span>
                  <span className="ms-auto flex items-center gap-3">
                    <span className="text-sm font-black">{formatPrice(ord.total)}</span>
                    {open ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </span>
                </button>

                {/* Details */}
                {open && (
                  <div className="border-t border-border/50 p-4 space-y-4">
                    {detailsQ.isLoading || !d ? (
                      <div className="flex h-24 items-center justify-center">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      </div>
                    ) : (
                      <>
                        {/* Customer info */}
                        <div className="grid gap-2 sm:grid-cols-2 text-xs">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="h-3.5 w-3.5 shrink-0" />
                            <span dir="ltr">{d.customer_phone || "—"}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Mail className="h-3.5 w-3.5 shrink-0" />
                            <span dir="ltr">{d.customer_email || "—"}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground sm:col-span-2">
                            <MapPin className="h-3.5 w-3.5 shrink-0" />
                            <span>{d.customer_address || "—"}</span>
                          </div>
                          {d.notes && (
                            <div className="flex items-center gap-2 text-muted-foreground sm:col-span-2">
                              <StickyNote className="h-3.5 w-3.5 shrink-0" />
                              <span>{d.notes}</span>
                            </div>
                          )}
                          <div className="text-muted-foreground">
                            الدفع: <span className="font-bold text-foreground">{paymentStatusLabel(d.payment_status)}</span>
                          </div>
                          <div className="text-muted-foreground">
                            طريقة الدفع: <span className="font-bold text-foreground">{paymentProviderLabel(d.payment_provider)}</span>
                          </div>
                          <div className="text-muted-foreground">
                            النوع: <span className="font-bold text-foreground">{d.user_id ? "عميل مسجَّل" : "ضيف"}</span>
                          </div>
                        </div>

                        {/* Items */}
                        <ul className="space-y-2 border-t border-border/50 pt-3">
                          {d.items.map((it) => (
                            <li key={it.id} className="flex items-center gap-3 text-xs">
                              {it.image ? (
                                <img src={it.image} alt={it.name} className="h-10 w-10 rounded-lg object-cover border border-border/50" />
                              ) : (
                                <div className="grid h-10 w-10 place-items-center rounded-lg bg-muted text-muted-foreground">
                                  <Package className="h-4 w-4" />
                                </div>
                              )}
                              <span className="flex-1 font-bold line-clamp-1">{it.name}</span>
                              <span className="text-muted-foreground">
                                {it.quantity} × {formatPrice(it.unit_price)}
                              </span>
                              <span className="font-black">{formatPrice(it.total_price)}</span>
                            </li>
                          ))}
                        </ul>

                        {/* Timeline */}
                        {d.history.length > 0 && (
                          <div className="border-t border-border/50 pt-3 space-y-1.5">
                            <p className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                              <History className="h-3.5 w-3.5" /> سجل الحالات
                            </p>
                            {d.history.map((h) => (
                              <p key={h.id} className="text-[11px] text-muted-foreground">
                                {new Date(h.created_at).toLocaleString("ar-EG")} —{" "}
                                {h.from_status ? `${orderStatusLabel(h.from_status)} ← ` : ""}
                                <span className="font-bold text-foreground">{orderStatusLabel(h.to_status)}</span>
                                {h.note ? ` · ${h.note}` : ""}
                              </p>
                            ))}
                          </div>
                        )}

                        {/* Status change — allowed transitions only (server enforces the same map) */}
                        {(() => {
                          const allowed = ORDER_STATUS_TRANSITIONS[d.status] ?? [];
                          if (allowed.length === 0) {
                            return (
                              <p className="border-t border-border/50 pt-3 text-xs text-muted-foreground">
                                حالة نهائية «{orderStatusLabel(d.status)}» — لا انتقالات متاحة.
                              </p>
                            );
                          }
                          return (
                            <div className="border-t border-border/50 pt-3 flex flex-wrap items-center gap-2">
                              <span className="text-xs text-muted-foreground">
                                نقل «{orderStatusLabel(d.status)}» إلى:
                              </span>
                              <select
                                defaultValue={allowed[0]}
                                id={`status-${d.id}`}
                                className="rounded-xl border border-border bg-surface px-3 py-2 text-xs font-bold outline-none focus:border-primary"
                              >
                                {allowed.map((s) => (
                                  <option key={s} value={s}>
                                    {ORDER_STATUS_LABELS_AR[s]}
                                  </option>
                                ))}
                              </select>
                              <input
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="ملاحظة (اختياري)"
                                className="flex-1 min-w-[160px] rounded-xl border border-border bg-surface px-3 py-2 text-xs outline-none focus:border-primary"
                              />
                              <button
                                disabled={statusMut.isPending}
                                onClick={() => {
                                  const sel = document.getElementById(`status-${d.id}`) as HTMLSelectElement | null;
                                  const toStatus = (sel?.value ?? allowed[0]) as OrderStatus;
                                  statusMut.mutate({ orderId: d.id, toStatus });
                                }}
                                className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground disabled:opacity-60 hover:bg-primary/90 transition"
                              >
                                {statusMut.isPending ? "جارٍ..." : "تحديث الحالة"}
                              </button>
                            </div>
                          );
                        })()}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2 text-xs">
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="rounded-lg border border-border px-3 py-1.5 font-bold disabled:opacity-40"
              >
                السابق
              </button>
              <span className="text-muted-foreground">
                صفحة {page + 1} من {totalPages}
              </span>
              <button
                disabled={page + 1 >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-border px-3 py-1.5 font-bold disabled:opacity-40"
              >
                التالي
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

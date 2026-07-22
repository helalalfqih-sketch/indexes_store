import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Boxes, AlertTriangle, History } from "lucide-react";
import { getStoreInventory, recordStoreInventory, getStoreProducts } from "@/lib/store-dashboard.functions";
import { useStoreContext } from "@/components/store/store-shell";

export const Route = createFileRoute("/store/inventory")({
  component: StoreInventoryPage,
});

const REASONS: Record<string, string> = {
  restock: "توريد",
  adjustment: "تسوية",
  damage: "تالف",
  return: "مرتجع",
};

function StoreInventoryPage() {
  const { can } = useStoreContext();
  const qc = useQueryClient();
  const fetchInv = useServerFn(getStoreInventory);
  const record = useServerFn(recordStoreInventory);
  const listProducts = useServerFn(getStoreProducts);

  const invQ = useQuery({ queryKey: ["store-inventory"], queryFn: () => fetchInv() });
  const productsQ = useQuery({ queryKey: ["store-products-mini"], queryFn: () => listProducts({ data: {} }) });

  const [productId, setProductId] = useState("");
  const [delta, setDelta] = useState("1");
  const [reason, setReason] = useState<"restock" | "adjustment" | "damage" | "return">("restock");

  const recordMut = useMutation({
    mutationFn: () => record({ data: { productId, delta: Number(delta), reason } }),
    onSuccess: (r) => {
      if (r.success) {
        toast.success("تم تسجيل حركة المخزون");
        qc.invalidateQueries({ queryKey: ["store-inventory"] });
        qc.invalidateQueries({ queryKey: ["store-products"] });
      } else toast.error(r.message ?? "فشل التسجيل");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const inv = invQ.data;

  return (
    <div className="space-y-5">
      <h1 className="flex items-center gap-2 text-2xl font-black">
        <Boxes className="h-6 w-6 text-primary" /> المخزون
      </h1>

      {can("staff") && (
        <div className="rounded-2xl glass p-4 flex flex-wrap items-end gap-2">
          <label className="min-w-[200px] flex-1 space-y-1 text-xs font-bold">
            المنتج
            <select value={productId} onChange={(e) => setProductId(e.target.value)} className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm">
              <option value="">اختر منتجاً...</option>
              {(productsQ.data ?? []).map((p) => (
                <option key={p.id} value={p.id}>{p.name} (المخزون: {p.stock})</option>
              ))}
            </select>
          </label>
          <label className="w-24 space-y-1 text-xs font-bold">
            الكمية ±
            <input type="number" value={delta} onChange={(e) => setDelta(e.target.value)} dir="ltr" className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm" />
          </label>
          <select value={reason} onChange={(e) => setReason(e.target.value as any)} className="rounded-xl border border-border bg-surface px-3 py-2 text-xs font-bold">
            {Object.entries(REASONS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
          <button
            onClick={() => {
              if (!productId || !Number(delta)) {
                toast.error("اختر منتجاً وكمية");
                return;
              }
              recordMut.mutate();
            }}
            disabled={recordMut.isPending}
            className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground disabled:opacity-60"
          >
            تسجيل
          </button>
        </div>
      )}

      <section className="rounded-2xl glass p-5 space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-black">
          <AlertTriangle className="h-4 w-4 text-amber-500" /> تنبيهات مخزون منخفض (≤ 5)
        </h2>
        {invQ.isLoading ? (
          <div className="h-16 animate-pulse rounded-xl bg-accent/50" />
        ) : (inv?.lowStock.length ?? 0) === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">لا تنبيهات — المخزون بخير ✅</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {inv!.lowStock.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-xl border border-border bg-surface p-3 text-xs">
                <span className="line-clamp-1 font-bold">{p.name}</span>
                <span className="font-black text-destructive">{p.stock}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl glass p-5 space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-black">
          <History className="h-4 w-4 text-primary" /> سجل الحركات
        </h2>
        {invQ.isLoading ? (
          <div className="h-24 animate-pulse rounded-xl bg-accent/50" />
        ) : (inv?.movements.length ?? 0) === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">لا حركات مسجَّلة بعد</p>
        ) : (
          <div className="max-h-96 space-y-1.5 overflow-y-auto">
            {inv!.movements.map((m) => (
              <div key={m.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-border/60 bg-surface p-2.5 text-[11px]">
                <span className={`rounded-full px-2 py-0.5 font-black ${m.delta > 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                  {m.delta > 0 ? `+${m.delta}` : m.delta}
                </span>
                <span className="font-bold">{m.product_name ?? m.product_id.slice(0, 8)}</span>
                <span className="text-muted-foreground">{REASONS[m.reason] ?? m.reason}</span>
                <span className="ms-auto text-[10px] text-muted-foreground">{new Date(m.created_at).toLocaleString("ar-EG")}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

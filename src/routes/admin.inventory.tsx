import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Search, Plus, Minus, Loader2, Boxes, ArrowRight } from "lucide-react";
import {
  listAdminProducts,
  recordInventoryMovement,
  listInventoryMovements,
} from "@/lib/actions/admin.actions";

export const Route = createFileRoute("/admin/inventory")({
  component: InventoryPage,
});

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function InventoryPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "low" | "out">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [delta, setDelta] = useState(1);

  const productsQ = useQuery({
    queryKey: ["admin-products", { search: search.trim() || undefined }],
    queryFn: () => listAdminProducts({ search: search.trim() || undefined }),
  });

  const movementsQ = useQuery({
    queryKey: ["inventory-movements", selectedId],
    queryFn: () => listInventoryMovements(selectedId!),
    enabled: !!selectedId && UUID_RE.test(selectedId),
  });

  const products = useMemo(() => {
    const list = productsQ.data ?? [];
    if (filter === "out") return list.filter((p) => p.stock <= 0);
    if (filter === "low") return list.filter((p) => p.stock > 0 && p.stock <= 5);
    return list;
  }, [productsQ.data, filter]);

  const recordMut = useMutation({
    mutationFn: (v: {
      productId: string;
      delta: number;
      reason: "restock" | "adjustment" | "damage" | "return";
    }) =>
      recordInventoryMovement({
        product_id: v.productId,
        delta: v.delta,
        reason: v.reason,
      }),
    onSuccess: () => {
      toast.success("تم تعديل المخزون");
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      if (selectedId) qc.invalidateQueries({ queryKey: ["inventory-movements", selectedId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black lg:text-4xl text-foreground">المخزون</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {productsQ.isLoading ? "جارٍ التحميل..." : `${products.length} منتج`}
          </p>
        </div>
      </div>

      <div className="rounded-2xl glass p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute top-1/2 -translate-y-1/2 start-3 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث..."
            className="w-full rounded-xl border border-border bg-surface ps-9 pe-3 py-2 text-sm outline-none focus:border-primary"
          />
        </div>
        <div className="flex gap-1 rounded-xl border border-border bg-surface p-1">
          {(["all", "low", "out"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f === "all" ? "الكل" : f === "low" ? "منخفض (≤5)" : "نفد"}
            </button>
          ))}
        </div>
        <div className="ms-auto flex items-center gap-2">
          <span className="text-xs text-muted-foreground">تعديل سريع:</span>
          <button
            onClick={() => setDelta(Math.max(1, delta - 1))}
            className="grid h-8 w-8 place-items-center rounded-lg border border-border"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <input
            type="number"
            min={1}
            value={delta}
            onChange={(e) => setDelta(Math.max(1, Number(e.target.value)))}
            className="w-14 rounded-lg border border-border bg-surface px-2 py-1.5 text-center text-sm"
          />
          <button
            onClick={() => setDelta(delta + 1)}
            className="grid h-8 w-8 place-items-center rounded-lg border border-border"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {productsQ.isError ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-8 text-center text-destructive">
          <p className="text-sm">{(productsQ.error as Error).message}</p>
        </div>
      ) : productsQ.isLoading ? (
        <div className="rounded-2xl border border-border bg-surface p-12 text-center">
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface p-12 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-primary/10">
            <Boxes className="h-7 w-7 text-primary" />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">لا توجد منتجات</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 overflow-x-auto rounded-2xl border border-border bg-surface">
            <table className="min-w-[620px] w-full text-sm">
              <thead className="text-xs text-muted-foreground border-b border-border">
                <tr>
                  <th className="text-start p-3">المنتج</th>
                  <th className="text-start p-3">المخزون</th>
                  <th className="text-end p-3">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => setSelectedId(p.id)}
                    className={`border-b border-border/40 cursor-pointer ${selectedId === p.id ? "bg-primary/5" : "hover:bg-accent/40"}`}
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 overflow-hidden rounded-lg bg-muted shrink-0">
                          {p.images[0] && (
                            <img src={p.images[0]} alt="" className="h-full w-full object-cover" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate font-bold">{p.name}</div>
                          <div className="truncate text-xs text-muted-foreground font-mono">
                            {p.slug}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                          p.stock <= 0
                            ? "bg-destructive/20 text-destructive"
                            : p.stock <= 5
                              ? "bg-warning/20 text-warning"
                              : "bg-success/20 text-success"
                        }`}
                      >
                        {p.stock}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() =>
                            recordMut.mutate({ productId: p.id, delta, reason: "restock" })
                          }
                          disabled={recordMut.isPending}
                          className="inline-flex items-center gap-1 rounded-lg bg-success/15 px-2 py-1 text-xs font-bold text-success hover:bg-success/25"
                        >
                          <Plus className="h-3 w-3" /> {delta}
                        </button>
                        <button
                          onClick={() => {
                            if (p.stock - delta < 0) {
                              toast.error("لا يمكن أن يصبح المخزون سالبًا");
                              return;
                            }
                            recordMut.mutate({
                              productId: p.id,
                              delta: -Math.abs(delta),
                              reason: "adjustment",
                            });
                          }}
                          disabled={recordMut.isPending}
                          className="inline-flex items-center gap-1 rounded-lg bg-destructive/10 px-2 py-1 text-xs font-bold text-destructive hover:bg-destructive/20"
                        >
                          <Minus className="h-3 w-3" /> {delta}
                        </button>
                        <Link
                          to="/admin/product/$id"
                          params={{ id: p.id }}
                          className="grid h-6 w-6 place-items-center rounded-lg hover:bg-accent"
                          title="فتح المنتج"
                        >
                          <ArrowRight className="h-3 w-3 rotate-180" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-5">
            <h2 className="text-sm font-black mb-3">حركات المخزون</h2>
            {!selectedId ? (
              <p className="text-xs text-muted-foreground">اختر منتجًا لعرض حركاته.</p>
            ) : movementsQ.isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (movementsQ.data ?? []).length === 0 ? (
              <p className="text-xs text-muted-foreground">لا توجد حركات</p>
            ) : (
              <ul className="space-y-1.5 text-xs">
                {(movementsQ.data ?? []).map((m) => (
                  <li key={m.id} className="rounded-lg bg-surface p-2">
                    <div className="flex items-center justify-between">
                      <span
                        className={`font-bold ${m.delta > 0 ? "text-success" : "text-destructive"}`}
                      >
                        {m.delta > 0 ? "+" : ""}
                        {m.delta}
                      </span>
                      <span className="text-muted-foreground">{m.reason}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>{m.note ?? ""}</span>
                      <span>{new Date(m.created_at).toLocaleString("ar")}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

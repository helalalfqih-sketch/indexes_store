import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Package, Plus, Search, Trash2, Loader2 } from "lucide-react";
import {
  getStoreProducts,
  createStoreProduct,
  updateStoreProduct,
  deleteStoreProduct,
} from "@/lib/store-dashboard.functions";
import { notifyStorefrontPublished } from "@/components/appearance-provider";
import { useStoreContext } from "@/components/store/store-shell";
import { formatPrice } from "@/lib/store-data";

export const Route = createFileRoute("/store/products")({
  component: StoreProductsPage,
});

const inputCls = "w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary";

function StoreProductsPage() {
  const { can } = useStoreContext();
  const qc = useQueryClient();
  const list = useServerFn(getStoreProducts);
  const createFn = useServerFn(createStoreProduct);
  const updateFn = useServerFn(updateStoreProduct);
  const deleteFn = useServerFn(deleteStoreProduct);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "drafts" | "low">("all");
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", price: "", stock: "1", image: "", is_published: true });

  const productsQ = useQuery({
    queryKey: ["store-products", { search: search.trim() || undefined, filter }],
    queryFn: () =>
      list({
        data: {
          search: search.trim() || undefined,
          onlyDrafts: filter === "drafts" || undefined,
          onlyLow: filter === "low" || undefined,
        },
      }),
  });
  const products = productsQ.data ?? [];

  const invalidate = () => qc.invalidateQueries({ queryKey: ["store-products"] });

  const createMut = useMutation({
    mutationFn: () =>
      createFn({
        data: {
          name: form.name,
          price: Number(form.price),
          stock: Math.max(0, Number(form.stock) || 0),
          image: form.image.trim() || undefined,
          is_published: form.is_published,
        },
      }),
    onSuccess: (r) => {
      if (r.success) {
        toast.success("تمت إضافة المنتج");
        setAdding(false);
        setForm({ name: "", price: "", stock: "1", image: "", is_published: true });
        invalidate();
        void notifyStorefrontPublished();
      } else toast.error(r.message ?? "فشل الإنشاء");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMut = useMutation({
    mutationFn: (v: { id: string; patch: Record<string, unknown> }) => updateFn({ data: { id: v.id, ...v.patch } }),
    onSuccess: (r) => {
      if (r.success) {
        invalidate();
        void notifyStorefrontPublished();
      } else toast.error(r.message ?? "فشل التحديث");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: (r) => {
      if (r.success) {
        toast.success("تم حذف المنتج");
        invalidate();
        void notifyStorefrontPublished();
      } else toast.error(r.message ?? "فشل الحذف");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const canWrite = can("staff");

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-black">
            <Package className="h-6 w-6 text-primary" /> المنتجات
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">{productsQ.isLoading ? "جارٍ التحميل..." : `${products.length} منتج`}</p>
        </div>
        {canWrite && (
          <button
            onClick={() => setAdding((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> منتج جديد
          </button>
        )}
      </div>

      {adding && canWrite && (
        <div className="rounded-2xl glass p-4 space-y-3">
          <h2 className="text-sm font-black">إضافة منتج سريع</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="اسم المنتج" className={inputCls} />
            <input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="السعر" type="number" min="0" dir="ltr" className={inputCls} />
            <input value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} placeholder="المخزون" type="number" min="0" dir="ltr" className={inputCls} />
            <input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="رابط الصورة (اختياري)" dir="ltr" className={inputCls} />
          </div>
          <label className="flex items-center gap-2 text-xs font-bold">
            <input type="checkbox" checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} />
            نشر مباشرةً في المتجر
          </label>
          <button
            onClick={() => {
              if (form.name.trim().length < 2 || !form.price) {
                toast.error("أدخل اسم المنتج وسعره");
                return;
              }
              createMut.mutate();
            }}
            disabled={createMut.isPending}
            className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground disabled:opacity-60"
          >
            {createMut.isPending ? "جارٍ الإضافة..." : "إضافة المنتج"}
          </button>
        </div>
      )}

      <div className="rounded-2xl glass p-3 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث..." className={`${inputCls} ps-9`} />
        </div>
        <div className="flex gap-1 rounded-xl border border-border bg-surface p-1">
          {(
            [
              ["all", "الكل"],
              ["drafts", "مسودات"],
              ["low", "مخزون ≤ 5"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setFilter(id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold ${filter === id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {productsQ.isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl glass" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-2xl glass p-10 text-center space-y-2">
          <Package className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-bold">لا منتجات مطابقة</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {products.map((p) => (
            <div key={p.id} className="rounded-2xl glass p-4">
              <div className="flex items-start gap-3">
                {p.images?.[0] ? (
                  <img src={p.images[0]} alt="" className="h-14 w-14 rounded-xl border border-border object-cover" />
                ) : (
                  <div className="grid h-14 w-14 place-items-center rounded-xl bg-muted text-muted-foreground">
                    <Package className="h-5 w-5" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-xs font-black">{p.name}</p>
                  <p className="mt-1 text-sm font-black text-primary">{formatPrice(p.price)}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border/50 pt-3 text-[11px]">
                <span className={`rounded-full px-2 py-0.5 font-bold ${p.is_published ? "bg-success/10 text-success" : "bg-amber-500/10 text-amber-500"}`}>
                  {p.is_published ? "منشور" : "مسودة"}
                </span>
                <span className={`font-bold ${p.stock <= 5 ? "text-destructive" : "text-muted-foreground"}`}>المخزون: {p.stock}</span>
                {canWrite && (
                  <span className="ms-auto flex items-center gap-1.5">
                    <button
                      onClick={() => updateMut.mutate({ id: p.id, patch: { is_published: !p.is_published } })}
                      disabled={updateMut.isPending}
                      className="rounded-lg bg-primary/10 px-2 py-1 font-bold text-primary hover:bg-primary/20"
                    >
                      {p.is_published ? "إخفاء" : "نشر"}
                    </button>
                    {can("manager") && (
                      <button
                        onClick={() => deleteMut.mutate(p.id)}
                        disabled={deleteMut.isPending}
                        className="rounded-lg p-1.5 text-destructive hover:bg-destructive/10"
                        title="حذف"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {productsQ.isFetching && !productsQ.isLoading && (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" /> تحديث...
        </p>
      )}
    </div>
  );
}

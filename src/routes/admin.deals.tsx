import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Flame,
  Plus,
  Trash2,
  Edit2,
  ToggleLeft,
  ToggleRight,
  Calendar,
  Tag,
  Loader2,
  Search,
  ChevronRight,
} from "lucide-react";
import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { listAdminProducts, updateAdminProduct } from "@/lib/actions/admin.actions";
import { formatPrice } from "@/lib/store-data";

export const Route = createFileRoute("/admin/deals")({
  component: DealsPage,
});

type DealProduct = {
  id: string;
  name: string;
  price: number;
  old_price?: number | null;
  badge?: string | null;
  is_deal?: boolean;
  deal_start?: string | null;
  deal_end?: string | null;
  images?: string[];
};

type EditState = {
  id: string;
  is_deal: boolean;
  deal_start: string;
  deal_end: string;
  badge: string;
  old_price: string;
};

function DealsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<EditState | null>(null);

  const { data: rawProducts = [], isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: () => listAdminProducts(),
  });

  const products = (rawProducts as DealProduct[]).filter(
    (p) => !search || p.name.toLowerCase().includes(search.toLowerCase()),
  );
  const activeDeals = products.filter((p) => p.is_deal);
  const nonDeals = products.filter((p) => !p.is_deal);

  const saveMut = useMutation({
    mutationFn: (payload: {
      id: string;
      is_deal: boolean;
      deal_start: string | null;
      deal_end: string | null;
      badge: string | null;
      old_price: number | null;
    }) =>
      updateAdminProduct({
        id: payload.id,
        is_deal: payload.is_deal,
        deal_start: payload.deal_start || null,
        deal_end: payload.deal_end || null,
        badge: payload.badge || null,
        old_price: payload.old_price,
      }),
    onSuccess: () => {
      toast.success("تم حفظ العرض بنجاح");
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      setEditing(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleDeal = useCallback(
    (p: DealProduct) => {
      saveMut.mutate({
        id: p.id,
        is_deal: !p.is_deal,
        deal_start: p.deal_start ?? null,
        deal_end: p.deal_end ?? null,
        badge: p.is_deal ? null : (p.badge ?? "عرض خاص 🔥"),
        old_price: p.old_price ?? null,
      });
    },
    [saveMut],
  );

  const openEdit = (p: DealProduct) =>
    setEditing({
      id: p.id,
      is_deal: p.is_deal ?? false,
      deal_start: p.deal_start ?? "",
      deal_end: p.deal_end ?? "",
      badge: p.badge ?? "عرض خاص 🔥",
      old_price: p.old_price != null ? String(p.old_price) : "",
    });

  const saveEdit = () => {
    if (!editing) return;
    saveMut.mutate({
      id: editing.id,
      is_deal: editing.is_deal,
      deal_start: editing.deal_start || null,
      deal_end: editing.deal_end || null,
      badge: editing.badge || null,
      old_price: editing.old_price ? Number(editing.old_price) : null,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <Flame className="h-6 w-6 text-primary" />
            إدارة العروض
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {activeDeals.length} عرض نشط · حدد المنتجات وأوقات العروض
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border bg-surface p-4 text-center">
          <div className="text-2xl font-black text-primary">{activeDeals.length}</div>
          <div className="text-xs text-muted-foreground">عرض نشط</div>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-4 text-center">
          <div className="text-2xl font-black">{products.length}</div>
          <div className="text-xs text-muted-foreground">إجمالي المنتجات</div>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-4 text-center">
          <div className="text-2xl font-black text-success">
            {products.filter((p) => p.old_price && p.old_price > (p.price ?? 0)).length}
          </div>
          <div className="text-xs text-muted-foreground">بسعر مخفض</div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحث عن منتج..."
          className="w-full rounded-xl border border-border bg-surface pr-10 pl-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active Deals */}
          {activeDeals.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-bold text-primary flex items-center gap-2">
                <Flame className="h-4 w-4" /> العروض النشطة ({activeDeals.length})
              </h2>
              <div className="space-y-2">
                {activeDeals.map((p) => (
                  <DealRow
                    key={p.id}
                    product={p}
                    onToggle={() => toggleDeal(p)}
                    onEdit={() => openEdit(p)}
                    toggling={saveMut.isPending}
                  />
                ))}
              </div>
            </section>
          )}

          {/* All Products */}
          <section>
            <h2 className="mb-3 text-sm font-bold text-muted-foreground">
              المنتجات الأخرى ({nonDeals.length})
            </h2>
            <div className="space-y-2">
              {nonDeals.map((p) => (
                <DealRow
                  key={p.id}
                  product={p}
                  onToggle={() => toggleDeal(p)}
                  onEdit={() => openEdit(p)}
                  toggling={saveMut.isPending}
                />
              ))}
            </div>
          </section>
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 space-y-4">
            <h2 className="text-base font-black flex items-center gap-2">
              <Edit2 className="h-4 w-4 text-primary" /> إعدادات العرض
            </h2>

            <div className="flex items-center justify-between rounded-xl bg-muted px-4 py-3">
              <span className="text-sm font-medium">تفعيل العرض</span>
              <button
                type="button"
                onClick={() => setEditing((e) => e ? { ...e, is_deal: !e.is_deal } : e)}
              >
                {editing.is_deal ? (
                  <ToggleRight className="h-6 w-6 text-primary" />
                ) : (
                  <ToggleLeft className="h-6 w-6 text-muted-foreground" />
                )}
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                السعر القديم (قبل الخصم)
              </label>
              <input
                type="number"
                value={editing.old_price}
                onChange={(e) => setEditing((s) => s ? { ...s, old_price: e.target.value } : s)}
                placeholder="مثال: 5000"
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                <Tag className="inline h-3 w-3 mb-0.5" /> تسمية العرض (Badge)
              </label>
              <input
                value={editing.badge}
                onChange={(e) => setEditing((s) => s ? { ...s, badge: e.target.value } : s)}
                placeholder="مثال: خصم 30% 🔥"
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  <Calendar className="inline h-3 w-3" /> بداية العرض
                </label>
                <input
                  type="datetime-local"
                  value={editing.deal_start}
                  onChange={(e) => setEditing((s) => s ? { ...s, deal_start: e.target.value } : s)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  <Calendar className="inline h-3 w-3" /> نهاية العرض
                </label>
                <input
                  type="datetime-local"
                  value={editing.deal_end}
                  onChange={(e) => setEditing((s) => s ? { ...s, deal_end: e.target.value } : s)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={saveEdit}
                disabled={saveMut.isPending}
                className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-60 transition hover:bg-primary/90"
              >
                {saveMut.isPending ? "جارٍ الحفظ..." : "حفظ العرض"}
              </button>
              <button
                onClick={() => setEditing(null)}
                className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold hover:bg-accent transition"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DealRow({
  product,
  onToggle,
  onEdit,
  toggling,
}: {
  product: DealProduct;
  onToggle: () => void;
  onEdit: () => void;
  toggling: boolean;
}) {
  const img = product.images?.[0];
  return (
    <div
      className={`flex items-center gap-3 rounded-xl border p-3 transition ${
        product.is_deal ? "border-primary/30 bg-primary/5" : "border-border bg-surface"
      }`}
    >
      {img && (
        <img
          src={img}
          alt={product.name}
          className="h-12 w-12 rounded-lg object-cover shrink-0"
        />
      )}
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-bold">{product.name}</div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs font-semibold text-primary">
            {formatPrice(product.price ?? 0)}
          </span>
          {product.old_price && (
            <span className="text-xs text-muted-foreground line-through">
              {formatPrice(product.old_price)}
            </span>
          )}
          {product.badge && (
            <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-bold text-destructive">
              {product.badge}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onEdit}
          className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition"
          title="تعديل العرض"
        >
          <Edit2 className="h-4 w-4" />
        </button>
        <button
          onClick={onToggle}
          disabled={toggling}
          className="rounded-lg p-1 transition disabled:opacity-50"
          title={product.is_deal ? "إيقاف العرض" : "تفعيل كعرض"}
        >
          {product.is_deal ? (
            <ToggleRight className="h-7 w-7 text-primary" />
          ) : (
            <ToggleLeft className="h-7 w-7 text-muted-foreground" />
          )}
        </button>
      </div>
    </div>
  );
}

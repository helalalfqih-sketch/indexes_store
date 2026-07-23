import { createFileRoute } from "@tanstack/react-router";
import {
  Megaphone,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  ToggleLeft,
  ToggleRight,
  Tag,
  Package,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { listAdminProducts } from "@/lib/actions/admin.actions";

export const Route = createFileRoute("/admin/campaigns")({
  component: CampaignsPage,
});

type Campaign = {
  id: string;
  name: string;
  type: "seasonal" | "flash" | "bundle" | "category";
  discount_percent: number;
  start_date: string;
  end_date: string;
  product_ids: string[];
  is_active: boolean;
};

const CAMPAIGN_TYPES: Record<Campaign["type"], string> = {
  seasonal: "موسمية 🎉",
  flash: "فلاش سيل ⚡",
  bundle: "حزمة Bundle 📦",
  category: "تصنيف Category 🏷️",
};

const DEMO_CAMPAIGNS: Campaign[] = [
  {
    id: "1",
    name: "تخفيضات الصيف",
    type: "seasonal",
    discount_percent: 20,
    start_date: "2026-07-01",
    end_date: "2026-08-31",
    product_ids: [],
    is_active: true,
  },
  {
    id: "2",
    name: "فلاش سيل نهاية الأسبوع",
    type: "flash",
    discount_percent: 35,
    start_date: "2026-07-25",
    end_date: "2026-07-27",
    product_ids: [],
    is_active: false,
  },
];

const EMPTY_CAMPAIGN: Omit<Campaign, "id"> = {
  name: "",
  type: "seasonal",
  discount_percent: 10,
  start_date: "",
  end_date: "",
  product_ids: [],
  is_active: true,
};

function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>(DEMO_CAMPAIGNS);
  const [form, setForm] = useState<Omit<Campaign, "id"> | null>(null);
  const [editId, setEditId] = useState<string | null>(null);

  const { data: rawProducts = [] } = useQuery({
    queryKey: ["admin-products"],
    queryFn: () => listAdminProducts(),
  });
  const products = rawProducts as Array<{ id: string; name: string }>;

  const openNew = () => { setForm({ ...EMPTY_CAMPAIGN }); setEditId(null); };
  const openEdit = (c: Campaign) => { setForm({ ...c }); setEditId(c.id); };

  const save = () => {
    if (!form) return;
    if (!form.name.trim()) return toast.error("أدخل اسم الحملة");
    if (editId) {
      setCampaigns((cs) => cs.map((c) => (c.id === editId ? { ...form, id: editId } : c)));
      toast.success("تم تحديث الحملة");
    } else {
      setCampaigns((cs) => [...cs, { ...form, id: Date.now().toString() }]);
      toast.success("تمت إضافة الحملة");
    }
    setForm(null); setEditId(null);
  };

  const remove = (id: string) => { setCampaigns((cs) => cs.filter((c) => c.id !== id)); toast.success("تم حذف الحملة"); };
  const toggle = (id: string) => setCampaigns((cs) => cs.map((c) => (c.id === id ? { ...c, is_active: !c.is_active } : c)));

  const activeCampaigns = campaigns.filter((c) => c.is_active);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-primary" />
            الحملات التسويقية
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {activeCampaigns.length} حملة نشطة
          </p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition">
          <Plus className="h-4 w-4" /> حملة جديدة
        </button>
      </div>

      <div className="space-y-3">
        {campaigns.length === 0 ? (
          <div className="rounded-2xl border border-border bg-surface p-12 text-center text-muted-foreground">
            <Megaphone className="mx-auto h-8 w-8 mb-3 opacity-40" />
            <p className="text-sm">لا توجد حملات بعد</p>
          </div>
        ) : campaigns.map((c) => {
          const now = new Date();
          const start = c.start_date ? new Date(c.start_date) : null;
          const end = c.end_date ? new Date(c.end_date) : null;
          const isRunning = c.is_active && start && end && now >= start && now <= end;

          return (
            <div key={c.id} className={`rounded-2xl border p-4 transition ${isRunning ? "border-primary/30 bg-primary/5" : "border-border bg-surface"}`}>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold">{c.name}</span>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                      {CAMPAIGN_TYPES[c.type]}
                    </span>
                    {isRunning && (
                      <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-bold text-success animate-pulse">
                        • نشطة الآن
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Tag className="h-3 w-3" />
                      خصم {c.discount_percent}%
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {c.start_date || "—"} → {c.end_date || "—"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Package className="h-3 w-3" />
                      {c.product_ids.length === 0 ? "كل المنتجات" : `${c.product_ids.length} منتج`}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => openEdit(c)} className="rounded-lg p-1.5 hover:bg-accent transition"><Edit2 className="h-4 w-4" /></button>
                  <button onClick={() => remove(c.id)} className="rounded-lg p-1.5 text-destructive hover:bg-destructive/10 transition"><Trash2 className="h-4 w-4" /></button>
                  <button onClick={() => toggle(c.id)}>
                    {c.is_active ? <ToggleRight className="h-7 w-7 text-primary" /> : <ToggleLeft className="h-7 w-7 text-muted-foreground" />}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {form && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-base font-black">{editId ? "تعديل الحملة" : "حملة جديدة"}</h2>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">اسم الحملة</label>
              <input value={form.name} onChange={(e) => setForm((f) => f ? { ...f, name: e.target.value } : f)} placeholder="مثال: تخفيضات العيد" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">نوع الحملة</label>
                <select value={form.type} onChange={(e) => setForm((f) => f ? { ...f, type: e.target.value as Campaign["type"] } : f)} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
                  {Object.entries(CAMPAIGN_TYPES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">نسبة الخصم (%)</label>
                <input type="number" min={0} max={100} value={form.discount_percent} onChange={(e) => setForm((f) => f ? { ...f, discount_percent: Number(e.target.value) } : f)} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5"><Calendar className="inline h-3 w-3" /> تاريخ البداية</label>
                <input type="date" value={form.start_date} onChange={(e) => setForm((f) => f ? { ...f, start_date: e.target.value } : f)} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5"><Calendar className="inline h-3 w-3" /> تاريخ الانتهاء</label>
                <input type="date" value={form.end_date} onChange={(e) => setForm((f) => f ? { ...f, end_date: e.target.value } : f)} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                <Package className="inline h-3 w-3" /> المنتجات (اتركه فارغاً لتطبيق على الكل)
              </label>
              <div className="max-h-40 overflow-y-auto space-y-1 rounded-xl border border-border p-2">
                {products.slice(0, 50).map((p) => (
                  <label key={p.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-accent rounded-lg px-2 py-1">
                    <input
                      type="checkbox"
                      checked={form.product_ids.includes(p.id)}
                      onChange={(e) => setForm((f) => {
                        if (!f) return f;
                        const ids = e.target.checked
                          ? [...f.product_ids, p.id]
                          : f.product_ids.filter((id) => id !== p.id);
                        return { ...f, product_ids: ids };
                      })}
                      className="rounded"
                    />
                    <span className="truncate">{p.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={save} className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition">حفظ</button>
              <button onClick={() => { setForm(null); setEditId(null); }} className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold hover:bg-accent transition">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

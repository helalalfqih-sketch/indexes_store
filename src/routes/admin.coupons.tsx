import { createFileRoute } from "@tanstack/react-router";
import {
  Ticket,
  Plus,
  Trash2,
  Edit2,
  Loader2,
  ToggleLeft,
  ToggleRight,
  Calendar,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/coupons")({
  component: CouponsPage,
});

type Coupon = {
  id: string;
  code: string;
  type: "percent" | "fixed";
  value: number;
  min_order: number;
  max_uses: number;
  used_count: number;
  expires_at: string;
  is_active: boolean;
};

const DEMO_COUPONS: Coupon[] = [
  {
    id: "1",
    code: "WELCOME10",
    type: "percent",
    value: 10,
    min_order: 1000,
    max_uses: 100,
    used_count: 23,
    expires_at: "2026-12-31",
    is_active: true,
  },
  {
    id: "2",
    code: "SAVE500",
    type: "fixed",
    value: 500,
    min_order: 3000,
    max_uses: 50,
    used_count: 12,
    expires_at: "2026-09-30",
    is_active: true,
  },
];

const EMPTY: Omit<Coupon, "id" | "used_count"> = {
  code: "",
  type: "percent",
  value: 10,
  min_order: 0,
  max_uses: 0,
  expires_at: "",
  is_active: true,
};

function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>(DEMO_COUPONS);
  const [form, setForm] = useState<Omit<Coupon, "id" | "used_count"> | null>(null);
  const [editId, setEditId] = useState<string | null>(null);

  const openNew = () => {
    setForm({ ...EMPTY });
    setEditId(null);
  };

  const openEdit = (c: Coupon) => {
    setForm({ ...c });
    setEditId(c.id);
  };

  const save = () => {
    if (!form) return;
    if (!form.code.trim()) return toast.error("أدخل كود الكوبون");
    if (editId) {
      setCoupons((cs) =>
        cs.map((c) => (c.id === editId ? { ...c, ...form } : c)),
      );
      toast.success("تم تحديث الكوبون");
    } else {
      setCoupons((cs) => [...cs, { ...form, id: Date.now().toString(), used_count: 0 }]);
      toast.success("تم إضافة الكوبون");
    }
    setForm(null);
    setEditId(null);
  };

  const remove = (id: string) => {
    setCoupons((cs) => cs.filter((c) => c.id !== id));
    toast.success("تم حذف الكوبون");
  };

  const toggle = (id: string) =>
    setCoupons((cs) =>
      cs.map((c) => (c.id === id ? { ...c, is_active: !c.is_active } : c)),
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <Ticket className="h-6 w-6 text-primary" />
            إدارة الكوبونات
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {coupons.filter((c) => c.is_active).length} كوبون نشط من أصل {coupons.length}
          </p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition"
        >
          <Plus className="h-4 w-4" />
          كوبون جديد
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-surface overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-start font-bold text-muted-foreground">الكود</th>
              <th className="px-4 py-3 text-start font-bold text-muted-foreground">النوع</th>
              <th className="px-4 py-3 text-start font-bold text-muted-foreground">القيمة</th>
              <th className="px-4 py-3 text-start font-bold text-muted-foreground">الاستخدام</th>
              <th className="px-4 py-3 text-start font-bold text-muted-foreground">الانتهاء</th>
              <th className="px-4 py-3 text-start font-bold text-muted-foreground">الحالة</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {coupons.map((c) => (
              <tr key={c.id} className="border-b border-border/60 hover:bg-accent/30 transition">
                <td className="px-4 py-3 font-mono font-bold">{c.code}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {c.type === "percent" ? "نسبة مئوية" : "مبلغ ثابت"}
                </td>
                <td className="px-4 py-3 font-bold text-primary">
                  {c.type === "percent" ? `${c.value}%` : `${c.value} ر.ي`}
                </td>
                <td className="px-4 py-3">
                  {c.used_count} / {c.max_uses || "∞"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {c.expires_at || "بلا حد"}
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => toggle(c.id)}>
                    {c.is_active ? (
                      <ToggleRight className="h-6 w-6 text-primary" />
                    ) : (
                      <ToggleLeft className="h-6 w-6 text-muted-foreground" />
                    )}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEdit(c)}
                      className="rounded-lg p-1.5 hover:bg-accent transition"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => remove(c.id)}
                      className="rounded-lg p-1.5 text-destructive hover:bg-destructive/10 transition"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {form && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 space-y-4">
            <h2 className="text-base font-black">
              {editId ? "تعديل الكوبون" : "إضافة كوبون جديد"}
            </h2>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">كود الكوبون</label>
              <input
                value={form.code}
                onChange={(e) => setForm((f) => f ? { ...f, code: e.target.value.toUpperCase() } : f)}
                placeholder="مثال: SAVE20"
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">النوع</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm((f) => f ? { ...f, type: e.target.value as "percent" | "fixed" } : f)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="percent">نسبة مئوية (%)</option>
                  <option value="fixed">مبلغ ثابت (ر.ي)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  {form.type === "percent" ? "النسبة (%)" : "المبلغ"}
                </label>
                <input
                  type="number"
                  value={form.value}
                  onChange={(e) => setForm((f) => f ? { ...f, value: Number(e.target.value) } : f)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">الحد الأدنى للطلب</label>
                <input
                  type="number"
                  value={form.min_order}
                  onChange={(e) => setForm((f) => f ? { ...f, min_order: Number(e.target.value) } : f)}
                  placeholder="0 = بلا حد"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">حد الاستخدام</label>
                <input
                  type="number"
                  value={form.max_uses}
                  onChange={(e) => setForm((f) => f ? { ...f, max_uses: Number(e.target.value) } : f)}
                  placeholder="0 = بلا حد"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                <Calendar className="inline h-3 w-3" /> تاريخ الانتهاء
              </label>
              <input
                type="date"
                value={form.expires_at}
                onChange={(e) => setForm((f) => f ? { ...f, expires_at: e.target.value } : f)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={save}
                className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition"
              >
                حفظ
              </button>
              <button
                onClick={() => { setForm(null); setEditId(null); }}
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

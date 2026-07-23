import { createFileRoute } from "@tanstack/react-router";
import {
  Truck,
  Plus,
  Edit2,
  Trash2,
  MapPin,
  Clock,
  DollarSign,
  ToggleLeft,
  ToggleRight,
  Save,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAppearance } from "@/components/appearance-provider";

export const Route = createFileRoute("/admin/shipping")({
  component: ShippingPage,
});

type ShippingZone = {
  id: string;
  name: string;
  price: number;
  free_threshold: number;
  min_days: number;
  max_days: number;
  is_active: boolean;
};

const DEFAULT_ZONES: ShippingZone[] = [
  { id: "1", name: "أمانة العاصمة صنعاء", price: 500, free_threshold: 10000, min_days: 1, max_days: 2, is_active: true },
  { id: "2", name: "تعز", price: 1000, free_threshold: 15000, min_days: 2, max_days: 4, is_active: true },
  { id: "3", name: "عدن", price: 1000, free_threshold: 15000, min_days: 2, max_days: 4, is_active: true },
  { id: "4", name: "الحديدة", price: 1500, free_threshold: 20000, min_days: 3, max_days: 5, is_active: true },
  { id: "5", name: "حضرموت والمهرة", price: 2000, free_threshold: 25000, min_days: 4, max_days: 7, is_active: true },
  { id: "6", name: "مأرب وشبوة", price: 1500, free_threshold: 20000, min_days: 3, max_days: 6, is_active: false },
  { id: "7", name: "صعدة وحجة", price: 2000, free_threshold: 25000, min_days: 4, max_days: 7, is_active: false },
  { id: "8", name: "الجوف والمهرة والضالع وذمار والبيضاء وإب وريمة والمحويت والمدية", price: 1500, free_threshold: 20000, min_days: 3, max_days: 6, is_active: true },
];

type EditState = ShippingZone | null;
const EMPTY_ZONE: Omit<ShippingZone, "id"> = {
  name: "",
  price: 1000,
  free_threshold: 15000,
  min_days: 2,
  max_days: 5,
  is_active: true,
};

function ShippingPage() {
  const [zones, setZones] = useState<ShippingZone[]>(DEFAULT_ZONES);
  const [editing, setEditing] = useState<EditState>(null);
  const [editId, setEditId] = useState<string | null>(null);

  const openNew = () => {
    setEditing({ ...EMPTY_ZONE, id: "" });
    setEditId(null);
  };

  const openEdit = (z: ShippingZone) => {
    setEditing({ ...z });
    setEditId(z.id);
  };

  const save = () => {
    if (!editing) return;
    if (!editing.name.trim()) return toast.error("أدخل اسم المنطقة");
    if (editId) {
      setZones((zs) => zs.map((z) => (z.id === editId ? { ...editing, id: editId } : z)));
      toast.success("تم تحديث منطقة الشحن");
    } else {
      setZones((zs) => [...zs, { ...editing, id: Date.now().toString() }]);
      toast.success("تمت إضافة منطقة الشحن");
    }
    setEditing(null);
    setEditId(null);
  };

  const remove = (id: string) => {
    setZones((zs) => zs.filter((z) => z.id !== id));
    toast.success("تم حذف المنطقة");
  };

  const toggle = (id: string) =>
    setZones((zs) => zs.map((z) => (z.id === id ? { ...z, is_active: !z.is_active } : z)));

  const activeZones = zones.filter((z) => z.is_active);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <Truck className="h-6 w-6 text-primary" />
            مناطق الشحن والتوصيل
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {activeZones.length} منطقة نشطة من أصل {zones.length}
          </p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition"
        >
          <Plus className="h-4 w-4" />
          منطقة جديدة
        </button>
      </div>

      {/* Info Banner */}
      <div className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
        🚚 يتوفر التوصيل لجميع محافظات اليمن. السعر الأساسي هو رسوم التوصيل القياسية.
        الشحن المجاني يُفعَّل تلقائياً عند تجاوز الحد الأدنى للطلب.
      </div>

      {/* Zones Table */}
      <div className="rounded-2xl border border-border bg-surface overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-start font-bold text-muted-foreground">المنطقة</th>
              <th className="px-4 py-3 text-start font-bold text-muted-foreground">سعر الشحن</th>
              <th className="px-4 py-3 text-start font-bold text-muted-foreground">شحن مجاني من</th>
              <th className="px-4 py-3 text-start font-bold text-muted-foreground">المدة</th>
              <th className="px-4 py-3 text-start font-bold text-muted-foreground">الحالة</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {zones.map((z) => (
              <tr
                key={z.id}
                className={`border-b border-border/60 transition ${
                  z.is_active ? "hover:bg-accent/30" : "opacity-50 hover:bg-accent/20"
                }`}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="font-medium">{z.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 font-bold text-primary">{z.price.toLocaleString()} ر.ي</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {z.free_threshold.toLocaleString()} ر.ي
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {z.min_days}–{z.max_days} أيام
                  </div>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => toggle(z.id)}>
                    {z.is_active ? (
                      <ToggleRight className="h-6 w-6 text-primary" />
                    ) : (
                      <ToggleLeft className="h-6 w-6 text-muted-foreground" />
                    )}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEdit(z)}
                      className="rounded-lg p-1.5 hover:bg-accent transition"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => remove(z.id)}
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

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 space-y-4">
            <h2 className="text-base font-black">
              {editId ? "تعديل منطقة الشحن" : "إضافة منطقة جديدة"}
            </h2>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                <MapPin className="inline h-3 w-3" /> اسم المنطقة
              </label>
              <input
                value={editing.name}
                onChange={(e) => setEditing((s) => s ? { ...s, name: e.target.value } : s)}
                placeholder="مثال: صنعاء"
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  <DollarSign className="inline h-3 w-3" /> سعر الشحن (ر.ي)
                </label>
                <input
                  type="number"
                  value={editing.price}
                  onChange={(e) => setEditing((s) => s ? { ...s, price: Number(e.target.value) } : s)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  شحن مجاني من (ر.ي)
                </label>
                <input
                  type="number"
                  value={editing.free_threshold}
                  onChange={(e) => setEditing((s) => s ? { ...s, free_threshold: Number(e.target.value) } : s)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  <Clock className="inline h-3 w-3" /> أقل مدة (أيام)
                </label>
                <input
                  type="number"
                  value={editing.min_days}
                  onChange={(e) => setEditing((s) => s ? { ...s, min_days: Number(e.target.value) } : s)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  أقصى مدة (أيام)
                </label>
                <input
                  type="number"
                  value={editing.max_days}
                  onChange={(e) => setEditing((s) => s ? { ...s, max_days: Number(e.target.value) } : s)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={save}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition"
              >
                <Save className="h-4 w-4" /> حفظ
              </button>
              <button
                onClick={() => { setEditing(null); setEditId(null); }}
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

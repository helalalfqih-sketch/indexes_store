import { createFileRoute } from "@tanstack/react-router";
import {
  LayoutTemplate,
  Plus,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Link as LinkIcon,
  Image as ImageIcon,
  Save,
  Eye,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { MediaUploader } from "@/components/media-uploader";

export const Route = createFileRoute("/admin/banners")({
  component: BannersPage,
});

type Banner = {
  id: string;
  title: string;
  subtitle: string;
  image_url: string;
  cta_text: string;
  cta_url: string;
  is_active: boolean;
  sort_order: number;
};

const DEFAULT_BANNERS: Banner[] = [
  {
    id: "1",
    title: "خصومات نهاية الموسم",
    subtitle: "وفر حتى 40% على منتجات مختارة",
    image_url: "",
    cta_text: "تسوق الآن",
    cta_url: "/offers",
    is_active: true,
    sort_order: 0,
  },
  {
    id: "2",
    title: "منتجات جديدة أسبوعياً",
    subtitle: "اكتشف آخر الوافدين إلى متجرنا",
    image_url: "",
    cta_text: "استكشف",
    cta_url: "/search",
    is_active: true,
    sort_order: 1,
  },
];

const EMPTY_BANNER: Omit<Banner, "id"> = {
  title: "",
  subtitle: "",
  image_url: "",
  cta_text: "تسوق الآن",
  cta_url: "/",
  is_active: true,
  sort_order: 0,
};

function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>(DEFAULT_BANNERS);
  const [form, setForm] = useState<Omit<Banner, "id"> | null>(null);
  const [editId, setEditId] = useState<string | null>(null);

  const openNew = () => { setForm({ ...EMPTY_BANNER, sort_order: banners.length }); setEditId(null); };
  const openEdit = (b: Banner) => { setForm({ ...b }); setEditId(b.id); };

  const save = () => {
    if (!form) return;
    if (!form.title.trim()) return toast.error("أدخل عنوان البنر");
    if (editId) {
      setBanners((bs) => bs.map((b) => (b.id === editId ? { ...form, id: editId } : b)));
      toast.success("تم تحديث البنر");
    } else {
      setBanners((bs) => [...bs, { ...form, id: Date.now().toString() }]);
      toast.success("تمت إضافة البنر");
    }
    setForm(null); setEditId(null);
  };

  const remove = (id: string) => { setBanners((bs) => bs.filter((b) => b.id !== id)); toast.success("تم حذف البنر"); };
  const toggle = (id: string) => setBanners((bs) => bs.map((b) => (b.id === id ? { ...b, is_active: !b.is_active } : b)));

  const moveUp = (id: string) => {
    setBanners((bs) => {
      const idx = bs.findIndex((b) => b.id === id);
      if (idx === 0) return bs;
      const arr = [...bs];
      [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
      return arr.map((b, i) => ({ ...b, sort_order: i }));
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <LayoutTemplate className="h-6 w-6 text-primary" />
            إدارة البنرات
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {banners.filter((b) => b.is_active).length} بنر نشط
          </p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition">
          <Plus className="h-4 w-4" /> بنر جديد
        </button>
      </div>

      {/* Banners List */}
      <div className="space-y-3">
        {banners.map((b, idx) => (
          <div key={b.id} className={`rounded-2xl border p-4 transition ${b.is_active ? "border-primary/20 bg-surface" : "border-border bg-surface opacity-60"}`}>
            <div className="flex items-center gap-4">
              {/* Preview */}
              <div className="h-16 w-28 shrink-0 rounded-xl overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                {b.image_url ? (
                  <img src={b.image_url} alt={b.title} className="h-full w-full object-cover" />
                ) : (
                  <ImageIcon className="h-6 w-6 text-primary/40" />
                )}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="font-bold truncate">{b.title}</div>
                {b.subtitle && <div className="text-xs text-muted-foreground truncate">{b.subtitle}</div>}
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <LinkIcon className="h-3 w-3" />
                    {b.cta_text} → {b.cta_url}
                  </span>
                  <span className="rounded-full bg-muted px-2 py-0.5">#{idx + 1}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={() => openEdit(b)} className="rounded-lg p-1.5 hover:bg-accent transition"><Edit2 className="h-4 w-4" /></button>
                <button onClick={() => remove(b.id)} className="rounded-lg p-1.5 text-destructive hover:bg-destructive/10 transition"><Trash2 className="h-4 w-4" /></button>
                <button onClick={() => toggle(b.id)}>
                  {b.is_active ? <ToggleRight className="h-7 w-7 text-primary" /> : <ToggleLeft className="h-7 w-7 text-muted-foreground" />}
                </button>
              </div>
            </div>
          </div>
        ))}

        {banners.length === 0 && (
          <div className="rounded-2xl border border-border bg-surface p-12 text-center text-muted-foreground">
            <LayoutTemplate className="mx-auto h-8 w-8 mb-3 opacity-40" />
            <p className="text-sm">لا توجد بنرات بعد. أضف أول بنر للمتجر.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {form && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 space-y-4">
            <h2 className="text-base font-black">{editId ? "تعديل البنر" : "إضافة بنر جديد"}</h2>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">العنوان الرئيسي</label>
              <input value={form.title} onChange={(e) => setForm((f) => f ? { ...f, title: e.target.value } : f)} placeholder="مثال: خصومات العيد" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">العنوان الفرعي</label>
              <input value={form.subtitle} onChange={(e) => setForm((f) => f ? { ...f, subtitle: e.target.value } : f)} placeholder="وصف قصير..." className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
            <div>
              <MediaUploader
                label="صورة البنر"
                value={form.image_url}
                mediaType="image"
                onChange={(val) => setForm((f) => (f ? { ...f, image_url: val } : f))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">نص الزر</label>
                <input value={form.cta_text} onChange={(e) => setForm((f) => f ? { ...f, cta_text: e.target.value } : f)} placeholder="تسوق الآن" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  <LinkIcon className="inline h-3 w-3" /> الرابط
                </label>
                <input value={form.cta_url} onChange={(e) => setForm((f) => f ? { ...f, cta_url: e.target.value } : f)} placeholder="/offers" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={save} className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition"><Save className="h-4 w-4" /> حفظ</button>
              <button onClick={() => { setForm(null); setEditId(null); }} className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold hover:bg-accent transition">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

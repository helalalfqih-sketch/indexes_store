import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, Save, Eye, EyeOff, FolderTree, GripVertical, Upload, Image as ImageIcon, X } from "lucide-react";
import {
  listAdminCategories,
  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,
  listAdminProducts,
} from "@/lib/actions/admin.actions";
import { inferCategorySlug } from "@/lib/catalog.functions";
import { Reorder } from "framer-motion";

export const Route = createFileRoute("/admin/categories")({
  component: CategoriesPage,
});

type AdminCategory = Awaited<ReturnType<typeof listAdminCategories>>[number];
type AdminProduct = Awaited<ReturnType<typeof listAdminProducts>>[number];

type Draft = {
  slug: string;
  name: string;
  description: string;
  image_url: string;
  icon: string;
  color: string;
  parent_id: string;
  sort: number;
  is_active: boolean;
};

const emptyDraft: Draft = {
  slug: "",
  name: "",
  description: "",
  image_url: "",
  icon: "",
  color: "",
  parent_id: "",
  sort: 0,
  is_active: true,
};

function CategoriesPage() {
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Draft>(emptyDraft);

  const q = useQuery({
    queryKey: ["admin-categories"],
    queryFn: () => listAdminCategories(),
  });

  const productsQ = useQuery({
    queryKey: ["admin-products"],
    queryFn: () => listAdminProducts(),
  });

  const [categories, setCategories] = useState<AdminCategory[]>([]);

  useEffect(() => {
    if (q.data) {
      setCategories(q.data);
    }
  }, [q.data]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-categories"] });
  };

  const createMut = useMutation({
    mutationFn: () =>
      createAdminCategory({
        slug: draft.slug.trim(),
        name: draft.name.trim(),
        description: draft.description || null,
        image_url: draft.image_url || null,
        icon: draft.icon || null,
        color: draft.color || null,
        parent_id: draft.parent_id || null,
        sort: Number(draft.sort),
        is_active: draft.is_active,
      }),
    onSuccess: () => {
      toast.success("تم إضافة التصنيف");
      setCreating(false);
      setDraft(emptyDraft);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMut = useMutation({
    mutationFn: (id: string) =>
      updateAdminCategory({
        id,
        slug: editDraft.slug.trim(),
        name: editDraft.name.trim(),
        description: editDraft.description || null,
        image_url: editDraft.image_url || null,
        icon: editDraft.icon || null,
        color: editDraft.color || null,
        parent_id: editDraft.parent_id || null,
        sort: Number(editDraft.sort),
        is_active: editDraft.is_active,
      }),
    onSuccess: () => {
      toast.success("تم الحفظ");
      setEditingId(null);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleMut = useMutation({
    mutationFn: (v: { id: string; is_active: boolean }) =>
      updateAdminCategory({ id: v.id, is_active: v.is_active }),
    onSuccess: () => invalidate(),
    onError: (e: Error) => toast.error(e.message),
  });

  const saveOrderMut = useMutation({
    mutationFn: async (ordered: AdminCategory[]) => {
      for (let i = 0; i < ordered.length; i++) {
        const cat = ordered[i];
        if (cat.sort !== i) {
          await updateAdminCategory({ id: cat.id, sort: i });
        }
      }
    },
    onSuccess: () => {
      toast.success("تم حفظ الترتيب الجديد");
      invalidate();
    },
    onError: (e: Error) => toast.error(`تعذر حفظ الترتيب: ${e.message}`),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteAdminCategory(id),
    onSuccess: () => {
      toast.success("تم حذف التصنيف");
      invalidate();
    },
    onError: (e: Error) => toast.error(`تعذّر الحذف: ${e.message} (قد يحتوي التصنيف على منتجات)`),
  });

  const seedMut = useMutation({
    mutationFn: async () => {
      const defaultCats = [
        { name: "إلكترونيات", slug: "electronics", icon: "Smartphone", color: "purple" },
        { name: "الجمال والعناية", slug: "beauty-care", icon: "Sparkles", color: "pink" },
        { name: "المطبخ والأواني", slug: "kitchen", icon: "Utensils", color: "orange" },
        { name: "التنظيم والتخزين", slug: "storage-organization", icon: "Archive", color: "yellow" },
        { name: "الصحة والمساج", slug: "health-massage", icon: "Activity", color: "red" },
        { name: "الرياضة واللياقة", slug: "sports-fitness", icon: "Flame", color: "emerald" },
        { name: "السيارات والإكسسوارات", slug: "automotive", icon: "Car", color: "blue" },
        { name: "الأطفال والألعاب", slug: "kids-toys", icon: "Baby", color: "cyan" },
      ];
      for (let i = 0; i < defaultCats.length; i++) {
        const cat = defaultCats[i];
        try {
          await createAdminCategory({
            name: cat.name,
            slug: cat.slug,
            icon: cat.icon,
            color: cat.color,
            is_active: true,
            sort: i,
          });
        } catch {
          // ignore duplicates
        }
      }
    },
    onSuccess: () => {
      toast.success("تم إضافة التصنيفات الافتراضية بنجاح! 🚀");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const products: AdminProduct[] = productsQ.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black lg:text-4xl text-foreground">التصنيفات</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {q.isLoading ? "جارٍ التحميل..." : `${categories.length} تصنيف`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => seedMut.mutate()}
            disabled={seedMut.isPending}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-bold text-foreground shadow-card hover:bg-accent transition disabled:opacity-50"
          >
            {seedMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderTree className="h-4 w-4 text-primary" />}
            {seedMut.isPending ? "جاري الاستيراد..." : "استيراد تصنيفات افتراضية"}
          </button>
          <button
            onClick={() => {
              setCreating((v) => !v);
              setDraft(emptyDraft);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-brand hover:bg-primary/90 transition"
          >
            <Plus className="h-4 w-4" />
            تصنيف جديد
          </button>
        </div>
      </div>

      {creating && (
        <div className="rounded-2xl border border-border bg-surface p-5 space-y-3">
          <h2 className="text-sm font-black">إنشاء تصنيف</h2>
          <DraftForm draft={draft} setDraft={setDraft} categories={categories} />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setCreating(false)}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-bold"
            >
              إلغاء
            </button>
            <button
              onClick={() => createMut.mutate()}
              disabled={createMut.isPending || !draft.name || !draft.slug}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground disabled:opacity-60 transition hover:bg-primary/90"
            >
              {createMut.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              حفظ
            </button>
          </div>
        </div>
      )}

      {q.isError ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-8 text-center text-destructive">
          <p className="text-sm">{(q.error as Error).message}</p>
        </div>
      ) : q.isLoading ? (
        <div className="rounded-2xl border border-border bg-surface p-12 text-center">
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
        </div>
      ) : categories.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface p-12 text-center space-y-4">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-primary/10">
            <FolderTree className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h3 className="text-base font-black">لا توجد تصنيفات في قاعدة البيانات</h3>
            <p className="mt-1 text-sm text-muted-foreground">يمكنك إضافة تصنيف جديد يدوياً أو زرع التشكيلة الافتراضية بنقرة واحدة.</p>
          </div>
          <button
            onClick={() => seedMut.mutate()}
            disabled={seedMut.isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-brand hover:bg-primary/90 transition disabled:opacity-50"
          >
            {seedMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderTree className="h-4 w-4" />}
            {seedMut.isPending ? "جاري إنشاء التصنيفات..." : "إضافة التصنيفات الافتراضية تلقائياً 🚀"}
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
          <table className="min-w-[720px] w-full text-sm">
            <thead className="text-xs text-muted-foreground border-b border-border">
              <tr>
                <th className="w-8"></th>
                <th className="text-start p-3">الاسم</th>
                <th className="text-start p-3">Slug</th>
                <th className="text-start p-3">الأب</th>
                <th className="text-start p-3">الحالة</th>
                <th className="text-end p-3">إجراءات</th>
              </tr>
            </thead>
            <Reorder.Group
              values={categories}
              onReorder={(newOrder) => {
                setCategories(newOrder);
                saveOrderMut.mutate(newOrder);
              }}
              as="tbody"
            >
              {categories.map((c) => {
                const editing = editingId === c.id;
                const productCount = products.filter((product) => {
                  if (product.category_id === c.id || product.category_id === c.slug) return true;
                  if (!product.category_id) {
                    return inferCategorySlug(product.name, product.tags, product.description) === c.slug;
                  }
                  return false;
                }).length;
                return editing ? (
                  <tr key={c.id} className="border-b border-border/40 align-top bg-surface/30">
                    <td colSpan={6} className="p-4">
                      <DraftForm
                        draft={editDraft}
                        setDraft={setEditDraft}
                        categories={categories.filter((k) => k.id !== c.id)}
                      />
                      <div className="flex justify-end gap-2 mt-3">
                        <button
                          onClick={() => setEditingId(null)}
                          className="rounded-lg border border-border px-3 py-1.5 text-xs font-bold"
                        >
                          إلغاء
                        </button>
                        <button
                          onClick={() => updateMut.mutate(c.id)}
                          disabled={updateMut.isPending}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition"
                        >
                          {updateMut.isPending ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Save className="h-3.5 w-3.5" />
                          )}
                          حفظ
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <Reorder.Item
                    key={c.id}
                    value={c}
                    as="tr"
                    className="border-b border-border/40 align-middle bg-card hover:bg-muted/10 transition"
                  >
                    <td className="p-3 text-center align-middle">
                      <GripVertical className="h-3.5 w-3.5 text-muted-foreground/60 cursor-grab active:cursor-grabbing" />
                    </td>
                    <td className="p-3 font-bold align-middle">
                      <div className="flex items-center gap-2">
                        {c.image_url && (
                          <img
                            src={c.image_url}
                            alt=""
                            className="h-7 w-7 rounded-lg object-cover border border-border"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        )}
                        <div>
                          <span>{c.name}</span>
                          <span className="block text-[10px] font-normal text-muted-foreground">
                            {productCount} منتج
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 font-mono text-xs text-muted-foreground align-middle">
                      {c.slug}
                    </td>
                    <td className="p-3 text-xs align-middle">
                      {categories.find((k) => k.id === c.parent_id)?.name ?? "—"}
                    </td>
                    <td className="p-3 align-middle">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${c.is_active ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"}`}
                      >
                        {c.is_active ? "مفعّل" : "معطّل"}
                      </span>
                    </td>
                    <td className="p-3 align-middle">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => toggleMut.mutate({ id: c.id, is_active: !c.is_active })}
                          className="grid h-7 w-7 place-items-center rounded-lg hover:bg-accent"
                          title={c.is_active ? "تعطيل" : "تفعيل"}
                        >
                          {c.is_active ? (
                            <EyeOff className="h-3.5 w-3.5" />
                          ) : (
                            <Eye className="h-3.5 w-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setEditingId(c.id);
                            setEditDraft({
                              slug: c.slug,
                              name: c.name,
                              description: c.description ?? "",
                              image_url: c.image_url ?? "",
                              icon: c.icon ?? "",
                              color: c.color ?? "",
                              parent_id: c.parent_id ?? "",
                              sort: c.sort ?? 0,
                              is_active: c.is_active,
                            });
                          }}
                          className="rounded-lg px-2 py-1 text-xs font-bold hover:bg-accent"
                        >
                          تعديل
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`حذف "${c.name}"؟`)) deleteMut.mutate(c.id);
                          }}
                          className="grid h-7 w-7 place-items-center rounded-lg text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </Reorder.Item>
                );
              })}
            </Reorder.Group>
          </table>
        </div>
      )}
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary";

function DraftForm({
  draft,
  setDraft,
  categories,
}: {
  draft: Draft;
  setDraft: (d: Draft) => void;
  categories: Array<{ id: string; name: string }>;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="block">
        <span className="text-xs font-bold text-muted-foreground">الاسم</span>
        <input
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          className={`${inputCls} mt-1`}
        />
      </label>
      <label className="block">
        <span className="text-xs font-bold text-muted-foreground">Slug</span>
        <input
          value={draft.slug}
          onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
          className={`${inputCls} mt-1 font-mono`}
        />
      </label>
      {/* Category Image Picker */}
      <div className="sm:col-span-2">
        <CategoryImagePicker
          imageUrl={draft.image_url}
          onChange={(url) => setDraft({ ...draft, image_url: url })}
        />
      </div>

      <label className="block sm:col-span-2">
        <span className="text-xs font-bold text-muted-foreground">الوصف</span>
        <input
          value={draft.description}
          onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          className={`${inputCls} mt-1`}
        />
      </label>
      <label className="block">
        <span className="text-xs font-bold text-muted-foreground">الأب</span>
        <select
          value={draft.parent_id}
          onChange={(e) => setDraft({ ...draft, parent_id: e.target.value })}
          className={`${inputCls} mt-1`}
        >
          <option value="">— لا يوجد —</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="text-xs font-bold text-muted-foreground">ترتيب العرض</span>
        <input
          type="number"
          value={draft.sort}
          onChange={(e) => setDraft({ ...draft, sort: Number(e.target.value) })}
          className={`${inputCls} mt-1`}
        />
      </label>
      <label className="block">
        <span className="text-xs font-bold text-muted-foreground">أيقونة</span>
        <input
          value={draft.icon}
          onChange={(e) => setDraft({ ...draft, icon: e.target.value })}
          className={`${inputCls} mt-1`}
        />
      </label>
      <label className="block">
        <span className="text-xs font-bold text-muted-foreground">لون</span>
        <input
          value={draft.color}
          onChange={(e) => setDraft({ ...draft, color: e.target.value })}
          className={`${inputCls} mt-1`}
        />
      </label>
      <label className="flex items-center gap-2 sm:col-span-2 rounded-xl bg-surface p-3">
        <input
          type="checkbox"
          checked={draft.is_active}
          onChange={(e) => setDraft({ ...draft, is_active: e.target.checked })}
          className="h-4 w-4"
        />
        <span className="text-sm font-bold">مفعّل</span>
      </label>
    </div>
  );
}

// Preset Category High-Quality Sample Images
const PRESET_CATEGORY_IMAGES = [
  { label: "إلكترونيات", url: "https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=600&q=80" },
  { label: "تجميل وعناية", url: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80" },
  { label: "أواني ومطبخ", url: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80" },
  { label: "تنظيم وتخزين", url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80" },
  { label: "صحة ومساج", url: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=600&q=80" },
  { label: "رياضة ولياقة", url: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80" },
  { label: "سيارات", url: "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=600&q=80" },
  { label: "أطفال وألعاب", url: "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&w=600&q=80" },
];

function CategoryImagePicker({
  imageUrl,
  onChange,
}: {
  imageUrl: string;
  onChange: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("الرجاء اختيار ملف صورة صالح (PNG, JPG, WebP)");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      toast.error("حجم الصورة يجب أن لا يتجاوز 8 ميجابايت");
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        onChange(result);
        toast.success("تم اختيار الصورة من الهاتف بنجاح 📱✨");
      }
      setUploading(false);
    };
    reader.onerror = () => {
      toast.error("حدث خطأ أثناء قراءة الملف من الهاتف");
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-3 rounded-xl border border-border bg-background/50 p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
          <ImageIcon className="h-4 w-4 text-primary" />
          صورة التصنيف
        </span>
        {imageUrl && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="flex items-center gap-1 text-[11px] font-bold text-destructive hover:underline"
          >
            <X className="h-3.5 w-3.5" />
            إزالة الصورة
          </button>
        )}
      </div>

      {/* Main Upload Dropzone / Button */}
      <div className="flex flex-col gap-3">
        {imageUrl ? (
          <div className="relative group w-full flex items-center gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-3">
            <img
              src={imageUrl}
              alt="معاينة الفئة"
              className="h-20 w-20 rounded-xl object-cover border-2 border-primary/30 shadow-md shrink-0"
            />
            <div className="flex-1 min-w-0">
              <span className="text-xs font-bold text-success flex items-center gap-1">
                ✓ تم اختيار الصورة من الهاتف
              </span>
              <p className="text-[11px] text-muted-foreground mt-0.5">جاهزة للحفظ مع بيانات التصنيف</p>
              <label className="inline-flex items-center gap-1.5 mt-2 text-xs font-bold text-primary hover:underline cursor-pointer">
                <Upload className="h-3.5 w-3.5" />
                تغيير الصورة من الهاتف
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
            <button
              type="button"
              onClick={() => onChange("")}
              className="p-2 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 transition shrink-0"
              title="حذف"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center gap-2.5 rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 p-6 text-center hover:bg-primary/10 hover:border-primary cursor-pointer transition">
            {uploading ? (
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            ) : (
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary text-white shadow-brand">
                <Upload className="h-6 w-6" />
              </div>
            )}
            <div>
              <span className="text-sm font-black text-foreground block">
                {uploading ? "جاري قراءة الصورة..." : "اضغط هنا لاختيار صورة من الهاتف 📱"}
              </span>
              <span className="text-xs text-muted-foreground block mt-0.5">
                يمكنك اختيار صورة من المعرض أو التقاط صورة مباشرة من الكاميرا
              </span>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        )}
      </div>

      {/* Preset Gallery */}
      <div className="pt-2 border-t border-border/60">
        <span className="text-[11px] font-bold text-muted-foreground block mb-2">
          أو اختر صورة جاهزة عالية الجودة بنقرة واحدة:
        </span>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          {PRESET_CATEGORY_IMAGES.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onChange(preset.url)}
              className={`group relative aspect-square rounded-xl overflow-hidden border-2 transition ${
                imageUrl === preset.url
                  ? "border-primary ring-2 ring-primary/30 scale-105"
                  : "border-border hover:border-primary/50"
              }`}
              title={preset.label}
            >
              <img
                src={preset.url}
                alt={preset.label}
                className="h-full w-full object-cover group-hover:scale-110 transition"
              />
              <span className="absolute inset-x-0 bottom-0 bg-black/60 py-0.5 text-[9px] font-bold text-white text-center truncate px-0.5">
                {preset.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

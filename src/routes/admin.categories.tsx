import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, Save, Eye, EyeOff, FolderTree, GripVertical } from "lucide-react";
import {
  listAdminCategories,
  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,
  listAdminProducts,
} from "@/lib/actions/admin.actions";
import { Reorder } from "framer-motion";

export const Route = createFileRoute("/admin/categories")({
  component: CategoriesPage,
});

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

  const [categories, setCategories] = useState<any[]>([]);

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
    mutationFn: async (ordered: any[]) => {
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

  const products = productsQ.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black lg:text-4xl">
            <span className="neon-text">التصنيفات</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {q.isLoading ? "جارٍ التحميل..." : `${categories.length} تصنيف`}
          </p>
        </div>
        <button
          onClick={() => {
            setCreating((v) => !v);
            setDraft(emptyDraft);
          }}
          className="inline-flex items-center gap-2 rounded-xl gradient-brand px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-brand"
        >
          <Plus className="h-4 w-4" />
          تصنيف جديد
        </button>
      </div>

      {creating && (
        <div className="rounded-2xl glass p-5 space-y-3">
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
              className="inline-flex items-center gap-1.5 rounded-lg gradient-brand px-3 py-1.5 text-xs font-bold text-primary-foreground disabled:opacity-60"
            >
              {createMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              حفظ
            </button>
          </div>
        </div>
      )}

      {q.isError ? (
        <div className="rounded-2xl glass p-8 text-center text-destructive">
          <p className="text-sm">{(q.error as Error).message}</p>
        </div>
      ) : q.isLoading ? (
        <div className="rounded-2xl glass p-12 text-center">
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
        </div>
      ) : categories.length === 0 ? (
        <div className="rounded-2xl glass p-12 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-primary/10">
            <FolderTree className="h-7 w-7 text-primary" />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">لا توجد تصنيفات</p>
        </div>
      ) : (
        <div className="rounded-2xl glass overflow-hidden">
          <table className="w-full text-sm">
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
                const productCount = products.filter((p: any) => p.category_id === c.id).length;
                return editing ? (
                  <tr key={c.id} className="border-b border-border/40 align-top bg-surface/30">
                    <td colSpan={6} className="p-4">
                      <DraftForm draft={editDraft} setDraft={setEditDraft} categories={categories.filter((k) => k.id !== c.id)} />
                      <div className="flex justify-end gap-2 mt-3">
                        <button onClick={() => setEditingId(null)} className="rounded-lg border border-border px-3 py-1.5 text-xs font-bold">إلغاء</button>
                        <button
                          onClick={() => updateMut.mutate(c.id)}
                          disabled={updateMut.isPending}
                          className="inline-flex items-center gap-1.5 rounded-lg gradient-brand px-3 py-1.5 text-xs font-bold text-primary-foreground"
                        >
                          {updateMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
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
                            onError={(e) => { e.currentTarget.style.display = "none"; }}
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
                    <td className="p-3 font-mono text-xs text-muted-foreground align-middle">{c.slug}</td>
                    <td className="p-3 text-xs align-middle">{categories.find((k) => k.id === c.parent_id)?.name ?? "—"}</td>
                    <td className="p-3 align-middle">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${c.is_active ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"}`}>
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
                          {c.is_active ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
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

const inputCls = "w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary";

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
        <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className={`${inputCls} mt-1`} />
      </label>
      <label className="block">
        <span className="text-xs font-bold text-muted-foreground">Slug</span>
        <input value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} className={`${inputCls} mt-1 font-mono`} />
      </label>
      <label className="block sm:col-span-2">
        <span className="text-xs font-bold text-muted-foreground">رابط صورة الفئة (Image URL)</span>
        <input value={draft.image_url} onChange={(e) => setDraft({ ...draft, image_url: e.target.value })} className={`${inputCls} mt-1`} placeholder="https://example.com/image.jpg" />
      </label>
      <label className="block sm:col-span-2">
        <span className="text-xs font-bold text-muted-foreground">الوصف</span>
        <input value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} className={`${inputCls} mt-1`} />
      </label>
      <label className="block">
        <span className="text-xs font-bold text-muted-foreground">الأب</span>
        <select value={draft.parent_id} onChange={(e) => setDraft({ ...draft, parent_id: e.target.value })} className={`${inputCls} mt-1`}>
          <option value="">— لا يوجد —</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="text-xs font-bold text-muted-foreground">ترتيب العرض</span>
        <input type="number" value={draft.sort} onChange={(e) => setDraft({ ...draft, sort: Number(e.target.value) })} className={`${inputCls} mt-1`} />
      </label>
      <label className="block">
        <span className="text-xs font-bold text-muted-foreground">أيقونة</span>
        <input value={draft.icon} onChange={(e) => setDraft({ ...draft, icon: e.target.value })} className={`${inputCls} mt-1`} />
      </label>
      <label className="block">
        <span className="text-xs font-bold text-muted-foreground">لون</span>
        <input value={draft.color} onChange={(e) => setDraft({ ...draft, color: e.target.value })} className={`${inputCls} mt-1`} />
      </label>
      <label className="flex items-center gap-2 sm:col-span-2 rounded-xl bg-surface p-3">
        <input type="checkbox" checked={draft.is_active} onChange={(e) => setDraft({ ...draft, is_active: e.target.checked })} className="h-4 w-4" />
        <span className="text-sm font-bold">مفعّل</span>
      </label>
    </div>
  );
}

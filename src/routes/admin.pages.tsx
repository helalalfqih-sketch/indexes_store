import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  BookOpen,
  Plus,
  Search,
  FileEdit,
  Trash2,
  Globe,
  EyeOff,
  History,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  RotateCcw,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { MediaUploader } from "@/components/media-uploader";
import {
  listCmsPages,
  saveCmsPage,
  deleteCmsPage,
  seedDefaultPages,
  getPageVersions,
  restorePageVersion,
  slugify,
  RESERVED_SLUGS,
  type CmsPageRecord,
} from "@/lib/pages.functions";

export const Route = createFileRoute("/admin/pages")({
  head: () => ({
    meta: [
      { title: "إدارة الصفحات — لوحة الإدارة" },
      { name: "description", content: "إدارة صفحات المتجر والصفحات التعريفية وسياسات الاستخدام." },
    ],
  }),
  component: AdminPagesComponent,
});

function AdminPagesComponent() {
  const queryClient = useQueryClient();
  const fetchPages = useServerFn(listCmsPages);
  const savePageFn = useServerFn(saveCmsPage);
  const deletePageFn = useServerFn(deleteCmsPage);
  const seedPagesFn = useServerFn(seedDefaultPages);
  const fetchVersionsFn = useServerFn(getPageVersions);
  const restoreVersionFn = useServerFn(restorePageVersion);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "published" | "draft">("all");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<Partial<CmsPageRecord> | null>(null);

  // Version history modal state
  const [versionModalPageId, setVersionModalPageId] = useState<string | null>(null);

  // Queries
  const { data: pages = [], isLoading } = useQuery({
    queryKey: ["cms-pages"],
    queryFn: () => fetchPages(),
  });

  const { data: pageVersions = [], isLoading: isLoadingVersions } = useQuery({
    queryKey: ["cms-page-versions", versionModalPageId],
    queryFn: () => fetchVersionsFn({ data: { pageId: versionModalPageId! } }),
    enabled: !!versionModalPageId,
  });

  // Seed default pages on initial load if pages list is empty
  useEffect(() => {
    if (!isLoading && pages.length === 0) {
      seedPagesFn().then(() => {
        queryClient.invalidateQueries({ queryKey: ["cms-pages"] });
      });
    }
  }, [isLoading, pages.length, seedPagesFn, queryClient]);

  // Save Mutation
  const saveMutation = useMutation({
    mutationFn: (data: Parameters<typeof savePageFn>[0]["data"]) => savePageFn({ data }),
    onSuccess: () => {
      toast.success("تم حفظ الصفحة بنجاح ✨");
      queryClient.invalidateQueries({ queryKey: ["cms-pages"] });
      setIsEditorOpen(false);
      setEditingPage(null);
    },
    onError: (err: Error) => {
      toast.error(err.message || "حدث خطأ أثناء حفظ الصفحة");
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deletePageFn({ data: { id } }),
    onSuccess: () => {
      toast.success("تم حذف الصفحة بنجاح");
      queryClient.invalidateQueries({ queryKey: ["cms-pages"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "فشل حذف الصفحة");
    },
  });

  // Restore Version Mutation
  const restoreMutation = useMutation({
    mutationFn: ({ versionId, pageId }: { versionId: string; pageId: string }) =>
      restoreVersionFn({ data: { versionId, pageId } }),
    onSuccess: () => {
      toast.success("تمت استعادة النسخة السابقة بنجاح!");
      queryClient.invalidateQueries({ queryKey: ["cms-pages"] });
      setVersionModalPageId(null);
    },
    onError: (err: Error) => {
      toast.error(err.message || "فشلت استعادة النسخة");
    },
  });

  // Filtered pages
  const filteredPages = pages.filter((page) => {
    const matchesSearch =
      page.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      page.slug.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "published" && page.is_published) ||
      (filterStatus === "draft" && !page.is_published);
    return matchesSearch && matchesStatus;
  });

  const openNewPageModal = () => {
    setEditingPage({
      title: "",
      slug: "",
      content: "",
      is_published: true,
      meta_title: "",
      meta_description: "",
    });
    setIsEditorOpen(true);
  };

  const openEditModal = (page: CmsPageRecord) => {
    setEditingPage(page);
    setIsEditorOpen(true);
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <BookOpen className="h-7 w-7 text-primary" />
            إدارة الصفحات المحتوى (Pages CMS)
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            قم بإنشاء وتعديل الصفحات التعريفية، السياسات، والصفحات المخصصة وإدارتها في متجرك.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={openNewPageModal}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition hover:bg-primary/90 shadow-brand"
          >
            <Plus className="h-4 w-4" />
            صفحة جديدة
          </button>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-surface border border-border p-4 rounded-2xl shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="ابحث بالاسم أو الرابط..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-border bg-background ps-9 pe-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="flex items-center gap-2">
          {(["all", "published", "draft"] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                filterStatus === st
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              {st === "all" ? "الكل" : st === "published" ? "المنشورة" : "المسودات"}
            </button>
          ))}
        </div>
      </div>

      {/* Pages Grid / Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredPages.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center bg-surface">
          <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-3 text-lg font-bold">لا توجد صفحات للعرض</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            لم يتم العثور على أي صفحة تنطبق عليها شروط البحث.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPages.map((page) => (
            <div
              key={page.id}
              className="group relative flex flex-col justify-between rounded-2xl border border-border bg-surface p-5 transition hover:border-primary/50 shadow-sm"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                      page.is_published
                        ? "bg-success/10 text-success"
                        : "bg-warning/10 text-warning"
                    }`}
                  >
                    {page.is_published ? (
                      <>
                        <Globe className="h-3 w-3" /> منشورة
                      </>
                    ) : (
                      <>
                        <EyeOff className="h-3 w-3" /> مسودة
                      </>
                    )}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setVersionModalPageId(page.id)}
                      title="سجل التعديلات"
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                    >
                      <History className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => openEditModal(page)}
                      title="تعديل"
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-primary"
                    >
                      <FileEdit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`هل أنت تأكد من حذف صفحة "${page.title}"؟`)) {
                          deleteMutation.mutate(page.id);
                        }
                      }}
                      title="حذف"
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <h3 className="mt-3 text-base font-bold tracking-tight text-foreground">
                  {page.title}
                </h3>
                <p className="mt-1 font-mono text-xs text-primary/80 truncate" dir="ltr">
                  /pages/{page.slug}
                </p>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-border/50 pt-3 text-xs text-muted-foreground">
                <span>تحديث: {new Date(page.updated_at).toLocaleDateString("ar-YE")}</span>
                <a
                  href={`/pages/${page.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 font-bold text-primary hover:underline"
                >
                  معاينة <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Page Edit / Create Modal */}
      {isEditorOpen && editingPage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-showcase/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-3xl rounded-3xl bg-surface border border-border p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-border/60 pb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                {editingPage.id ? "تعديل صفحة CMS" : "إنشاء صفحة CMS جديدة"}
              </h2>
              <button
                onClick={() => setIsEditorOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-accent"
              >
                ✕
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold mb-1">عنوان الصفحة</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: سياسة الشحن والتوصيل"
                  value={editingPage.title || ""}
                  onChange={(e) => {
                    const title = e.target.value;
                    const autoSlug = editingPage.id ? editingPage.slug : slugify(title);
                    setEditingPage({ ...editingPage, title, slug: autoSlug });
                  }}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">الرابط المخصص (Slug)</label>
                <input
                  type="text"
                  required
                  placeholder="shipping-policy"
                  value={editingPage.slug || ""}
                  onChange={(e) => setEditingPage({ ...editingPage, slug: slugify(e.target.value) })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20"
                  dir="ltr"
                />
                {editingPage.slug && RESERVED_SLUGS.has(editingPage.slug) && (
                  <p className="mt-1 text-[11px] font-bold text-destructive">
                    ⚠️ هذا الرابط محجوز في النظام ولا يمكن استخدامه.
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">محتوى الصفحة (HTML / Rich Text)</label>
              <textarea
                rows={10}
                placeholder="أدخل محتوى الصفحة هنا..."
                value={editingPage.content || ""}
                onChange={(e) => setEditingPage({ ...editingPage, content: e.target.value })}
                className="w-full rounded-xl border border-border bg-background p-3 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                * يتم تنظيف الفيديوهات وسكربتات XSS الخبيثة تلقائياً لضمان أعلى مستويات الأمان.
              </p>
            </div>

            {/* SEO Section */}
            <div className="rounded-2xl border border-border/80 bg-background/50 p-4 space-y-3">
              <h3 className="text-xs font-bold text-primary flex items-center gap-1.5">
                <Sparkles className="h-4 w-4" /> إعدادات SEO المخصصة لهذه الصفحة
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-[11px] font-semibold mb-1">عنوان Meta Title</label>
                  <input
                    type="text"
                    placeholder="عنوان محرك البحث..."
                    value={editingPage.meta_title || ""}
                    onChange={(e) => setEditingPage({ ...editingPage, meta_title: e.target.value })}
                    className="w-full rounded-xl border border-border bg-surface px-3 py-1.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold mb-1">وصف Meta Description</label>
                  <input
                    type="text"
                    placeholder="وصف مختصر لمحل محركات البحث..."
                    value={editingPage.meta_description || ""}
                    onChange={(e) => setEditingPage({ ...editingPage, meta_description: e.target.value })}
                    className="w-full rounded-xl border border-border bg-surface px-3 py-1.5 text-xs"
                  />
                </div>
              </div>

              <div>
                <MediaUploader
                  label="صورة المشاركة لهذه الصفحة (OG Image)"
                  value={editingPage.og_image || ""}
                  mediaType="image"
                  onChange={(url) => setEditingPage({ ...editingPage, og_image: url })}
                />
              </div>
            </div>

            {/* Status Toggle */}
            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-sm font-bold">
                <input
                  type="checkbox"
                  checked={editingPage.is_published ?? true}
                  onChange={(e) => setEditingPage({ ...editingPage, is_published: e.target.checked })}
                  className="h-4 w-4 rounded accent-primary"
                />
                نشر الصفحة وإتاحتها للعملاء في المتجر
              </label>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="rounded-xl border border-border px-4 py-2 text-xs font-bold hover:bg-accent"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  disabled={saveMutation.isPending || (!!editingPage.slug && RESERVED_SLUGS.has(editingPage.slug))}
                  onClick={() => {
                    if (!editingPage.title || !editingPage.slug) {
                      toast.error("يرجى ملء العنوان والرابط الخاص بالصفحة.");
                      return;
                    }
                    saveMutation.mutate({
                      id: editingPage.id,
                      title: editingPage.title,
                      slug: editingPage.slug,
                      content: editingPage.content || "",
                      is_published: editingPage.is_published ?? true,
                      meta_title: editingPage.meta_title || undefined,
                      meta_description: editingPage.meta_description || undefined,
                    });
                  }}
                  className="rounded-xl bg-primary px-5 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {saveMutation.isPending ? "جارٍ الحفظ..." : "حفظ التغييرات"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Version History Modal */}
      {versionModalPageId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-showcase/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-3xl bg-surface border border-border p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h3 className="text-base font-bold flex items-center gap-2">
                <History className="h-5 w-5 text-primary" /> سجل مراجعات الصفحة (Revision History)
              </h3>
              <button
                onClick={() => setVersionModalPageId(null)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-accent"
              >
                ✕
              </button>
            </div>

            {isLoadingVersions ? (
              <div className="py-8 text-center">
                <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
              </div>
            ) : pageVersions.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">
                لا توجد نسخ سابقة محفوظة لهذه الصفحة بعد.
              </p>
            ) : (
              <div className="max-h-80 overflow-y-auto divide-y divide-border/60 pe-1">
                {pageVersions.map((ver) => (
                  <div key={ver.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <p className="font-bold">{ver.title_snapshot}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {new Date(ver.created_at).toLocaleString("ar-YE")} — {ver.editor_email || "مدير النظام"}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm("هل تريد استعادة هذه النسخة السابقة من الصفحة؟")) {
                          restoreMutation.mutate({ versionId: ver.id, pageId: versionModalPageId });
                        }
                      }}
                      className="flex items-center gap-1 rounded-lg bg-accent px-3 py-1.5 font-bold hover:bg-accent/80 text-primary"
                    >
                      <RotateCcw className="h-3.5 w-3.5" /> استعادة
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

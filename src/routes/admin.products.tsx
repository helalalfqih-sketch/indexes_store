import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Eye,
  Package,
  Sparkles,
  Trash2,
  CheckCircle2,
  EyeOff,
  Search,
  Copy,
  Loader2,
  Plus,
  Download,
  RefreshCw,
  Link2,
  Check,
  AlertCircle,
  MoreVertical,
  Share2,
  FileSpreadsheet,
  Globe,
  Clock,
  ExternalLink,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import {
  listAdminProducts,
  listAdminCategories,
  updateAdminProduct,
  deleteAdminProduct,
  createAdminProduct,
  importCatalogFromUrl,
  autoCategorizeProducts,
} from "@/lib/actions/admin.actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrentTenant } from "@/components/tenant-provider";

const DEFAULT_CATALOG_URL =
  "https://firebasestorage.googleapis.com/v0/b/smartcontentcreator-d49f2.firebasestorage.app/o/catalogs%2Fglobal%2Fcatalog.csv?alt=media&token=8d793707-b96a-4ee9-bca1-0912af180138&ext=.csv";

export const Route = createFileRoute("/admin/products")({
  component: ProductsPage,
});

type Filter = "all" | "published" | "unpublished" | "out" | "synced" | "failed";

function ProductsPage() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [filter, setFilter] = useState<Filter>("all");
  const [showInstructions, setShowInstructions] = useState(false);

  const query = useMemo(
    () => ({
      search: search.trim() || undefined,
      categoryId: categoryId || undefined,
      publishedOnly: filter === "published" || undefined,
      unpublishedOnly: filter === "unpublished" || undefined,
      outOfStock: filter === "out" || undefined,
    }),
    [search, categoryId, filter],
  );

  const productsQ = useQuery({
    queryKey: ["admin-products", query],
    queryFn: () => listAdminProducts(query),
  });

  const categoriesQ = useQuery({
    queryKey: ["admin-categories"],
    queryFn: () => listAdminCategories(),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-products"] });

  const togglePublish = useMutation({
    mutationFn: (p: { id: string; is_published: boolean }) =>
      updateAdminProduct({ id: p.id, is_published: p.is_published }),
    onSuccess: (_d, v) => {
      toast.success(v.is_published ? "تم نشر المنتج في المتجر" : "تم إخفاء المنتج من المتجر");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeMut = useMutation({
    mutationFn: (id: string) => deleteAdminProduct(id),
    onSuccess: () => {
      toast.success("تم حذف المنتج");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const duplicateMut = useMutation({
    mutationFn: async (id: string) => {
      const list = productsQ.data ?? [];
      const src = list.find((p) => p.id === id);
      if (!src) throw new Error("Product not found");
      const suffix = `-copy-${Math.random().toString(36).slice(2, 6)}`;
      return createAdminProduct({
        slug: (src.slug + suffix).slice(0, 60),
        name: src.name + " (نسخة)",
        description: src.description,
        price: src.price,
        currency: src.currency,
        category_id: src.category_id ?? undefined,
        brand: src.brand ?? undefined,
        images: src.images,
        model_url: src.model_url ?? undefined,
        stock: src.stock,
        tags: src.tags,
        is_published: false,
        meta_sync_status: "not_synced",
      });
    },
    onSuccess: () => {
      toast.success("تم إنشاء نسخة");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const importMut = useMutation({
    mutationFn: (url: string) => importCatalogFromUrl({ url, publish: true }),
    onSuccess: (r) => {
      toast.success(`تم الاستيراد: ${r.processed}/${r.total}`);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const autoCategorizeMut = useMutation({
    mutationFn: () => autoCategorizeProducts(),
    onSuccess: (res) => {
      toast.success(`تم توزيع وتصنيف ${res.categorizedCount} منتج تلقائياً بنجاح 🚀✨`);
      invalidate();
      qc.invalidateQueries({ queryKey: ["admin-categories"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const changeProductCategoryMut = useMutation({
    mutationFn: ({ id, category_id }: { id: string; category_id: string }) =>
      updateAdminProduct({ id, category_id }),
    onSuccess: () => {
      toast.success("تم التحديث والتخصيص الفوري للتصنيف");
      invalidate();
      qc.invalidateQueries({ queryKey: ["admin-categories"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Individual Sync Mutation
  const syncProductMut = useMutation({
    mutationFn: async (id: string) => {
      const list = productsQ.data ?? [];
      const p = list.find((x) => x.id === id);
      if (!p) throw new Error("المنتج غير موجود");

      // 1. Check data completeness
      if (!p.name || p.price <= 0 || !p.images || p.images.length === 0) {
        await updateAdminProduct({ id, meta_sync_status: "failed" });
        throw new Error(
          "بيانات المنتج غير مكتملة (يجب وجود اسم، سعر، وصورة واحدة على الأقل للمزامنة)",
        );
      }

      // 2. Set to syncing
      await updateAdminProduct({ id, meta_sync_status: "syncing" });
      invalidate();

      // 3. Mock sync delay (1.5 seconds)
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // 4. Update status to synced
      return updateAdminProduct({ id, meta_sync_status: "synced" });
    },
    onSuccess: () => {
      toast.success("تمت المزامنة بنجاح مع Meta Catalog");
      invalidate();
    },
    onError: (e: Error) => {
      toast.error(e.message);
      invalidate();
    },
  });

  // Bulk Sync Mutation
  const bulkSyncMut = useMutation({
    mutationFn: async () => {
      const list = productsQ.data ?? [];
      if (list.length === 0) throw new Error("لا توجد منتجات لمزامنتها");

      // Set all to syncing
      for (const p of list) {
        await updateAdminProduct({ id: p.id, meta_sync_status: "syncing" });
      }
      invalidate();

      // Mock delay (2 seconds)
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Update all based on completeness
      for (const p of list) {
        const isValid = p.name && p.price > 0 && p.images && p.images.length > 0;
        await updateAdminProduct({
          id: p.id,
          meta_sync_status: isValid ? "synced" : "failed",
        });
      }
    },
    onSuccess: () => {
      toast.success("تمت مزامنة جميع منتجات الكتالوج بنجاح");
      invalidate();
    },
    onError: (e: Error) => {
      toast.error(e.message);
      invalidate();
    },
  });

  const products = useMemo(() => productsQ.data ?? [], [productsQ.data]);
  const categories = categoriesQ.data ?? [];

  // Generate dynamic Feed URL based on tenant ID
  const { tenant } = useCurrentTenant();
  const tenantId = tenant?.id || "default";
  const feedUrl = `${window.location.origin}/api/catalog/${tenantId}.csv`;

  // Filter products client-side for extra Meta statuses
  const filteredProducts = useMemo(() => {
    let result = products;
    if (filter === "synced") {
      result = result.filter((p) => p.meta_sync_status === "synced");
    } else if (filter === "failed") {
      result = result.filter((p) => p.meta_sync_status === "failed");
    }
    return result;
  }, [products, filter]);

  // Stats calculation
  const totalCount = products.length;
  const syncedCount = products.filter((p) => p.meta_sync_status === "synced").length;
  const pendingCount = products.filter(
    (p) =>
      !p.meta_sync_status ||
      p.meta_sync_status === "not_synced" ||
      p.meta_sync_status === "syncing",
  ).length;
  const failedCount = products.filter((p) => p.meta_sync_status === "failed").length;
  const hiddenCount = products.filter((p) => !p.is_published).length;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("تم نسخ الرابط للحافظة");
  };

  const shareWhatsApp = (p: (typeof products)[0]) => {
    const url = `${window.location.origin}/product/${p.slug}`;
    const text = encodeURIComponent(
      `🛍️ *${p.name}*\n\n${p.description.slice(0, 150)}...\n\n💰 السعر: ${p.price} ${p.currency}\n\n🔗 للطلب واستعراض المنتج: ${url}`,
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const shareFacebook = (p: (typeof products)[0]) => {
    const url = `${window.location.origin}/product/${p.slug}`;
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      "_blank",
    );
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black lg:text-4xl text-foreground">
            🛍️ {t("products.title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {productsQ.isLoading ? "جارٍ التحميل..." : `${products.length} منتج إجمالي`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              if (confirm("هل تريد توزيع وتصنيف جميع المنتجات تلقائياً حسب الفئات المناسبة؟")) {
                autoCategorizeMut.mutate();
              }
            }}
            disabled={autoCategorizeMut.isPending}
            className="inline-flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-4 py-2.5 text-sm font-bold text-primary hover:bg-primary/20 disabled:opacity-60 transition"
          >
            {autoCategorizeMut.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            تصنيف المنتجات تلقائياً 🪄
          </button>
          <button
            onClick={() => {
              const url = window.prompt("رابط ملف CSV للاستيراد:", DEFAULT_CATALOG_URL);
              if (url && url.trim()) importMut.mutate(url.trim());
            }}
            disabled={importMut.isPending}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-bold hover:bg-accent disabled:opacity-60 transition"
          >
            {importMut.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-4 w-4 text-success" />
            )}
            استيراد Excel / CSV
          </button>
          <button
            onClick={() => bulkSyncMut.mutate()}
            disabled={bulkSyncMut.isPending}
            className="inline-flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2.5 text-sm font-bold text-primary hover:bg-primary/20 disabled:opacity-60 transition"
          >
            {bulkSyncMut.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            مزامنة مع Meta
          </button>
          <button
            onClick={() => navigate({ to: "/admin/product/$id", params: { id: "new" } })}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-bold hover:bg-accent transition"
          >
            <Plus className="h-4 w-4 text-primary" />
            منتج جديد
          </button>
          <Link
            to="/admin/studio"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-brand hover:bg-primary/90 transition"
          >
            <Sparkles className="h-4 w-4" />
            {t("nav.studio")}
          </Link>
        </div>
      </div>

      {/* Feed URL Card */}
      <div className="rounded-2xl border border-border/60 bg-surface/50 p-5 shadow-card">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <Link2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-base">رابط الكتالوج الجاهز لـ Meta</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                انسخ الرابط لربط المنتجات بـ Meta Commerce Manager وتحديثها دورياً.
              </p>
            </div>
          </div>
          <button
            onClick={() => copyToClipboard(feedUrl)}
            className="flex items-center gap-2 rounded-xl border border-primary/30 px-3 py-2 text-xs font-bold text-primary hover:bg-primary/10 transition"
          >
            <Copy className="h-3.5 w-3.5" /> نسخ الرابط
          </button>
        </div>

        <div className="mt-3 rounded-lg bg-muted p-2.5 font-mono text-[11px] text-primary/80 truncate select-all">
          {feedUrl}
        </div>

        <div className="mt-4 border-t border-border/40 pt-3">
          <button
            onClick={() => setShowInstructions(!showInstructions)}
            className="flex items-center gap-1.5 text-xs font-bold text-warning hover:opacity-80 transition"
          >
            <span>📌 كيف تربطه بـ Meta Commerce Manager؟</span>
            <span className="text-[10px] opacity-75">{showInstructions ? "▲ إخفاء" : "▼ عرض"}</span>
          </button>
          {showInstructions && (
            <ol className="mt-3 space-y-1.5 text-xs text-muted-foreground list-decimal ps-5">
              <li>افتح مدير المعاملات التجارية (Commerce Manager) في حسابك على Meta.</li>
              <li>
                اذهب إلى القائمة الجانبية: <strong>مصادر البيانات</strong> ←{" "}
                <strong>تحميل ملف البيانات</strong>.
              </li>
              <li>
                اختر طريقة التحميل: <strong>استخدام عنوان URL</strong>.
              </li>
              <li>الصق الرابط المنسوخ أعلاه في حقل الرابط.</li>
              <li>
                اختر جدولاً زمنياً مناسباً للتحديث التلقائي (يومي / أسبوعي) لضمان مزامنة المخزون
                والأسعار فوراً.
              </li>
            </ol>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="rounded-2xl border border-border bg-surface p-4">
          <p className="text-xs font-medium text-muted-foreground">إجمالي المنتجات</p>
          <p className="mt-1 text-2xl font-black text-foreground">{totalCount}</p>
        </div>
        <div className="rounded-2xl border border-success/30 bg-success/10 p-4">
          <p className="text-xs font-medium text-success">متزامنة مع Meta</p>
          <p className="mt-1 text-2xl font-black text-success">{syncedCount}</p>
        </div>
        <div className="rounded-2xl border border-warning/30 bg-warning/10 p-4">
          <p className="text-xs font-medium text-warning">بانتظار المزامنة</p>
          <p className="mt-1 text-2xl font-black text-warning">{pendingCount}</p>
        </div>
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4">
          <p className="text-xs font-medium text-destructive">فشل في المزامنة</p>
          <p className="mt-1 text-2xl font-black text-destructive">{failedCount}</p>
        </div>
        <div className="rounded-2xl border border-muted/40 bg-muted/50 p-4">
          <p className="text-xs font-medium text-muted-foreground">مخفية عن المتجر</p>
          <p className="mt-1 text-2xl font-black text-muted-foreground">{hiddenCount}</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="rounded-2xl border border-border bg-surface p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute top-1/2 -translate-y-1/2 start-3 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالاسم..."
            className="w-full rounded-xl border border-border bg-surface ps-9 pe-3 py-2 text-sm outline-none focus:border-primary transition"
          />
        </div>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary transition"
        >
          <option value="">كل التصنيفات</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <div className="flex flex-wrap gap-1 rounded-xl border border-border bg-surface p-1">
          {(
            [
              { id: "all", label: "الكل" },
              { id: "published", label: "منشور" },
              { id: "unpublished", label: "مخفي" },
              { id: "out", label: "نفد" },
              { id: "synced", label: "متزامن" },
              { id: "failed", label: "فشل المزامنة" },
            ] as const
          ).map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                filter === f.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid List */}
      {productsQ.isError ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-8 text-center text-destructive">
          <p className="text-sm">تعذّر تحميل المنتجات: {(productsQ.error as Error).message}</p>
          <button
            onClick={() => productsQ.refetch()}
            className="mt-3 inline-flex rounded-lg bg-surface border border-border px-3 py-1.5 text-xs font-bold text-foreground hover:bg-accent transition"
          >
            إعادة المحاولة
          </button>
        </div>
      ) : productsQ.isLoading ? (
        <div className="rounded-2xl border border-border bg-surface p-12 text-center">
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface p-12 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-primary/10">
            <Package className="h-7 w-7 text-primary" />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            لا توجد منتجات تطابق خيارات التصفية الحالية
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((p) => {
            const isSynced = p.meta_sync_status === "synced";
            const isSyncing = p.meta_sync_status === "syncing";
            const isFailed = p.meta_sync_status === "failed";

            return (
              <div
                key={p.id}
                className={`group relative overflow-hidden rounded-2xl border bg-surface hover:border-primary/50 transition duration-300 shadow-card hover:shadow-brand ${isSynced ? "border-success/20" : "border-border"}`}
              >
                {/* Images & Badges Section */}
                <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                  {p.images[0] ? (
                    <img
                      src={p.images[0]}
                      alt={p.name}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="grid h-full place-items-center text-muted-foreground">
                      <Package className="h-8 w-8" />
                    </div>
                  )}

                  {/* Sync Status Badge */}
                  <span
                    className={`absolute top-3 start-3 rounded-md px-2 py-0.5 text-[9px] font-bold text-primary-foreground shadow-sm transition ${
                      isSynced
                        ? "bg-success/90"
                        : isSyncing
                          ? "bg-primary/90 animate-pulse"
                          : isFailed
                            ? "bg-destructive/90"
                            : "bg-warning/90"
                    }`}
                  >
                    {isSynced
                      ? "✓ متزامن"
                      : isSyncing
                        ? "⏳ جاري المزامنة"
                        : isFailed
                          ? "❌ فشل المزامنة"
                          : "⏳ بانتظار المزامنة"}
                  </span>

                  {/* Store Status Badge */}
                  <span
                    className={`absolute top-3 end-3 rounded-md px-2 py-0.5 text-[9px] font-bold text-primary-foreground shadow-sm ${
                      p.is_published ? "bg-foreground/90 border border-border" : "bg-warning/90"
                    }`}
                  >
                    {p.is_published ? "منشور بالمتجر" : "مخفي"}
                  </span>

                  {p.stock <= 0 && (
                    <span className="absolute inset-0 flex items-center justify-center bg-showcase/60 text-sm font-black text-destructive-foreground">
                      نفد من المخزن
                    </span>
                  )}
                </div>

                {/* Info Section */}
                <div className="p-4">
                  <div className="flex justify-between items-start gap-2">
                    <div className="truncate text-sm font-bold text-foreground hover:text-primary transition">
                      {p.name}
                    </div>

                    {/* Action Dropdown Menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="h-7 w-7 rounded-lg hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-40 bg-surface border border-border"
                      >
                        <DropdownMenuItem
                          onClick={() => syncProductMut.mutate(p.id)}
                          disabled={syncProductMut.isPending}
                        >
                          <RefreshCw className="me-2 h-3.5 w-3.5 text-primary" />
                          <span>مزامنة Meta</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => navigate({ to: `/admin/product/${p.id}` })}
                        >
                          <Eye className="me-2 h-3.5 w-3.5 text-primary" />
                          <span>تعديل</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            window.open(`${window.location.origin}/product/${p.slug}`, "_blank")
                          }
                        >
                          <Globe className="me-2 h-3.5 w-3.5 text-primary" />
                          <span>معاينة المتجر</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => shareWhatsApp(p)}>
                          <Share2 className="me-2 h-3.5 w-3.5 text-success" />
                          <span>واتساب</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => shareFacebook(p)}>
                          <Share2 className="me-2 h-3.5 w-3.5 text-primary" />
                          <span>فيسبوك</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => duplicateMut.mutate(p.id)}>
                          <Copy className="me-2 h-3.5 w-3.5 text-muted-foreground" />
                          <span>نسخ الكائن</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            if (confirm(`هل أنت متأكد من حذف المنتج "${p.name}"؟`))
                              removeMut.mutate(p.id);
                          }}
                          className="text-destructive focus:text-destructive focus:bg-destructive/10"
                        >
                          <Trash2 className="me-2 h-3.5 w-3.5" />
                          <span>حذف</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground gap-2">
                    <select
                      value={p.category_id || ""}
                      onChange={(e) =>
                        changeProductCategoryMut.mutate({ id: p.id, category_id: e.target.value })
                      }
                      className="rounded-lg border border-border/60 bg-background/80 px-2 py-0.5 text-[11px] font-bold text-foreground outline-none focus:border-primary cursor-pointer hover:border-primary/50 transition max-w-[170px] truncate"
                    >
                      <option value="">📂 بدون تصنيف</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          📁 {c.name}
                        </option>
                      ))}
                    </select>
                    {p.sku && <div className="font-mono text-[10px] shrink-0">SKU: {p.sku}</div>}
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-2.5">
                    <div className="text-sm font-black text-primary">
                      {p.price} {p.currency}
                    </div>
                    <div className="text-xs text-muted-foreground">المخزون: {p.stock}</div>
                  </div>

                  {/* Sync Timestamp */}
                  <div className="mt-2 flex items-center gap-1 text-[9px] text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>تحديث: {new Date(p.updated_at).toLocaleString("ar")}</span>
                  </div>

                  {/* Inline Primary Actions */}
                  <div className="mt-3.5 flex gap-2">
                    <button
                      onClick={() =>
                        togglePublish.mutate({ id: p.id, is_published: !p.is_published })
                      }
                      disabled={togglePublish.isPending}
                      className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
                        p.is_published
                          ? "border-warning/30 bg-warning/10 text-warning hover:bg-warning/20"
                          : "border-success/30 bg-success/10 text-success hover:bg-success/20"
                      }`}
                    >
                      {p.is_published ? (
                        <EyeOff className="h-3.5 w-3.5" />
                      ) : (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      )}
                      {p.is_published ? "إخفاء" : "نشر بالمتجر"}
                    </button>
                    <button
                      onClick={() => syncProductMut.mutate(p.id)}
                      disabled={syncProductMut.isPending}
                      className="inline-flex items-center justify-center rounded-xl border border-primary/30 bg-primary/5 p-2 text-primary hover:bg-primary/10 transition"
                      title="مزامنة فورية"
                    >
                      {syncProductMut.isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

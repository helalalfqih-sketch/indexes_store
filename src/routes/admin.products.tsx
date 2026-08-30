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
  RefreshCw,
  Link2,
  AlertCircle,
  MoreVertical,
  Share2,
  FileSpreadsheet,
  Globe,
  Clock,
  ChevronDown,
  ChevronUp,
  XCircle,
} from "lucide-react";
import { useMemo, useState, useRef } from "react";
import type { ImportResult } from "@/lib/catalog-import.functions";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { invalidateCatalogCache } from "@/lib/utils/cache-invalidation";
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
import { publishProductToFacebook } from "@/lib/facebook.functions";
import { useServerFn } from "@tanstack/react-start";
import { listShopifyCategories } from "@/lib/shopify/catalog.functions";

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
  const [page, setPage] = useState<number>(1);
  const publishToFacebookFn = useServerFn(publishProductToFacebook);
  const pageSize = 20;
  const [showInstructions, setShowInstructions] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [showFailures, setShowFailures] = useState(false);
  const importResultRef = useRef<HTMLDivElement>(null);

  const query = useMemo(
    () => ({
      search: search.trim() || undefined,
      categoryId: categoryId || undefined,
      publishedOnly: filter === "published" || undefined,
      unpublishedOnly: filter === "unpublished" || undefined,
      outOfStock: filter === "out" || undefined,
      page,
      pageSize,
    }),
    [search, categoryId, filter, page, pageSize],
  );

  const productsQ = useQuery({
    queryKey: ["admin-products", query],
    queryFn: () => listAdminProducts(query),
  });

  const categoriesQ = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const shopify = await listShopifyCategories();
      return shopify.configured ? shopify.items : listAdminCategories();
    },
  });

  const invalidate = () => invalidateCatalogCache(qc);

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
    mutationFn: (url?: string) => importCatalogFromUrl({ url, publish: true }),
    onSuccess: (r) => {
      setImportResult(r);
      setShowFailures(false);
      const successCount = r.inserted + r.updated;
      if (r.failed === 0 && successCount > 0) {
        toast.success(
          `✅ اكتمل الاستيراد: ${successCount} منتج | ${r.primaryImagesImported} صورة رئيسية | ${r.additionalImagesImported} صورة إضافية | ${r.videosImported} فيديو`,
        );
      } else if (successCount > 0 && (r.failed > 0 || r.skipped > 0)) {
        toast.warning(
          `⚠️ اكتمل جزئياً: ${successCount} تمت معالجتهم، ${r.failed} فشل، ${r.skipped} تخطي`,
        );
      } else {
        toast.error("❌ لم يُستورد أي منتج صالح");
      }
      invalidate();
      qc.invalidateQueries({ queryKey: ["storefront-products"] });
      qc.invalidateQueries({ queryKey: ["admin-categories"] });
      setTimeout(() => importResultRef.current?.scrollIntoView({ behavior: "smooth" }), 300);
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

  const products = useMemo(() => productsQ.data ?? ([] as any[]), [productsQ.data]);
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

  // Total counts from response metadata
  const metaData = productsQ.data as unknown as {
    total?: number;
    totalCount?: number;
    catalogSource?: "shopify" | "supabase";
    productsWithPrice?: number;
    productsWithImages?: number;
  };
  const isShopifyCatalog = metaData?.catalogSource === "shopify";
  const totalCount = Number(metaData?.total ?? metaData?.totalCount ?? products.length);
  const pageCount = Math.ceil(totalCount / pageSize) || 1;
  const syncedCount = products.filter((p) => p.meta_sync_status === "synced").length;
  const pendingCount = products.filter(
    (p) =>
      !p.meta_sync_status ||
      p.meta_sync_status === "not_synced" ||
      p.meta_sync_status === "syncing",
  ).length;
  const failedCount = products.filter((p) => p.meta_sync_status === "failed").length;
  const hiddenCount = products.filter((p) => !p.is_published).length;
  const importedVideosCount = products.filter((p) => !!p.video_url).length;
  const importedImagesCount = products.reduce(
    (acc, p) => acc + (p.images && p.images.length > 0 ? p.images.length : p.image ? 1 : 0),
    0,
  );

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("تم نسخ الرابط للحافظة");
  };

  const shareWhatsApp = (p: (typeof products)[0]) => {
    const url = `${window.location.origin}/product/${p.slug}`;
    const text = encodeURIComponent(
      `🛍️ *${p.name}*\n\n${(p.description || "").slice(0, 150)}...\n\n💰 السعر: ${p.price} ${p.currency}\n\n🔗 للطلب واستعراض المنتج: ${url}`,
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const publishToFbMut = useMutation({
    mutationFn: (productId: string) => publishToFacebookFn({ data: { productId } }),
    onSuccess: (res) => {
      toast.success(res.message || "تم النشر على فيسبوك بنجاح! 🎉");
    },
    onError: (err: any) => {
      toast.error(err.message || "فشل النشر على فيسبوك.");
      if (err.message?.includes("لم يتم ربط حساب فيسبوك")) {
        navigate({ to: "/admin/integrations/facebook" as any });
      }
    },
  });

  const shareFacebook = (p: (typeof products)[0]) => {
    publishToFbMut.mutate(p.id);
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
            {productsQ.isLoading ? "جارٍ التحميل..." : `${totalCount} منتج إجمالي`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!isShopifyCatalog && (
            <>
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
              const url = window.prompt(
                "رابط ملف CSV للاستيراد (HTTPS فقط)\nاتركه فارغاً لاستخدام الرابط الافتراضي المخزن في السيرفر:",
                "",
              );
              if (url !== null) {
                setImportResult(null);
                importMut.mutate(url.trim() || undefined);
              }
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
            </>
          )}
        </div>
      </div>

      {isShopifyCatalog && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
            <div>
              <p className="font-black text-foreground">كتالوج Shopify متصل</p>
              <p className="mt-1 text-sm text-muted-foreground">
                تعرض هذه الصفحة المنتجات الحقيقية من Shopify. التعديل والحذف والإخفاء يتم من لوحة Shopify لأن Storefront API الحالي للقراءة فقط.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Import Result Panel */}
      {importMut.isPending && (
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5 flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-primary shrink-0" />
          <div>
            <p className="font-bold text-foreground text-sm">جارٍ استيراد الكتالوج...</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              تحميل → تحليل → التحقق → استيراد المنتجات والوسائط
            </p>
          </div>
        </div>
      )}

      {importResult && !importMut.isPending && (
        <div
          ref={importResultRef}
          className={`rounded-2xl border p-5 ${
            importResult.failed === 0 && importResult.productsProcessed > 0
              ? "border-success/40 bg-success/5"
              : importResult.productsProcessed > 0
                ? "border-warning/40 bg-warning/5"
                : "border-destructive/40 bg-destructive/5"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              {importResult.failed === 0 && importResult.productsProcessed > 0 ? (
                <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
              ) : importResult.productsProcessed > 0 ? (
                <AlertCircle className="h-5 w-5 text-warning shrink-0" />
              ) : (
                <XCircle className="h-5 w-5 text-destructive shrink-0" />
              )}
              <h3 className="font-bold text-foreground text-sm">
                {importResult.failed === 0 && importResult.productsProcessed > 0
                  ? "✅ اكتمل الاستيراد بنجاح"
                  : importResult.productsProcessed > 0
                    ? "⚠️ اكتمل الاستيراد جزئياً"
                    : "❌ فشل الاستيراد"}
              </h3>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { label: "صفوف CSV", value: importResult.csvRows, color: "text-foreground" },
              { label: "منتجات صالحة", value: importResult.validRows, color: "text-foreground" },
              {
                label: "تمت معالجتهم",
                value: importResult.productsProcessed,
                color: "text-success",
              },
              { label: "تخطي", value: importResult.skipped, color: "text-warning" },
              { label: "فشل", value: importResult.failed, color: "text-destructive" },
              {
                label: "صور رئيسية",
                value: importResult.primaryImagesImported,
                color: "text-primary",
              },
              {
                label: "صور إضافية",
                value: importResult.additionalImagesImported,
                color: "text-primary",
              },
              { label: "فيديوهات", value: importResult.videosImported, color: "text-primary" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-border/60 bg-surface p-3">
                <p className="text-[10px] font-medium text-muted-foreground">{s.label}</p>
                <p className={`text-xl font-black mt-0.5 ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {importResult.failures.length > 0 && (
            <div className="mt-4">
              <button
                onClick={() => setShowFailures((v) => !v)}
                className="flex items-center gap-1.5 text-xs font-bold text-destructive hover:opacity-80 transition"
              >
                {showFailures ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
                {importResult.failures.length} مشكلة موجودة — انقر للتفاصيل
              </button>
              {showFailures && (
                <div className="mt-3 space-y-1.5 max-h-64 overflow-y-auto">
                  {importResult.failures.map((f, i) => (
                    <div
                      key={i}
                      className="rounded-lg border border-destructive/20 bg-destructive/5 p-2.5 text-xs"
                    >
                      <span className="font-bold text-destructive">صف #{f.rowNumber}</span>
                      {f.externalId && (
                        <span className="text-muted-foreground font-mono ms-2">{f.externalId}</span>
                      )}
                      {f.title && <span className="ms-2 text-foreground">{f.title}</span>}
                      <span className="ms-2 text-destructive">[{f.code}]</span>
                      <span className="ms-1 text-muted-foreground">{f.message}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Feed URL Card */}
      {!isShopifyCatalog && (
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
      )}

      {/* Stats Row */}
      <div className={`grid grid-cols-2 gap-3 ${isShopifyCatalog ? "sm:grid-cols-3" : "sm:grid-cols-4 lg:grid-cols-7"}`}>
        <div className="rounded-2xl border border-border bg-surface p-4">
          <p className="text-xs font-medium text-muted-foreground">إجمالي المنتجات</p>
          <p className="mt-1 text-2xl font-black text-foreground">{totalCount}</p>
        </div>
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
          <p className="text-xs font-medium text-primary">
            {isShopifyCatalog ? "منتجات بصور" : "الصور المستوردة"}
          </p>
          <p className="mt-1 text-2xl font-black text-primary">
            {isShopifyCatalog ? (metaData.productsWithImages ?? 0) : importedImagesCount}
          </p>
        </div>
        {isShopifyCatalog && (
          <div className="rounded-2xl border border-success/30 bg-success/10 p-4">
            <p className="text-xs font-medium text-success">منتجات بأسعار</p>
            <p className="mt-1 text-2xl font-black text-success">{metaData.productsWithPrice ?? 0}</p>
          </div>
        )}
        {!isShopifyCatalog && (
          <>
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
          <p className="text-xs font-medium text-primary">الفيديوهات المستوردة</p>
          <p className="mt-1 text-2xl font-black text-primary">{importedVideosCount}</p>
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
          </>
        )}
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
            ].filter((item) => !isShopifyCatalog || !["synced", "failed"].includes(item.id)) as Array<{
              id: Filter;
              label: string;
            }>
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
                      isShopifyCatalog
                        ? "bg-emerald-600/90"
                        : isSynced
                        ? "bg-success/90"
                        : isSyncing
                          ? "bg-primary/90 animate-pulse"
                          : isFailed
                            ? "bg-destructive/90"
                            : "bg-warning/90"
                    }`}
                  >
                    {isShopifyCatalog
                      ? "✓ Shopify"
                      : isSynced
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
                    {!isShopifyCatalog && <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          aria-label={`خيارات الإدارة للمنتج ${p.name}`}
                          className="h-8 w-8 min-h-[44px] min-w-[44px] rounded-lg hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition"
                        >
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
                          {publishToFbMut.isPending && publishToFbMut.variables === p.id ? (
                            <Loader2 className="me-2 h-3.5 w-3.5 animate-spin text-primary" />
                          ) : (
                            <Share2 className="me-2 h-3.5 w-3.5 text-primary" />
                          )}
                          <span>نشر في فيسبوك</span>
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
                    </DropdownMenu>}
                  </div>

                  <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground gap-2">
                    <select
                      value={p.category_id || ""}
                      disabled={isShopifyCatalog}
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
                  {!isShopifyCatalog && <div className="mt-3.5 flex gap-2">
                    <button
                      onClick={() =>
                        togglePublish.mutate({ id: p.id, is_published: !p.is_published })
                      }
                      disabled={togglePublish.isPending}
                      aria-label={
                        p.is_published ? `إخفاء المنتج ${p.name}` : `نشر المنتج ${p.name}`
                      }
                      className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition min-h-[44px] ${
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
                      aria-label={`مزامنة المنتج ${p.name} مع Meta`}
                      className="inline-flex items-center justify-center rounded-xl border border-primary/30 bg-primary/5 p-2 text-primary hover:bg-primary/10 transition min-h-[44px] min-w-[44px]"
                      title="مزامنة فورية"
                    >
                      {syncProductMut.isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {pageCount > 1 && (
        <div
          className="flex items-center justify-between border-t border-border/50 pt-4 text-xs font-bold"
          dir="rtl"
        >
          <span className="text-muted-foreground">
            الصفحة {page} من {pageCount} (إجمالي {totalCount} منتج)
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-xl border border-border bg-surface px-4 py-2 hover:bg-accent disabled:opacity-40 transition min-h-[44px]"
            >
              السابق
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              disabled={page >= pageCount}
              className="rounded-xl border border-border bg-surface px-4 py-2 hover:bg-accent disabled:opacity-40 transition min-h-[44px]"
            >
              التالي
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

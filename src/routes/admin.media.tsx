import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type MouseEvent as ReactMouseEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  AlertCircle,
  Check,
  CheckSquare,
  Copy,
  FileCode,
  Film,
  Image as ImageIcon,
  Link as LinkIcon,
  Loader2,
  MessageSquare,
  Package,
  PackagePlus,
  Search,
  Sparkles,
  Square,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { MediaUploadPanel } from "@/components/admin/media-upload-panel";
import {
  attachMediaToExistingProduct,
  bulkDeleteMediaFiles,
  deleteMediaFile,
  findUnusedMediaFiles,
  listMediaFiles,
  searchExistingProductsForLink,
  type MediaFileRecord,
} from "@/lib/media.functions";

export const Route = createFileRoute("/admin/media")({
  head: () => ({
    meta: [
      { title: "مكتبة الوسائط — لوحة الإدارة" },
      {
        name: "description",
        content: "إدارة الصور والفيديوهات والوسائط في متجرك الإلكتروني.",
      },
    ],
  }),
  component: AdminMediaComponent,
});

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 MB";
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function MediaPreview({ file }: { file: MediaFileRecord }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-muted text-muted-foreground">
        <AlertCircle className="h-7 w-7" />
        <span className="text-[10px] font-bold">تعذر تحميل المعاينة</span>
      </div>
    );
  }

  if (file.file_type === "video") {
    return (
      <div className="relative h-full w-full bg-black">
        <video
          src={file.file_url}
          poster={file.thumbnail_url || undefined}
          muted
          playsInline
          preload="metadata"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/25">
          <Film className="h-7 w-7 text-white drop-shadow-md" />
        </div>
      </div>
    );
  }

  return (
    <img
      src={file.file_url}
      alt={file.file_name}
      loading="lazy"
      onError={() => setFailed(true)}
      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
    />
  );
}

function AdminMediaComponent() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const fetchMediaFn = useServerFn(listMediaFiles);
  const deleteMediaFn = useServerFn(deleteMediaFile);
  const bulkDeleteMediaFn = useServerFn(bulkDeleteMediaFiles);
  const scanUnusedFn = useServerFn(findUnusedMediaFiles);
  const searchProductsFn = useServerFn(searchExistingProductsForLink);
  const attachMediaFn = useServerFn(attachMediaToExistingProduct);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "image" | "video">("all");
  const [filterSource, setFilterSource] = useState<
    "all" | "upload" | "whatsapp" | "ai_generated"
  >("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortOption, setSortOption] = useState("newest");
  const [selectedFile, setSelectedFile] = useState<MediaFileRecord | null>(null);
  const [selectedMediaIds, setSelectedMediaIds] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isScanningUnused, setIsScanningUnused] = useState(false);
  const [unusedFiles, setUnusedFiles] = useState<MediaFileRecord[] | null>(null);
  const [isAttachModalOpen, setIsAttachModalOpen] = useState(false);
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [selectedTargetProductId, setSelectedTargetProductId] = useState<
    string | null
  >(null);

  const {
    data: mediaFiles = [],
    isLoading,
    error: mediaError,
  } = useQuery({
    queryKey: [
      "admin-media-files",
      searchTerm,
      filterType,
      filterSource,
      filterCategory,
      sortOption,
    ],
    queryFn: () =>
      fetchMediaFn({
        data: {
          search: searchTerm,
          type: filterType,
          source: filterSource,
          category: filterCategory,
          sort: sortOption,
        },
      }),
    retry: 1,
    staleTime: 5000,
  });

  const { data: targetProducts = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ["admin-target-products", productSearchQuery],
    queryFn: () =>
      searchProductsFn({ data: { query: productSearchQuery } }),
    enabled: isAttachModalOpen,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteMediaFn({ data: { id } }),
    onSuccess: () => {
      toast.success("تم حذف الملف بنجاح");
      queryClient.invalidateQueries({ queryKey: ["admin-media-files"] });
      setSelectedFile(null);
    },
    onError: (error: Error) =>
      toast.error(error.message || "فشل حذف الملف"),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => bulkDeleteMediaFn({ data: { ids } }),
    onSuccess: (result) => {
      toast.success(`تم حذف ${result.deleted ?? selectedMediaIds.length} ملف`);
      queryClient.invalidateQueries({ queryKey: ["admin-media-files"] });
      setSelectedMediaIds([]);
    },
    onError: (error: Error) =>
      toast.error(error.message || "فشل حذف الملفات المحددة"),
  });

  const attachMutation = useMutation({
    mutationFn: ({
      productId,
      mediaIds,
    }: {
      productId: string;
      mediaIds: string[];
    }) => attachMediaFn({ data: { productId, mediaIds } }),
    onSuccess: (result) => {
      toast.success(`تم ربط ${result.linkedCount} وسائط بالمنتج`);
      queryClient.invalidateQueries({ queryKey: ["admin-media-files"] });
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      setIsAttachModalOpen(false);
      setSelectedTargetProductId(null);
      setSelectedMediaIds([]);
      setSelectedFile(null);
    },
    onError: (error: Error) =>
      toast.error(error.message || "فشل ربط الوسائط بالمنتج"),
  });

  const handleCopyUrl = async (url: string, id: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      toast.success("تم نسخ رابط الملف");
      window.setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error("تعذر نسخ الرابط إلى الحافظة");
    }
  };

  const handleScanUnused = async () => {
    setIsScanningUnused(true);
    try {
      const unused = await scanUnusedFn();
      setUnusedFiles(unused);
      toast[unused.length ? "warning" : "success"](
        unused.length
          ? `تم العثور على ${unused.length} ملف غير مستخدم`
          : "جميع الوسائط مرتبطة بمحتوى المتجر",
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "فشل فحص الملفات غير المستخدمة",
      );
    } finally {
      setIsScanningUnused(false);
    }
  };

  const toggleSelectMedia = (id: string, event?: ReactMouseEvent) => {
    event?.stopPropagation();
    setSelectedMediaIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  };

  const toggleSelectAll = () => {
    setSelectedMediaIds((current) =>
      current.length === mediaFiles.length
        ? []
        : mediaFiles.map((item) => item.id),
    );
  };

  const handleCreateProductFromSelected = () => {
    if (!selectedMediaIds.length) return;
    navigate({
      to: "/admin/product/$id",
      params: { id: "new" },
      search: { media_ids: selectedMediaIds.join(",") },
    });
  };

  const handleOpenAttachModal = (singleMediaId?: string) => {
    if (
      singleMediaId &&
      !selectedMediaIds.includes(singleMediaId)
    ) {
      setSelectedMediaIds([singleMediaId]);
    }
    setIsAttachModalOpen(true);
  };

  const handleConfirmAttach = () => {
    const mediaIds = selectedMediaIds.length
      ? selectedMediaIds
      : selectedFile
        ? [selectedFile.id]
        : [];

    if (!selectedTargetProductId || !mediaIds.length) {
      toast.error("اختر المنتج والوسائط أولاً");
      return;
    }

    attachMutation.mutate({
      productId: selectedTargetProductId,
      mediaIds,
    });
  };

  return (
    <div className="space-y-6 pb-24 font-sans" dir="rtl">
      <header className="flex flex-col gap-4 border-b border-border/60 pb-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-black tracking-tight text-foreground">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ImageIcon className="h-5 w-5" />
            </span>
            مكتبة الوسائط
          </h1>
          <p className="mt-1 text-xs font-medium text-muted-foreground">
            رفع مباشر وآمن للصور والفيديوهات إلى Supabase Storage دون Base64.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {mediaFiles.length > 0 && (
            <button
              type="button"
              onClick={toggleSelectAll}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-border bg-surface px-3 py-2 text-xs font-bold"
            >
              {selectedMediaIds.length === mediaFiles.length ? (
                <CheckSquare className="h-4 w-4 text-primary" />
              ) : (
                <Square className="h-4 w-4" />
              )}
              {selectedMediaIds.length === mediaFiles.length
                ? "إلغاء تحديد الكل"
                : "تحديد الكل"}
            </button>
          )}

          <Link
            to="/admin/integrations/whatsapp"
            className="inline-flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-xs font-bold text-emerald-600"
          >
            <MessageSquare className="h-4 w-4" />
            مزامنة الواتساب
          </Link>

          <Link
            to="/admin/diagnostics/whatsapp"
            className="inline-flex items-center gap-2 rounded-2xl border border-purple-500/30 bg-purple-500/10 px-3.5 py-2 text-xs font-bold text-purple-600"
          >
            <FileCode className="h-4 w-4" />
            التشخيص
          </Link>

          <button
            type="button"
            onClick={handleScanUnused}
            disabled={isScanningUnused}
            className="inline-flex items-center gap-2 rounded-2xl border border-border bg-surface px-3.5 py-2 text-xs font-bold disabled:opacity-50"
          >
            {isScanningUnused ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 text-amber-500" />
            )}
            فحص المهملات
          </button>
        </div>
      </header>

      <MediaUploadPanel
        onUploaded={() =>
          void queryClient.invalidateQueries({
            queryKey: ["admin-media-files"],
          })
        }
      />

      <section className="space-y-3 rounded-3xl border border-border/80 bg-surface p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="ابحث باسم الملف"
              className="w-full rounded-2xl border border-border bg-background py-2 ps-9 pe-4 text-xs"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              value={filterCategory}
              onChange={(event) => setFilterCategory(event.target.value)}
              className="rounded-2xl border border-border bg-background px-3 py-2 text-xs font-bold"
            >
              <option value="all">جميع التصنيفات</option>
              <option value="معدات وأدوات">معدات وأدوات</option>
              <option value="إلكترونيات">إلكترونيات</option>
              <option value="ساعات ومجوهرات">ساعات ومجوهرات</option>
              <option value="أثاث ومنزل">أثاث ومنزل</option>
              <option value="وسائط متنوعة">وسائط متنوعة</option>
            </select>

            <select
              value={sortOption}
              onChange={(event) => setSortOption(event.target.value)}
              className="rounded-2xl border border-border bg-background px-3 py-2 text-xs font-bold"
            >
              <option value="newest">الأحدث</option>
              <option value="oldest">الأقدم</option>
              <option value="seq_asc">رقم الإدخال تصاعدياً</option>
              <option value="seq_desc">رقم الإدخال تنازلياً</option>
              <option value="name_asc">الاسم أ - ي</option>
              <option value="name_desc">الاسم ي - أ</option>
              <option value="largest">الأكبر حجماً</option>
              <option value="smallest">الأصغر حجماً</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/50 pt-3">
          <div className="flex gap-1">
            {(["all", "image", "video"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setFilterType(type)}
                className={`rounded-xl px-3 py-1 text-xs font-bold ${
                  filterType === type
                    ? "bg-primary text-primary-foreground"
                    : "bg-background text-muted-foreground"
                }`}
              >
                {type === "all"
                  ? "الكل"
                  : type === "image"
                    ? "الصور"
                    : "الفيديوهات"}
              </button>
            ))}
          </div>

          <div className="flex gap-1">
            {(["all", "upload", "whatsapp", "ai_generated"] as const).map(
              (source) => (
                <button
                  key={source}
                  type="button"
                  onClick={() => setFilterSource(source)}
                  className={`rounded-xl px-3 py-1 text-xs font-bold ${
                    filterSource === source
                      ? "bg-emerald-600 text-white"
                      : "bg-background text-muted-foreground"
                  }`}
                >
                  {source === "all"
                    ? "كل المصادر"
                    : source === "upload"
                      ? "رفع يدوي"
                      : source === "whatsapp"
                        ? "واتساب"
                        : "ذكاء اصطناعي"}
                </button>
              ),
            )}
          </div>
        </div>
      </section>

      {unusedFiles && unusedFiles.length > 0 && (
        <div className="flex items-center justify-between gap-4 rounded-3xl border border-amber-500/30 bg-amber-500/10 p-4">
          <div className="flex items-center gap-3 text-xs font-bold text-amber-700">
            <AlertCircle className="h-5 w-5" />
            تم العثور على {unusedFiles.length} ملف غير مرتبط.
          </div>
          <button
            type="button"
            onClick={() =>
              bulkDeleteMutation.mutate(
                unusedFiles.map((file) => file.id),
              )
            }
            className="rounded-2xl bg-destructive px-3.5 py-1.5 text-xs font-bold text-destructive-foreground"
          >
            حذف الملفات المهملة
          </button>
        </div>
      )}

      {mediaError ? (
        <div className="rounded-3xl border border-destructive/30 bg-destructive/10 p-8 text-center text-sm font-bold text-destructive">
          تعذر تحميل مكتبة الوسائط:{" "}
          {mediaError instanceof Error
            ? mediaError.message
            : "خطأ غير معروف"}
        </div>
      ) : isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : mediaFiles.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-surface p-12 text-center">
          <ImageIcon className="mx-auto h-10 w-10 text-primary" />
          <h3 className="mt-3 text-base font-bold">لا توجد وسائط</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            ارفع ملفاً حقيقياً إلى Storage لبدء المكتبة.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {mediaFiles.map((file, index) => {
            const source = String(file.metadata?.source || "upload");
            const selected = selectedMediaIds.includes(file.id);

            return (
              <article
                key={file.id}
                onClick={() => setSelectedFile(file)}
                className={`group relative cursor-pointer overflow-hidden rounded-3xl border bg-surface shadow-sm ${
                  selected
                    ? "border-primary ring-2 ring-primary/40"
                    : "border-border/80 hover:border-primary/60"
                }`}
              >
                <div className="absolute inset-x-2.5 top-2.5 z-10 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={(event) =>
                      toggleSelectMedia(file.id, event)
                    }
                    className="rounded-xl bg-background/90 p-1 shadow backdrop-blur"
                    aria-label={`تحديد ${file.file_name}`}
                  >
                    {selected ? (
                      <CheckSquare className="h-4 w-4 text-primary" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </button>

                  <div className="flex items-center gap-1">
                    <span className="rounded-md bg-black/75 px-1.5 py-0.5 text-[9px] font-bold text-white">
                      #{file.sequence_number || index + 1}
                    </span>
                    {source === "whatsapp" && (
                      <span className="rounded-md bg-emerald-600 px-1.5 py-0.5 text-[9px] font-bold text-white">
                        WA
                      </span>
                    )}
                    {source === "ai_generated" && (
                      <span className="rounded-md bg-purple-600 px-1.5 py-0.5 text-[9px] font-bold text-white">
                        AI
                      </span>
                    )}
                  </div>
                </div>

                <div className="aspect-square overflow-hidden bg-muted">
                  <MediaPreview file={file} />
                </div>

                <div className="space-y-1 p-2.5 text-xs">
                  <p className="truncate font-bold">{file.file_name}</p>
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>{formatBytes(file.size_bytes)}</span>
                    <span>
                      {file.file_type === "video" ? "فيديو" : "صورة"}
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {selectedMediaIds.length > 0 && (
        <div className="fixed inset-x-4 bottom-6 z-40 mx-auto flex max-w-2xl items-center justify-between gap-3 rounded-3xl bg-foreground p-3.5 text-background shadow-2xl">
          <span className="text-xs font-bold">
            تم تحديد {selectedMediaIds.length} ملفات
          </span>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCreateProductFromSelected}
              className="inline-flex items-center gap-1.5 rounded-2xl bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground"
            >
              <PackagePlus className="h-4 w-4" />
              إنشاء منتج
            </button>

            <button
              type="button"
              onClick={() => handleOpenAttachModal()}
              className="inline-flex items-center gap-1.5 rounded-2xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white"
            >
              <LinkIcon className="h-4 w-4" />
              ربط بمنتج
            </button>

            <button
              type="button"
              onClick={() =>
                bulkDeleteMutation.mutate(selectedMediaIds)
              }
              disabled={bulkDeleteMutation.isPending}
              className="inline-flex items-center gap-1.5 rounded-2xl bg-destructive px-3 py-2 text-xs font-bold text-destructive-foreground"
            >
              <Trash2 className="h-4 w-4" />
              حذف
            </button>

            <button
              type="button"
              onClick={() => setSelectedMediaIds([])}
              className="rounded-xl p-1.5"
              aria-label="إلغاء التحديد"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {isAttachModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg space-y-4 rounded-3xl border border-border bg-surface p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold">
                ربط الوسائط بمنتج موجود
              </h3>
              <button
                type="button"
                onClick={() => setIsAttachModalOpen(false)}
                className="rounded-xl p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="relative">
              <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={productSearchQuery}
                onChange={(event) =>
                  setProductSearchQuery(event.target.value)
                }
                placeholder="ابحث باسم المنتج"
                className="w-full rounded-2xl border border-border bg-background py-2.5 ps-9 pe-4 text-xs"
              />
            </div>

            <div className="max-h-64 space-y-2 overflow-y-auto rounded-2xl border border-border/50 p-2">
              {isLoadingProducts ? (
                <Loader2 className="mx-auto my-8 h-5 w-5 animate-spin" />
              ) : targetProducts.length === 0 ? (
                <p className="py-8 text-center text-xs text-muted-foreground">
                  لا توجد منتجات مطابقة
                </p>
              ) : (
                targetProducts.map((product) => {
                  const selected =
                    selectedTargetProductId === product.id;
                  const thumbnail = Array.isArray(product.images)
                    ? product.images[0]
                    : null;

                  return (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() =>
                        setSelectedTargetProductId(product.id)
                      }
                      className={`flex w-full items-center justify-between rounded-xl border p-2.5 text-start ${
                        selected
                          ? "border-emerald-500 bg-emerald-500/10"
                          : "border-border/60"
                      }`}
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
                          {thumbnail ? (
                            <img
                              src={thumbnail}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Package className="h-5 w-5" />
                          )}
                        </span>

                        <span className="min-w-0">
                          <span className="block truncate text-xs font-bold">
                            {product.name}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {product.price} {product.currency || "YER"}
                          </span>
                        </span>
                      </span>

                      {selected && (
                        <Check className="h-4 w-4 text-emerald-600" />
                      )}
                    </button>
                  );
                })
              )}
            </div>

            <div className="flex justify-between border-t border-border pt-3">
              <button
                type="button"
                onClick={() => setIsAttachModalOpen(false)}
                className="rounded-xl px-4 py-2 text-xs font-bold"
              >
                إلغاء
              </button>

              <button
                type="button"
                onClick={handleConfirmAttach}
                disabled={
                  !selectedTargetProductId ||
                  attachMutation.isPending
                }
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white disabled:opacity-50"
              >
                {attachMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LinkIcon className="h-4 w-4" />
                )}
                ربط الوسائط
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl space-y-4 rounded-3xl border border-border bg-surface p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="truncate text-base font-bold">
                {selectedFile.file_name}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedFile(null)}
                className="rounded-xl p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex aspect-video items-center justify-center overflow-hidden rounded-2xl bg-black">
              {selectedFile.file_type === "video" ? (
                <video
                  src={selectedFile.file_url}
                  poster={selectedFile.thumbnail_url || undefined}
                  controls
                  playsInline
                  className="h-full w-full"
                />
              ) : (
                <img
                  src={selectedFile.file_url}
                  alt={selectedFile.file_name}
                  className="h-full w-full object-contain"
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="block text-muted-foreground">الحجم</span>
                <strong>{formatBytes(selectedFile.size_bytes)}</strong>
              </div>
              <div>
                <span className="block text-muted-foreground">النوع</span>
                <strong>{selectedFile.mime_type}</strong>
              </div>
              <div>
                <span className="block text-muted-foreground">المسار</span>
                <strong className="break-all text-[10px]">
                  {selectedFile.file_path}
                </strong>
              </div>
              <div>
                <span className="block text-muted-foreground">التاريخ</span>
                <strong>
                  {new Date(selectedFile.created_at).toLocaleDateString(
                    "ar-SA",
                  )}
                </strong>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    navigate({
                      to: "/admin/product/$id",
                      params: { id: "new" },
                      search: { media_ids: selectedFile.id },
                    })
                  }
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground"
                >
                  <PackagePlus className="h-3.5 w-3.5" />
                  إنشاء منتج
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleOpenAttachModal(selectedFile.id)
                  }
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white"
                >
                  <LinkIcon className="h-3.5 w-3.5" />
                  ربط بمنتج
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    void handleCopyUrl(
                      selectedFile.file_url,
                      selectedFile.id,
                    )
                  }
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-xs font-bold"
                >
                  {copiedId === selectedFile.id ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  نسخ الرابط
                </button>

                <button
                  type="button"
                  onClick={() =>
                    deleteMutation.mutate(selectedFile.id)
                  }
                  className="inline-flex items-center gap-1.5 rounded-xl bg-destructive/10 px-3 py-1.5 text-xs font-bold text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  حذف
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

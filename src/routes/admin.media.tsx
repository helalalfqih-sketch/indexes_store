import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Image as ImageIcon,
  Film,
  Upload,
  Search,
  Trash2,
  Copy,
  Check,
  Sparkles,
  Loader2,
  AlertCircle,
  MessageSquare,
  Bot,
  PlusCircle,
  PackagePlus,
  Link as LinkIcon,
  CheckSquare,
  Square,
  X,
  Package,
  FileCode,
} from "lucide-react";
import { toast } from "sonner";
import {
  listMediaFiles,
  recordMediaFile,
  deleteMediaFile,
  bulkDeleteMediaFiles,
  findUnusedMediaFiles,
  validateMediaFile,
  searchExistingProductsForLink,
  attachMediaToExistingProduct,
  type MediaFileRecord,
} from "@/lib/media.functions";

export const Route = createFileRoute("/admin/media")({
  head: () => ({
    meta: [
      { title: "مكتبة الوسائط — لوحة الإدارة" },
      { name: "description", content: "إدارة الصور والفيديوهات والوسائط في متجرك الإلكتروني." },
    ],
  }),
  component: AdminMediaComponent,
});

function VideoThumbnailCard({ url, posterUrl }: { url: string; posterUrl?: string | null }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [poster, setPoster] = useState<string | null>(posterUrl || null);

  const handleLoadedData = () => {
    if (poster || !videoRef.current) return;
    try {
      const v = videoRef.current;
      v.currentTime = 0.5;
      const canvas = document.createElement("canvas");
      canvas.width = v.videoWidth || 320;
      canvas.height = v.videoHeight || 240;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
        setPoster(canvas.toDataURL("image/jpeg", 0.8));
      }
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="relative h-full w-full bg-black flex items-center justify-center overflow-hidden">
      {poster ? (
        <img src={poster} alt="video thumbnail" className="h-full w-full object-cover" />
      ) : (
        <video
          ref={videoRef}
          src={url}
          muted
          playsInline
          preload="metadata"
          onLoadedData={handleLoadedData}
          className="h-full w-full object-cover"
        />
      )}
      <div className="absolute inset-0 bg-black/30 flex items-center justify-center pointer-events-none">
        <Film className="h-7 w-7 text-white drop-shadow-md" />
      </div>
    </div>
  );
}

function AdminMediaComponent() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const fetchMediaFn = useServerFn(listMediaFiles);
  const recordMediaFn = useServerFn(recordMediaFile);
  const deleteMediaFn = useServerFn(deleteMediaFile);
  const bulkDeleteMediaFn = useServerFn(bulkDeleteMediaFiles);
  const scanUnusedFn = useServerFn(findUnusedMediaFiles);
  const searchProductsFn = useServerFn(searchExistingProductsForLink);
  const attachMediaFn = useServerFn(attachMediaToExistingProduct);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "image" | "video">("all");
  const [filterSource, setFilterSource] = useState<"all" | "upload" | "whatsapp" | "ai_generated">(
    "all",
  );
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [sortOption, setSortOption] = useState<string>("newest");
  const [selectedFile, setSelectedFile] = useState<MediaFileRecord | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isScanningUnused, setIsScanningUnused] = useState(false);
  const [unusedFiles, setUnusedFiles] = useState<MediaFileRecord[] | null>(null);

  // Multi-select state
  const [selectedMediaIds, setSelectedMediaIds] = useState<string[]>([]);

  // Attach to existing product modal state
  const [isAttachModalOpen, setIsAttachModalOpen] = useState(false);
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [selectedTargetProductId, setSelectedTargetProductId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Query Media List
  const { data: mediaFiles = [], isLoading } = useQuery({
    queryKey: [
      "admin-media-files",
      searchTerm,
      filterType,
      filterSource,
      filterCategory,
      sortOption,
    ],
    queryFn: async () => {
      try {
        const res = await fetchMediaFn({
          data: {
            search: searchTerm,
            type: filterType,
            source: filterSource,
            category: filterCategory,
            sort: sortOption,
          },
        });
        return res || [];
      } catch (e) {
        console.warn("fetchMediaFn error, using fallback:", e);
        return [];
      }
    },
    retry: false,
    staleTime: 5000,
  });

  // Query existing products for linking modal
  const { data: targetProducts = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ["admin-target-products", productSearchQuery],
    queryFn: async () => {
      try {
        const res = await searchProductsFn({ data: { query: productSearchQuery } });
        return res || [];
      } catch (e) {
        console.warn("searchProductsFn error:", e);
        return [];
      }
    },
    enabled: isAttachModalOpen,
  });

  // Upload Mutation
  const uploadMutation = useMutation({
    mutationFn: (data: Parameters<typeof recordMediaFn>[0]["data"]) => recordMediaFn({ data }),
    onSuccess: () => {
      toast.success("تم رفع الوسيطة وتسجيلها بنجاح ✨");
      queryClient.invalidateQueries({ queryKey: ["admin-media-files"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "فشل تسجيل الملف");
    },
  });

  // Single Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteMediaFn({ data: { id } }),
    onSuccess: () => {
      toast.success("تم حذف الملف بنجاح");
      queryClient.invalidateQueries({ queryKey: ["admin-media-files"] });
      setSelectedFile(null);
    },
    onError: (err: Error) => {
      toast.error(err.message || "فشل حذف الملف");
    },
  });

  // Bulk Delete Mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => bulkDeleteMediaFn({ data: { ids } }),
    onSuccess: () => {
      toast.success(`تم حذف ${selectedMediaIds.length} ملف بنجاح`);
      queryClient.invalidateQueries({ queryKey: ["admin-media-files"] });
      setSelectedMediaIds([]);
    },
    onError: (err: Error) => {
      toast.error(err.message || "فشل حذف الملفات المحددة");
    },
  });

  // Attach Media Mutation
  const attachMutation = useMutation({
    mutationFn: ({ productId, mediaIds }: { productId: string; mediaIds: string[] }) =>
      attachMediaFn({ data: { productId, mediaIds } }),
    onSuccess: (res) => {
      toast.success(`تم ربط ودمج ${res.linkedCount} وسائط بالمنتج بنجاح! ✨`);
      queryClient.invalidateQueries({ queryKey: ["admin-media-files"] });
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      setIsAttachModalOpen(false);
      setSelectedTargetProductId(null);
      setSelectedMediaIds([]);
      setSelectedFile(null);
    },
    onError: (err: Error) => {
      toast.error(err.message || "فشل ربط الوسائط بالمنتج");
    },
  });

  const handleFileUpload = async (files: File[]) => {
    for (const file of files) {
      const val = validateMediaFile(file);
      if (!val.valid) {
        toast.error(val.error);
        continue;
      }

      const reader = new FileReader();
      reader.onload = async () => {
        const fileUrl = reader.result as string;
        const fileType = file.type.startsWith("video/") ? "video" : "image";

        uploadMutation.mutate({
          file_name: file.name,
          file_path: `media/${Date.now()}_${file.name}`,
          file_url: fileUrl,
          file_type: fileType,
          mime_type: file.type || "image/png",
          size_bytes: file.size,
          metadata: { source: "upload" },
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCopyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success("تم نسخ رابط الملف إلى الحافظة 📋");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleScanUnused = async () => {
    setIsScanningUnused(true);
    try {
      const unused = await scanUnusedFn();
      setUnusedFiles(unused);
      if (unused.length === 0) {
        toast.info("جميع الوسائط مستخدمة حالياً في المتجر 🎉");
      } else {
        toast.warning(`تم كشف ${unused.length} ملف غير مستخدم في المتجر.`);
      }
    } catch {
      toast.error("حدث خطأ أثناء فحص الملفات غير المستخدمة");
    } finally {
      setIsScanningUnused(false);
    }
  };

  // Selection handlers
  const toggleSelectMedia = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedMediaIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = () => {
    if (selectedMediaIds.length === mediaFiles.length) {
      setSelectedMediaIds([]);
    } else {
      setSelectedMediaIds(mediaFiles.map((m) => m.id));
    }
  };

  const handleCreateProductFromSelected = () => {
    if (selectedMediaIds.length === 0) return;
    const mediaIdsParam = selectedMediaIds.join(",");
    navigate({
      to: "/admin/product/$id",
      params: { id: "new" },
      search: { media_ids: mediaIdsParam },
    });
  };

  const handleOpenAttachModal = (singleMediaId?: string) => {
    if (singleMediaId && !selectedMediaIds.includes(singleMediaId)) {
      setSelectedMediaIds([singleMediaId]);
    }
    setIsAttachModalOpen(true);
  };

  const handleConfirmAttach = () => {
    if (!selectedTargetProductId) {
      toast.error("يرجى اختيار المنتج المراد ربط الوسائط به أولاً.");
      return;
    }
    const idsToAttach =
      selectedMediaIds.length > 0 ? selectedMediaIds : selectedFile ? [selectedFile.id] : [];
    if (idsToAttach.length === 0) return;

    attachMutation.mutate({
      productId: selectedTargetProductId,
      mediaIds: idsToAttach,
    });
  };

  return (
    <div className="space-y-6 font-sans pb-24" dir="rtl">
      {/* Header & Simplified Quick Action Buttons Bar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-border/60 pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2.5 text-foreground">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-xs">
              <ImageIcon className="h-5 w-5" />
            </div>
            مكتبة الوسائط
          </h1>
          <p className="mt-1 text-xs font-medium text-muted-foreground">
            إدارة صور وفيديوهات المنتجات والبنرات والوسائط المستوردة من الواتساب والذكاء الاصطناعي.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {mediaFiles.length > 0 && (
            <button
              type="button"
              onClick={toggleSelectAll}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-border bg-surface px-3 py-2 text-xs font-bold text-foreground hover:bg-accent transition"
            >
              {selectedMediaIds.length === mediaFiles.length ? (
                <CheckSquare className="h-4 w-4 text-primary" />
              ) : (
                <Square className="h-4 w-4 text-muted-foreground" />
              )}
              {selectedMediaIds.length === mediaFiles.length ? "إلغاء تحديد الكل" : "تحديد الكل"}
            </button>
          )}

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-md hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Upload className="h-4 w-4" />
            رفع وسائط جديدة
          </button>

          <Link
            to="/admin/integrations/whatsapp"
            className="inline-flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-all"
          >
            <MessageSquare className="h-4 w-4" />
            مزامنة الواتساب
          </Link>

          <Link
            to="/admin/diagnostics/whatsapp"
            className="inline-flex items-center gap-2 rounded-2xl border border-purple-500/30 bg-purple-500/10 px-3.5 py-2 text-xs font-bold text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 transition-all"
          >
            <FileCode className="h-4 w-4" />
            تشخيص الواتساب
          </Link>

          <button
            type="button"
            onClick={handleScanUnused}
            disabled={isScanningUnused}
            className="inline-flex items-center gap-2 rounded-2xl border border-border bg-surface px-3.5 py-2 text-xs font-bold text-foreground hover:bg-accent transition-all disabled:opacity-50"
            title="فحص الملفات التي لا ترتبط بأي منتج"
          >
            {isScanningUnused ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 text-amber-500" />
            )}
            فحص المهملات
          </button>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*"
            className="hidden"
            onChange={(e) => handleFileUpload(Array.from(e.target.files || []))}
          />
        </div>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFileUpload(Array.from(e.dataTransfer.files || []));
        }}
        onClick={() => fileInputRef.current?.click()}
        className="group relative cursor-pointer overflow-hidden rounded-3xl border-2 border-dashed border-border/80 bg-surface/40 p-5 text-center transition-all duration-200 hover:border-primary/60 hover:bg-primary/5 hover:shadow-xs"
      >
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
          <Upload className="h-5 w-5" />
        </div>
        <p className="mt-2 text-xs font-bold text-foreground">
          اسحب الصور أو الفيديوهات هنا، أو انقر للاختيار من جهازك مباشرة
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          يدعم الصور (JPG, PNG, WebP, SVG حتى 10MB) والفيديوهات (MP4, WebM حتى 50MB)
        </p>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="space-y-3 rounded-3xl border border-border/80 bg-surface p-4 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="ابحث باسم الملف أو الوسوم (#tags)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-2xl border border-border bg-background ps-9 pe-4 py-2 text-xs font-medium focus:outline-none focus:border-primary transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="rounded-2xl border border-border bg-background px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:border-primary"
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
              onChange={(e) => setSortOption(e.target.value)}
              className="rounded-2xl border border-border bg-background px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:border-primary"
            >
              <option value="newest">الأحدث إضافة ⏱️</option>
              <option value="oldest">الأقدم إضافة</option>
              <option value="seq_asc">رقم الإدخال (1 ➔ 99)</option>
              <option value="seq_desc">رقم الإدخال (99 ➔ 1)</option>
              <option value="name_asc">الاسم (أ - ي)</option>
              <option value="name_desc">الاسم (ي - أ)</option>
            </select>
          </div>
        </div>

        {/* Filter Pills (Media Types & Sources) */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/50 pt-3">
          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[11px] font-bold text-muted-foreground me-1 shrink-0">
              النوع:
            </span>
            {[
              { id: "all", label: "الكل" },
              { id: "image", label: "الصور 🖼️" },
              { id: "video", label: "الفيديوهات 🎥" },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setFilterType(t.id as any)}
                className={`rounded-xl px-3 py-1 text-xs font-bold transition shrink-0 ${
                  filterType === t.id
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-background text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[11px] font-bold text-muted-foreground me-1 shrink-0">
              المصدر:
            </span>
            {[
              { id: "all", label: "جميع المصادر" },
              { id: "upload", label: "مرفوع يدويًا" },
              { id: "whatsapp", label: "واتساب WhatsApp" },
              { id: "ai_generated", label: "ذكاء اصطناعي AI" },
            ].map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setFilterSource(s.id as any)}
                className={`rounded-xl px-3 py-1 text-xs font-bold transition shrink-0 ${
                  filterSource === s.id
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-background text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Unused Media Scanner Result Banner */}
      {unusedFiles && unusedFiles.length > 0 && (
        <div className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-xs font-bold text-amber-600 dark:text-amber-400">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>
              تم العثور على {unusedFiles.length} ملف غير مرتبط بأي منتج أو تصنيف في المتجر.
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              if (
                confirm(`هل أنت تأكد من حذف ${unusedFiles.length} ملف غير مستخدم لتوفير المساحة؟`)
              ) {
                unusedFiles.forEach((f) => deleteMutation.mutate(f.id));
                setUnusedFiles(null);
              }
            }}
            className="rounded-2xl bg-destructive px-3.5 py-1.5 text-xs font-bold text-destructive-foreground hover:bg-destructive/90 transition shadow-xs"
          >
            تنظيف الملفات المهملة
          </button>
        </div>
      )}

      {/* Media Files Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : mediaFiles.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-12 text-center bg-surface">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-primary/10 text-primary mb-3">
            <ImageIcon className="h-7 w-7" />
          </div>
          <h3 className="text-base font-bold text-foreground">لا توجد وسائط تطابق تصفيتك</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            قم برفع وسائط جديدة أو ربط WhatsApp Media Sync لاستقبال وسائط المنتجات تلقائياً.
          </p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90 transition"
          >
            <Upload className="h-4 w-4" /> رفع ملف الآن
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {mediaFiles.map((file, idx) => {
            const source = (file as any).source || (file as any).metadata?.source || "upload";
            const seqNumber = file.sequence_number || idx + 1;
            const isSelected = selectedMediaIds.includes(file.id);

            return (
              <div
                key={file.id}
                onClick={() => setSelectedFile(file)}
                className={`group relative cursor-pointer overflow-hidden rounded-3xl border transition duration-200 ${
                  isSelected
                    ? "border-primary bg-primary/5 ring-2 ring-primary/40 shadow-md"
                    : "border-border/80 bg-surface shadow-xs hover:border-primary/60 hover:shadow-md"
                }`}
              >
                {/* Top Badges Bar (Checkbox + Sequence + Source) */}
                <div className="absolute top-2.5 inset-x-2.5 z-10 flex items-center justify-between pointer-events-none">
                  {/* Checkbox for Multi Select */}
                  <div
                    onClick={(e) => toggleSelectMedia(file.id, e)}
                    className="pointer-events-auto cursor-pointer rounded-xl bg-background/90 p-1 shadow-md backdrop-blur-md hover:scale-110 transition"
                  >
                    {isSelected ? (
                      <CheckSquare className="h-4 w-4 text-primary fill-primary/20" />
                    ) : (
                      <Square className="h-4 w-4 text-muted-foreground hover:text-primary" />
                    )}
                  </div>

                  {/* Sequence Number Badge & Source */}
                  <div className="flex items-center gap-1">
                    <span className="bg-black/75 text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md shadow-xs backdrop-blur-md">
                      #{seqNumber}
                    </span>
                    {source === "whatsapp" && (
                      <span className="bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md shadow-xs backdrop-blur-md flex items-center gap-0.5">
                        <MessageSquare className="h-2 w-2" /> WA
                      </span>
                    )}
                    {source === "ai_generated" && (
                      <span className="bg-purple-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md shadow-xs backdrop-blur-md flex items-center gap-0.5">
                        <Bot className="h-2 w-2" /> AI
                      </span>
                    )}
                  </div>
                </div>

                <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden relative">
                  {file.file_type === "video" ? (
                    <VideoThumbnailCard url={file.file_url} posterUrl={file.thumbnail_url} />
                  ) : (
                    <img
                      src={file.file_url}
                      alt={file.file_name}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      loading="lazy"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='1.5'><rect width='18' height='18' x='3' y='3' rx='2'/><circle cx='8.5' cy='8.5' r='1.5'/><path d='m21 15-5-5-11 11'/></svg>";
                      }}
                    />
                  )}
                </div>

                <div className="p-2.5 text-xs space-y-1">
                  <p className="font-bold truncate text-foreground">{file.file_name}</p>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>{(file.size_bytes / (1024 * 1024)).toFixed(2)} MB</span>
                    {((file.metadata as any)?.category as string) && (
                      <span className="font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded text-[9px]">
                        {(file.metadata as any).category as string}
                      </span>
                    )}
                  </div>
                  {Array.isArray((file.metadata as any)?.tags) &&
                    ((file.metadata as any).tags as string[]).length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {((file.metadata as any).tags as string[]).slice(0, 3).map((tag, idx) => (
                          <span
                            key={idx}
                            className="bg-accent text-muted-foreground text-[9px] px-1.5 py-0.5 rounded font-mono"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Multi-Select Action Bar */}
      {selectedMediaIds.length > 0 && (
        <div className="fixed bottom-6 inset-x-4 z-40 max-w-2xl mx-auto rounded-3xl bg-foreground text-background p-3.5 shadow-2xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-5 border border-border/40">
          <div className="flex items-center gap-2.5 ps-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-primary text-primary-foreground font-black text-xs">
              {selectedMediaIds.length}
            </span>
            <span className="text-xs font-bold">تم تحديد {selectedMediaIds.length} ملفات</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCreateProductFromSelected}
              className="inline-flex items-center gap-1.5 rounded-2xl bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition shadow-xs"
            >
              <PackagePlus className="h-4 w-4" />
              إنشاء منتج جديد
            </button>

            <button
              type="button"
              onClick={() => handleOpenAttachModal()}
              className="inline-flex items-center gap-1.5 rounded-2xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-xs"
            >
              <LinkIcon className="h-4 w-4" />
              ربط بمنتج موجود
            </button>

            <button
              type="button"
              onClick={() => {
                if (confirm(`هل أنت تأكد من حذف ${selectedMediaIds.length} ملفات وسائط محددة؟`)) {
                  bulkDeleteMutation.mutate(selectedMediaIds);
                }
              }}
              disabled={bulkDeleteMutation.isPending}
              className="inline-flex items-center gap-1.5 rounded-2xl bg-destructive/80 px-3 py-2 text-xs font-bold text-destructive-foreground hover:bg-destructive transition"
            >
              {bulkDeleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              حذف
            </button>

            <button
              type="button"
              onClick={() => setSelectedMediaIds([])}
              className="rounded-xl p-1.5 text-background/70 hover:bg-background/20 transition"
              title="إلغاء التحديد"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modal: Attach to Existing Product */}
      {isAttachModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4"
          dir="rtl"
        >
          <div className="w-full max-w-lg rounded-3xl bg-surface border border-border p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <LinkIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    دمج الوسائط بمنتج موجود بالمتجر
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    سيتم إضافة الوسائط المحددة ({selectedMediaIds.length || 1} ملفات) لمعرض
                    صور/فيديو المنتج.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAttachModalOpen(false);
                  setSelectedTargetProductId(null);
                }}
                className="rounded-xl p-1 text-muted-foreground hover:bg-accent"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Search Input for Products */}
            <div className="relative">
              <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="ابحث باسم المنتج المراد الدمج به..."
                value={productSearchQuery}
                onChange={(e) => setProductSearchQuery(e.target.value)}
                className="w-full rounded-2xl border border-border bg-background ps-9 pe-4 py-2.5 text-xs font-medium focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            {/* Products List */}
            <div className="max-h-64 overflow-y-auto space-y-2 pe-1 border border-border/50 rounded-2xl p-2 bg-background/50">
              {isLoadingProducts ? (
                <div className="py-8 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-emerald-500" /> جاري البحث في
                  المنتجات...
                </div>
              ) : targetProducts.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  لا توجد منتجات تطابق كلمة البحث
                </div>
              ) : (
                targetProducts.map((product: any) => {
                  const isSelected = selectedTargetProductId === product.id;
                  const thumb =
                    Array.isArray(product.images) && product.images[0] ? product.images[0] : null;

                  return (
                    <div
                      key={product.id}
                      onClick={() => setSelectedTargetProductId(product.id)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition ${
                        isSelected
                          ? "border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500"
                          : "border-border/60 bg-surface hover:bg-accent"
                      }`}
                    >
                      <div className="flex items-center gap-3 truncate">
                        <div className="h-10 w-10 rounded-lg bg-muted overflow-hidden shrink-0 flex items-center justify-center border border-border/40">
                          {thumb ? (
                            <img src={thumb} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <Package className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-bold text-foreground truncate">
                            {product.name}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {product.price} {product.currency || "YER"}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {isSelected ? (
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white text-xs">
                            ✓
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground font-bold px-2 py-1 rounded-lg border border-border">
                            تحديد
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between border-t border-border pt-3">
              <button
                type="button"
                onClick={() => {
                  setIsAttachModalOpen(false);
                  setSelectedTargetProductId(null);
                }}
                className="rounded-xl px-4 py-2 text-xs font-bold text-muted-foreground hover:bg-accent transition"
              >
                إلغاء
              </button>

              <button
                type="button"
                onClick={handleConfirmAttach}
                disabled={!selectedTargetProductId || attachMutation.isPending}
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-700 transition disabled:opacity-50"
              >
                {attachMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LinkIcon className="h-4 w-4" />
                )}
                دمج وربط الوسائط بالمنتج
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Selected File Detail Modal Drawer */}
      {selectedFile && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          dir="rtl"
        >
          <div className="w-full max-w-xl rounded-3xl bg-surface border border-border p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2 truncate">
                <span className="bg-black/80 text-white text-xs font-mono font-bold px-2 py-0.5 rounded-md">
                  #{selectedFile.sequence_number || 1}
                </span>
                <h3 className="text-base font-bold truncate">{selectedFile.file_name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFile(null)}
                className="rounded-xl p-1 text-muted-foreground hover:bg-accent"
              >
                ✕
              </button>
            </div>

            <div className="aspect-video bg-black rounded-2xl overflow-hidden flex items-center justify-center">
              {selectedFile.file_type === "video" ? (
                <video src={selectedFile.file_url} controls className="h-full w-full" />
              ) : (
                <img
                  src={selectedFile.file_url}
                  alt={selectedFile.file_name}
                  className="h-full w-full object-contain"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop";
                  }}
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs border-t border-border pt-3">
              <div>
                <span className="text-muted-foreground block">رقم الإدخال:</span>
                <span className="font-bold font-mono">#{selectedFile.sequence_number || 1}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">الحجم:</span>
                <span className="font-bold">
                  {((selectedFile.size_bytes || 0) / (1024 * 1024)).toFixed(2)} MB
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">نوع الملف:</span>
                <span className="font-bold">{selectedFile.mime_type}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">تاريخ الإضافة:</span>
                <span className="font-bold">
                  {new Date(selectedFile.created_at).toLocaleDateString("ar-SA")}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-border pt-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigate({
                      to: "/admin/product/$id",
                      params: { id: "new" },
                      search: { media_ids: selectedFile.id },
                    });
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90 transition"
                >
                  <PackagePlus className="h-3.5 w-3.5" />
                  إنشاء منتج جديد
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenAttachModal(selectedFile.id)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition"
                >
                  <LinkIcon className="h-3.5 w-3.5" />
                  دمج بمنتج موجود
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyUrl(selectedFile.file_url, selectedFile.id)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-bold text-foreground hover:bg-accent transition"
                >
                  {copiedId === selectedFile.id ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  {copiedId === selectedFile.id ? "تم النسخ" : "نسخ الرابط"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (confirm("هل أنت تأكد من حذف هذا الملف نهائياً من المكتبة؟")) {
                      deleteMutation.mutate(selectedFile.id);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-destructive/10 px-3 py-1.5 text-xs font-bold text-destructive hover:bg-destructive/20 transition"
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

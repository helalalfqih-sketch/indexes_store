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
} from "lucide-react";
import { toast } from "sonner";
import {
  listMediaFiles,
  recordMediaFile,
  deleteMediaFile,
  findUnusedMediaFiles,
  validateMediaFile,
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

function AdminMediaComponent() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const fetchMediaFn = useServerFn(listMediaFiles);
  const recordMediaFn = useServerFn(recordMediaFile);
  const deleteMediaFn = useServerFn(deleteMediaFile);
  const scanUnusedFn = useServerFn(findUnusedMediaFiles);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "image" | "video">("all");
  const [filterSource, setFilterSource] = useState<"all" | "upload" | "whatsapp" | "ai_generated">("all");
  const [selectedFile, setSelectedFile] = useState<MediaFileRecord | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isScanningUnused, setIsScanningUnused] = useState(false);
  const [unusedFiles, setUnusedFiles] = useState<MediaFileRecord[] | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Query Media List
  const { data: mediaFiles = [], isLoading } = useQuery({
    queryKey: ["admin-media-files", searchTerm, filterType, filterSource],
    queryFn: () => fetchMediaFn({ data: { search: searchTerm, type: filterType, source: filterSource } }),
  });

  // Upload Mutation
  const uploadMutation = useMutation({
    mutationFn: (data: Parameters<typeof recordMediaFn>[0]["data"]) => recordMediaFn({ data }),
    onSuccess: () => {
      toast.success("تم رفع وسيلة الإعلام وتنصيبها بنجاح ✨");
      queryClient.invalidateQueries({ queryKey: ["admin-media-files"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "فشل تسجيل الملف");
    },
  });

  // Delete Mutation
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

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <ImageIcon className="h-7 w-7 text-primary" />
            مكتبة الوسائط (Media Library)
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            إدارة صور المنتجات، فيديوهات العرض، بنرات واجهة المتجر والوسائط المستوردة من الواتساب.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/admin/integrations/whatsapp"
            className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition"
          >
            <MessageSquare className="h-4 w-4" />
            مزامنة الواتساب (WhatsApp Sync)
          </Link>

          <button
            onClick={handleScanUnused}
            disabled={isScanningUnused}
            className="flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-xs font-bold transition hover:bg-accent disabled:opacity-50"
          >
            {isScanningUnused ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-warning" />}
            فحص الملفات غير المستخدمة
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground transition hover:bg-primary/90 shadow-brand"
          >
            <Upload className="h-4 w-4" />
            رفع وسائط
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
        className="rounded-2xl border-2 border-dashed border-border/80 bg-surface/50 p-6 text-center cursor-pointer hover:bg-muted/10 hover:border-primary transition group"
      >
        <Upload className="mx-auto h-8 w-8 text-muted-foreground group-hover:text-primary transition" />
        <p className="mt-2 text-sm font-bold text-foreground">
          اسحب الصور أو الفيديوهات هنا، أو انقر للاختيار من الجهاز
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          يدعم الصور (JPG, PNG, WebP, SVG حتى 10MB) والفيديوهات (MP4, WebM حتى 50MB)
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between bg-surface border border-border p-4 rounded-2xl shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="ابحث باسم الملف..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-border bg-background ps-9 pe-4 py-2 text-sm focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* File Type Filter */}
          <div className="flex items-center gap-1 bg-background p-1 rounded-xl border border-border">
            {(["all", "image", "video"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                  filterType === t
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent"
                }`}
              >
                {t === "all" ? "الكل" : t === "image" ? "الصور 🖼️" : "الفيديوهات 🎥"}
              </button>
            ))}
          </div>

          {/* Source Filter */}
          <div className="flex items-center gap-1 bg-background p-1 rounded-xl border border-border">
            {[
              { id: "all", label: "جميع المصادر" },
              { id: "upload", label: "مرفوع يدويًا" },
              { id: "whatsapp", label: "واتساب WhatsApp" },
              { id: "ai_generated", label: "ذكاء اصطناعي AI" },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => setFilterSource(s.id as any)}
                className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                  filterSource === s.id
                    ? "bg-emerald-600 text-white"
                    : "text-muted-foreground hover:bg-accent"
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
        <div className="rounded-2xl border border-warning/40 bg-warning/10 p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-xs font-bold text-warning-foreground">
            <AlertCircle className="h-5 w-5 shrink-0 text-warning" />
            <span>تم العثور على {unusedFiles.length} ملف غير مرتبط بأي منتج أو تصنيف في المتجر.</span>
          </div>
          <button
            onClick={() => {
              if (confirm(`هل أنت تأكد من حذف ${unusedFiles.length} ملف غير مستخدم لتوفير المساحة؟`)) {
                unusedFiles.forEach((f) => deleteMutation.mutate(f.id));
                setUnusedFiles(null);
              }
            }}
            className="rounded-xl bg-destructive px-3.5 py-1.5 text-xs font-bold text-destructive-foreground hover:bg-destructive/90"
          >
            تنظيف الملفات غير المستخدمة
          </button>
        </div>
      )}

      {/* Media Files Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : mediaFiles.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center bg-surface">
          <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-3 text-lg font-bold">لا توجد وسائط طابق تصفيتك</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            قم برفع وسائط جديدة أو ربط WhatsApp Media Sync لاستقبال وسائط المنتجات تلقائياً.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {mediaFiles.map((file) => {
            const source = (file as any).metadata?.source || "upload";
            return (
              <div
                key={file.id}
                onClick={() => setSelectedFile(file)}
                className="group relative cursor-pointer overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition hover:border-primary/60 hover:shadow-md"
              >
                {/* Source Badge overlay */}
                <div className="absolute top-2 start-2 z-10">
                  {source === "whatsapp" && (
                    <span className="flex items-center gap-1 bg-emerald-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-md shadow-sm">
                      <MessageSquare className="h-2.5 w-2.5" /> WhatsApp
                    </span>
                  )}
                  {source === "ai_generated" && (
                    <span className="flex items-center gap-1 bg-purple-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-md shadow-sm">
                      <Bot className="h-2.5 w-2.5" /> AI
                    </span>
                  )}
                  {source === "upload" && (
                    <span className="bg-background/80 backdrop-blur-sm text-foreground text-[9px] font-bold px-2 py-0.5 rounded-md border border-border/50">
                      Upload
                    </span>
                  )}
                </div>

                <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden">
                  {file.file_type === "video" ? (
                    <div className="relative h-full w-full bg-black flex items-center justify-center">
                      <Film className="h-8 w-8 text-white/80" />
                    </div>
                  ) : (
                    <img
                      src={file.file_url}
                      alt={file.file_name}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      loading="lazy"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.opacity = "0.3";
                      }}
                    />
                  )}
                </div>

                <div className="p-2.5 text-xs">
                  <p className="font-bold truncate text-foreground">{file.file_name}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {(file.size_bytes / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Selected File Detail Modal Drawer */}
      {selectedFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-showcase/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-3xl bg-surface border border-border p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2 truncate">
                <h3 className="text-base font-bold truncate">{selectedFile.file_name}</h3>
                {((selectedFile as any).metadata?.source === "whatsapp") && (
                  <span className="bg-emerald-500/10 text-emerald-500 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                    <MessageSquare className="h-3 w-3" /> WhatsApp Media
                  </span>
                )}
              </div>
              <button
                onClick={() => setSelectedFile(null)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-accent"
              >
                ✕
              </button>
            </div>

            <div className="aspect-video bg-black rounded-2xl overflow-hidden flex items-center justify-center">
              {selectedFile.file_type === "video" ? (
                <video src={selectedFile.file_url} controls className="h-full w-full" />
              ) : (
                <img src={selectedFile.file_url} alt="" className="h-full w-full object-contain" />
              )}
            </div>

            {/* AI Suggestion Box if imported from WhatsApp */}
            {(selectedFile as any).metadata?.ai_suggestion && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-500 flex items-center gap-1">
                    <Bot className="h-4 w-4" /> اقتراح الذكاء الاصطناعي للمنتج
                  </span>
                  <button
                    onClick={() => navigate({ to: "/admin/products" })}
                    className="flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-700 transition"
                  >
                    <PlusCircle className="h-3 w-3" /> تحويل إلى منتج
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2 bg-background p-2 rounded-lg border border-border">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">الاسم:</span>
                    <span className="font-bold text-foreground truncate block">
                      {(selectedFile as any).metadata.ai_suggestion.title}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">التصنيف:</span>
                    <span className="font-bold text-primary truncate block">
                      {(selectedFile as any).metadata.ai_suggestion.category}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">السعر التقديري:</span>
                    <span className="font-bold text-emerald-500 truncate block">
                      {(selectedFile as any).metadata.ai_suggestion.price} YER
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-xs border-t border-b border-border/60 py-3">
              <div>
                <span className="text-muted-foreground">نوع الملف:</span>{" "}
                <span className="font-bold text-foreground">{selectedFile.mime_type}</span>
              </div>
              <div>
                <span className="text-muted-foreground">الحجم:</span>{" "}
                <span className="font-bold text-foreground">
                  {(selectedFile.size_bytes / (1024 * 1024)).toFixed(2)} MB
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">المصدر:</span>{" "}
                <span className="font-bold text-foreground">
                  {(selectedFile as any).metadata?.source || "Upload"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">تاريخ الاستيراد:</span>{" "}
                <span className="font-bold text-foreground">
                  {new Date(selectedFile.created_at).toLocaleDateString("ar-YE")}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2">
              <button
                onClick={() => {
                  if (confirm(`هل أنت تأكد من حذف ملف "${selectedFile.file_name}"؟`)) {
                    deleteMutation.mutate(selectedFile.id);
                  }
                }}
                className="flex items-center gap-1.5 rounded-xl bg-destructive/10 px-4 py-2 text-xs font-bold text-destructive hover:bg-destructive/20"
              >
                <Trash2 className="h-4 w-4" /> حذف الملف
              </button>

              <button
                onClick={() => handleCopyUrl(selectedFile.file_url, selectedFile.id)}
                className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90"
              >
                {copiedId === selectedFile.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                نسخ رابط الملف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

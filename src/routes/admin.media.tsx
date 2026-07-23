import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, type DragEvent } from "react";
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
  ExternalLink,
  Loader2,
  FileSpreadsheet,
  AlertCircle,
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
  const fetchMediaFn = useServerFn(listMediaFiles);
  const recordMediaFn = useServerFn(recordMediaFile);
  const deleteMediaFn = useServerFn(deleteMediaFile);
  const scanUnusedFn = useServerFn(findUnusedMediaFiles);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "image" | "video">("all");
  const [selectedFile, setSelectedFile] = useState<MediaFileRecord | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isScanningUnused, setIsScanningUnused] = useState(false);
  const [unusedFiles, setUnusedFiles] = useState<MediaFileRecord[] | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Query Media List
  const { data: mediaFiles = [], isLoading } = useQuery({
    queryKey: ["admin-media-files", searchTerm, filterType],
    queryFn: () => fetchMediaFn({ data: { search: searchTerm, type: filterType } }),
  });

  // Upload Mutation (Simulates or uploads base64/URL payload to media_files registry)
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

      // Convert file to Base64/DataURL for immediate storage or bucket URL
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
            إدارة صور المنتجات، فيديوهات العرض، بنرات واجهة المتجر والملفات.
          </p>
        </div>

        <div className="flex items-center gap-2">
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-surface border border-border p-4 rounded-2xl shadow-sm">
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
        <div className="flex items-center gap-2">
          {(["all", "image", "video"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                filterType === t
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              {t === "all" ? "جميع الوسائط" : t === "image" ? "الصور 🖼️" : "الفيديوهات 🎥"}
            </button>
          ))}
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
          <h3 className="mt-3 text-lg font-bold">لا توجد وسائط في المكتبة</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            قم برفع أول صورة أو فيديو لعرضها وإدارتها في متجرك.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {mediaFiles.map((file) => (
            <div
              key={file.id}
              onClick={() => setSelectedFile(file)}
              className="group relative cursor-pointer overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition hover:border-primary/60 hover:shadow-md"
            >
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
          ))}
        </div>
      )}

      {/* Selected File Detail Modal Drawer */}
      {selectedFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-showcase/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-3xl bg-surface border border-border p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold truncate">{selectedFile.file_name}</h3>
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
                <span className="text-muted-foreground">تاريخ الرفع:</span>{" "}
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
                نسخ رابط الرابط العمومي
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useRef, type DragEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Upload,
  Image as ImageIcon,
  Film,
  Trash2,
  FolderOpen,
  Check,
  Plus,
  Loader2,
  ExternalLink,
  X,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import {
  listMediaFiles,
  recordMediaFile,
  validateMediaFile,
  type MediaFileRecord,
} from "@/lib/media.functions";

interface MediaUploaderProps {
  label?: string;
  value?: string | string[];
  onChange: (val: any) => void;
  mediaType?: "image" | "video" | "all";
  multiple?: boolean;
  className?: string;
  hint?: string;
}

export function MediaUploader({
  label,
  value,
  onChange,
  mediaType = "all",
  multiple = false,
  className = "",
  hint,
}: MediaUploaderProps) {
  const queryClient = useQueryClient();
  const listMediaFn = useServerFn(listMediaFiles);
  const recordMediaFn = useServerFn(recordMediaFile);

  const [isUploading, setIsUploading] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [libraryFilter, setLibraryFilter] = useState<"all" | "image" | "video">(
    mediaType === "all" ? "all" : mediaType
  );
  const [librarySearch, setLibrarySearch] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Values normalized to array
  const currentValues: string[] = Array.isArray(value)
    ? value.filter(Boolean)
    : value
    ? [value]
    : [];

  // Query media library items for modal picker
  const { data: libraryFiles = [], isLoading: isLoadingLibrary } = useQuery({
    queryKey: ["media-uploader-library", librarySearch, libraryFilter],
    queryFn: () => listMediaFn({ data: { search: librarySearch, type: libraryFilter } }),
    enabled: isLibraryOpen,
  });

  const uploadRecordMut = useMutation({
    mutationFn: (data: Parameters<typeof recordMediaFn>[0]["data"]) => recordMediaFn({ data }),
    onSuccess: (newRecord) => {
      queryClient.invalidateQueries({ queryKey: ["admin-media-files"] });
      queryClient.invalidateQueries({ queryKey: ["media-uploader-library"] });
      if (multiple) {
        onChange([...currentValues, newRecord.file_url]);
      } else {
        onChange(newRecord.file_url);
      }
      toast.success("تم رفع الملف وتسجيله في مكتبة الوسائط بنجاح ✨");
    },
    onError: (err: Error) => {
      toast.error(err.message || "حدث خطأ أثناء رفع الملف");
    },
    onSettled: () => {
      setIsUploading(false);
    },
  });

  const handleProcessFiles = async (files: File[]) => {
    if (files.length === 0) return;
    setIsUploading(true);

    for (const file of files) {
      const val = validateMediaFile(file);
      if (!val.valid) {
        toast.error(val.error);
        setIsUploading(false);
        return;
      }

      const reader = new FileReader();
      reader.onload = async () => {
        const fileUrl = reader.result as string;
        const detectedType = file.type.startsWith("video/") ? "video" : "image";

        uploadRecordMut.mutate({
          file_name: file.name,
          file_path: `media/${Date.now()}_${file.name}`,
          file_url: fileUrl,
          file_type: detectedType,
          mime_type: file.type || "image/png",
          size_bytes: file.size,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveUrl = (indexToRemove: number) => {
    if (multiple) {
      const updated = currentValues.filter((_, idx) => idx !== indexToRemove);
      onChange(updated);
    } else {
      onChange("");
    }
  };

  const handleSelectFromLibrary = (fileUrl: string) => {
    if (multiple) {
      if (!currentValues.includes(fileUrl)) {
        onChange([...currentValues, fileUrl]);
      }
    } else {
      onChange(fileUrl);
      setIsLibraryOpen(false);
    }
    toast.success("تم اختيار الوسيطة من المكتبة 🎨");
  };

  return (
    <div className={`space-y-2 font-sans ${className}`} dir="rtl">
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-foreground">{label}</label>
          {hint && <span className="text-[10px] text-muted-foreground">{hint}</span>}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        accept={
          mediaType === "image"
            ? "image/*"
            : mediaType === "video"
            ? "video/*"
            : "image/*,video/*"
        }
        className="hidden"
        onChange={(e) => handleProcessFiles(Array.from(e.target.files || []))}
      />

      {/* Upload & Pick Drop Zone / Buttons */}
      <div className="space-y-3">
        {currentValues.length > 0 ? (
          <div className="space-y-2">
            <div
              className={`grid gap-3 ${
                multiple
                  ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4"
                  : "grid-cols-1"
              }`}
            >
              {currentValues.map((url, idx) => {
                const isVideo = url.endsWith(".mp4") || url.endsWith(".webm") || url.includes("video");

                return (
                  <div
                    key={idx}
                    className="group relative overflow-hidden rounded-2xl border border-border bg-surface p-2 shadow-sm transition hover:border-primary/50"
                  >
                    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black/10 flex items-center justify-center">
                      {isVideo ? (
                        <video src={url} className="h-full w-full object-cover" />
                      ) : (
                        <img
                          src={url}
                          alt="Preview"
                          className="h-full w-full object-cover transition group-hover:scale-105"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src =
                              "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80";
                          }}
                        />
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg bg-white/20 p-1.5 text-white backdrop-blur hover:bg-white/40 transition"
                          title="فتح في نافذة جديدة"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                        <button
                          type="button"
                          onClick={() => handleRemoveUrl(idx)}
                          className="rounded-lg bg-destructive/80 p-1.5 text-white backdrop-blur hover:bg-destructive transition"
                          title="حذف"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Action Bar when values exist */}
            <div className="flex items-center gap-2 pt-1">
              {multiple && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-bold text-foreground hover:bg-accent transition disabled:opacity-50"
                >
                  <Plus className="h-3.5 w-3.5" /> إضافة المزيد
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsLibraryOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/20 transition"
              >
                <FolderOpen className="h-3.5 w-3.5" /> مكتبة الوسائط
              </button>
              {!multiple && currentValues.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleRemoveUrl(0)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-destructive/10 px-3 py-1.5 text-xs font-bold text-destructive hover:bg-destructive/20 transition"
                >
                  <Trash2 className="h-3.5 w-3.5" /> حذف
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Empty State / Drag Zone */
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handleProcessFiles(Array.from(e.dataTransfer.files || []));
            }}
            className="relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/80 bg-background/50 p-6 text-center transition-all hover:border-primary/50 hover:bg-background"
          >
            {isUploading ? (
              <div className="flex flex-col items-center gap-2 py-3">
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
                <span className="text-xs font-bold text-primary">جاري رفع الملفات إلى الوسائط...</span>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  {mediaType === "video" ? <Film className="h-5 w-5" /> : <Upload className="h-5 w-5" />}
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">
                    اسحب ملفك هنا، أو انقر للاختيار من الجهاز
                  </p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    {mediaType === "video"
                      ? "يدعم الفيديوهات (MP4, WebM حتى 50MB)"
                      : mediaType === "image"
                      ? "يدعم الصور (JPG, PNG, WebP, SVG حتى 10MB)"
                      : "يدعم الصور والفيديوهات والبنرات"}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition"
                  >
                    <Upload className="h-3.5 w-3.5" /> رفع من الجهاز
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsLibraryOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3.5 py-1.5 text-xs font-bold text-foreground hover:bg-accent transition"
                  >
                    <FolderOpen className="h-3.5 w-3.5 text-primary" /> اختيار من المكتبة
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Media Library Picker Modal Drawer */}
      {isLibraryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-showcase/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-3xl rounded-3xl border border-border bg-surface p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-primary" />
                <h3 className="text-base font-bold text-foreground">اختيار وسيطة من مكتبة المتجر</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsLibraryOpen(false)}
                className="rounded-xl p-1 text-muted-foreground hover:bg-accent"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Filter Bar */}
            <div className="flex items-center justify-between gap-3 shrink-0">
              <input
                type="text"
                placeholder="ابحث باسم الملف..."
                value={librarySearch}
                onChange={(e) => setLibrarySearch(e.target.value)}
                className="w-full max-w-xs rounded-xl border border-border bg-background px-3 py-1.5 text-xs focus:outline-none focus:border-primary"
              />
              <div className="flex items-center gap-1">
                {(["all", "image", "video"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setLibraryFilter(t)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                      libraryFilter === t
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    {t === "all" ? "الكل" : t === "image" ? "الصور" : "الفيديو"}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid View */}
            <div className="flex-1 overflow-y-auto min-h-[300px] scrollbar-thin">
              {isLoadingLibrary ? (
                <div className="flex h-48 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : libraryFiles.length === 0 ? (
                <div className="flex h-48 flex-col items-center justify-center text-center text-muted-foreground">
                  <ImageIcon className="h-10 w-10 text-muted-foreground/40 mb-2" />
                  <p className="text-xs font-bold">لا توجد وسائط مطابقة في المكتبة</p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-3 text-xs text-primary font-bold hover:underline"
                  >
                    + رفع وسيطة جديدة الآن
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 p-1">
                  {libraryFiles.map((file) => {
                    const isSelected = currentValues.includes(file.file_url);

                    return (
                      <div
                        key={file.id}
                        onClick={() => handleSelectFromLibrary(file.file_url)}
                        className={`group relative aspect-square cursor-pointer overflow-hidden rounded-2xl border transition ${
                          isSelected
                            ? "border-primary ring-2 ring-primary/40 bg-primary/5"
                            : "border-border bg-background hover:border-primary/60"
                        }`}
                      >
                        {file.file_type === "video" ? (
                          <div className="h-full w-full bg-black flex items-center justify-center text-white">
                            <Film className="h-6 w-6" />
                          </div>
                        ) : (
                          <img
                            src={file.file_url}
                            alt={file.file_name}
                            className="h-full w-full object-cover transition group-hover:scale-105"
                          />
                        )}
                        {isSelected && (
                          <div className="absolute top-1.5 start-1.5 rounded-full bg-primary p-1 text-white shadow-sm">
                            <Check className="h-3 w-3" />
                          </div>
                        )}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1.5 text-[9px] text-white font-bold truncate">
                          {file.file_name}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-border pt-3 shrink-0">
              <span className="text-xs text-muted-foreground font-bold">
                إجمالي الملفات: {libraryFiles.length}
              </span>
              <button
                type="button"
                onClick={() => setIsLibraryOpen(false)}
                className="rounded-xl border border-border px-4 py-1.5 text-xs font-bold text-foreground hover:bg-accent"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  MessageSquare,
  RefreshCw,
  Film,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Loader2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  FileCode,
} from "lucide-react";
import { toast } from "sonner";
import {
  getWhatsAppDiagnosticsMedia,
  updateMediaFileThumbnail,
  backfillVideoThumbnails,
  type MediaFileRecord,
} from "@/lib/media.functions";

export const Route = createFileRoute("/admin/diagnostics/whatsapp")({
  head: () => ({
    meta: [{ title: "WhatsApp Media Diagnostics — لوحة الإدارة" }],
  }),
  component: WhatsAppDiagnosticsComponent,
});

function WhatsAppDiagnosticsComponent() {
  const queryClient = useQueryClient();
  const getDiagnosticsFn = useServerFn(getWhatsAppDiagnosticsMedia);
  const updateThumbnailFn = useServerFn(updateMediaFileThumbnail);
  const backfillThumbnailsFn = useServerFn(backfillVideoThumbnails);

  const [isBackfilling, setIsBackfilling] = useState(false);
  const [backfillProgress, setBackfillProgress] = useState<string>("");

  const {
    data: mediaList = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ["admin-whatsapp-diagnostics"],
    queryFn: () => getDiagnosticsFn(),
    staleTime: 5000,
  });

  // Client-side Video Frame Generator helper to process videos missing thumbnails
  const processVideoFrame = async (videoUrl: string): Promise<string | null> => {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      video.crossOrigin = "anonymous";
      video.src = videoUrl;
      video.currentTime = 0.5;

      video.onloadeddata = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = video.videoWidth || 320;
          canvas.height = video.videoHeight || 240;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL("image/jpeg", 0.8));
          } else {
            resolve(null);
          }
        } catch {
          resolve(null);
        }
      };

      video.onerror = () => resolve(null);
    });
  };

  const handleRunBackfill = async () => {
    setIsBackfilling(true);
    setBackfillProgress("جاري فحص الفيديوهات غير المعالجة...");
    try {
      const res = await backfillThumbnailsFn();
      if (res.count === 0) {
        toast.success("جميع الفيديوهات تحتوي على صور مصغرة (Thumbnails) بالفعل 🎉");
        setIsBackfilling(false);
        setBackfillProgress("");
        return;
      }

      setBackfillProgress(`تم كشف ${res.count} فيديو يحتاج معالجة إطار صورة مصغرة...`);
      let processed = 0;

      for (const vid of res.videos) {
        const frameDataUri = await processVideoFrame(vid.file_url);
        if (frameDataUri) {
          await updateThumbnailFn({ data: { mediaId: vid.id, thumbnailUrl: frameDataUri } });
          processed++;
        }
      }

      toast.success(`تم استخلاص وحفظ ${processed} صور مصغرة للفيديوهات بنجاح ✨`);
      queryClient.invalidateQueries({ queryKey: ["admin-whatsapp-diagnostics"] });
      queryClient.invalidateQueries({ queryKey: ["admin-media-files"] });
    } catch (e: any) {
      toast.error(e.message || "حدث خطأ أثناء معالجة الفيديوهات");
    } finally {
      setIsBackfilling(false);
      setBackfillProgress("");
    }
  };

  return (
    <div className="space-y-6 font-sans pb-24" dir="rtl">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b border-border/60 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground mb-1">
            <Link
              to="/admin/media"
              className="hover:text-primary transition flex items-center gap-1"
            >
              <ArrowRight className="h-3.5 w-3.5" /> مكتبة الوسائط
            </Link>
            <span>/</span>
            <span className="text-foreground">تشخيص مزامنة الواتساب</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2.5 text-foreground">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-xs">
              <MessageSquare className="h-5 w-5" />
            </div>
            تشخيص وسائط WhatsApp Media Sync
          </h1>
          <p className="mt-1 text-xs font-medium text-muted-foreground">
            لوحة الفحص الفني والتدقيق لآخر 50 ملف وسائط مستوردة عبر Meta Graph API v25.0 و WhatsApp
            WABA.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="inline-flex items-center gap-1.5 rounded-2xl border border-border bg-surface px-3.5 py-2 text-xs font-bold text-foreground hover:bg-accent transition"
          >
            <RefreshCw className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />
            تحديث البيانات
          </button>

          <button
            type="button"
            onClick={handleRunBackfill}
            disabled={isBackfilling}
            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-700 transition disabled:opacity-50"
          >
            {isBackfilling ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            معالجة بوسترات الفيديوهات القديمة (Backfill)
          </button>
        </div>
      </div>

      {/* Backfill Progress Alert */}
      {isBackfilling && (
        <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-4 flex items-center gap-3 text-xs font-bold text-emerald-600 dark:text-emerald-400">
          <Loader2 className="h-5 w-5 animate-spin shrink-0" />
          <span>{backfillProgress}</span>
        </div>
      )}

      {/* Diagnostics Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-3xl border border-border bg-surface p-4 shadow-xs">
          <span className="text-[11px] font-bold text-muted-foreground block">
            إجمالي الوسائط المفحوصة
          </span>
          <span className="text-xl font-black text-foreground mt-1 block">{mediaList.length}</span>
        </div>
        <div className="rounded-3xl border border-border bg-surface p-4 shadow-xs">
          <span className="text-[11px] font-bold text-muted-foreground block">
            الصور المستوردة 🖼️
          </span>
          <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
            {mediaList.filter((m) => m.file_type === "image").length}
          </span>
        </div>
        <div className="rounded-3xl border border-border bg-surface p-4 shadow-xs">
          <span className="text-[11px] font-bold text-muted-foreground block">الفيديوهات 🎥</span>
          <span className="text-xl font-black text-purple-600 dark:text-purple-400 mt-1 block">
            {mediaList.filter((m) => m.file_type === "video").length}
          </span>
        </div>
        <div className="rounded-3xl border border-border bg-surface p-4 shadow-xs">
          <span className="text-[11px] font-bold text-muted-foreground block">
            حالة المزامنة السحابية
          </span>
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
            <ShieldCheck className="h-4 w-4" /> Bucket: product-images
          </span>
        </div>
      </div>

      {/* Diagnostics Table */}
      <div className="rounded-3xl border border-border/80 bg-surface shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : mediaList.length === 0 ? (
          <div className="p-12 text-center text-xs font-bold text-muted-foreground">
            لم يتم العثور على وسائط مستوردة عبر الواتساب حالياً.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-muted-foreground font-bold">
                  <th className="p-3 text-start">رقم الإدخال (#)</th>
                  <th className="p-3 text-start">معاينة الملف</th>
                  <th className="p-3 text-start">نوع الملف (file_type)</th>
                  <th className="p-3 text-start">مسار التخزين (storage_path)</th>
                  <th className="p-3 text-start">حالة الرفع (Upload Status)</th>
                  <th className="p-3 text-start">الرابط الثابت (file_url)</th>
                  <th className="p-3 text-start">الصورة المصغرة (thumbnail_url)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {mediaList.map((file) => {
                  const uploadSuccess = (file.metadata as any)?.upload_success !== false;
                  const thumb =
                    file.thumbnail_url || (file.file_type === "image" ? file.file_url : null);

                  return (
                    <tr key={file.id} className="hover:bg-accent/40 transition">
                      <td className="p-3 font-mono font-bold text-foreground">
                        #{file.sequence_number || 1}
                      </td>

                      <td className="p-3">
                        <div className="h-10 w-10 rounded-xl bg-muted overflow-hidden border border-border/60 flex items-center justify-center">
                          {thumb ? (
                            <img src={thumb} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <Film className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                      </td>

                      <td className="p-3 font-bold">
                        {file.file_type === "video" ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-purple-500/10 px-2 py-0.5 text-[10px] font-bold text-purple-600 dark:text-purple-400 border border-purple-500/20">
                            <Film className="h-3 w-3" /> فيديو ({file.mime_type})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <ImageIcon className="h-3 w-3" /> صورة ({file.mime_type})
                          </span>
                        )}
                      </td>

                      <td
                        className="p-3 font-mono text-[10px] text-muted-foreground max-w-[180px] truncate"
                        title={file.file_path}
                      >
                        {file.file_path}
                      </td>

                      <td className="p-3">
                        {uploadSuccess ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                            <CheckCircle className="h-3.5 w-3.5" /> ناجح (product-images)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-destructive font-bold text-[11px]">
                            <AlertCircle className="h-3.5 w-3.5" /> فشل الرفع
                          </span>
                        )}
                      </td>

                      <td className="p-3">
                        <a
                          href={file.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:underline font-bold text-[11px]"
                        >
                          <ExternalLink className="h-3 w-3" /> فتح الرابط
                        </a>
                      </td>

                      <td className="p-3">
                        {file.thumbnail_url ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
                            ✓ موثّق
                          </span>
                        ) : file.file_type === "video" ? (
                          <button
                            type="button"
                            onClick={async () => {
                              const dataUri = await processVideoFrame(file.file_url);
                              if (dataUri) {
                                await updateThumbnailFn({
                                  data: { mediaId: file.id, thumbnailUrl: dataUri },
                                });
                                toast.success("تم توليد البوستر بنجاح!");
                                refetch();
                              } else {
                                toast.error("تعذر توليد البوستر لهذا الفيديو");
                              }
                            }}
                            className="rounded-lg bg-primary/10 text-primary px-2 py-0.5 text-[10px] font-bold hover:bg-primary/20 transition"
                          >
                            توليد الآن 🪄
                          </button>
                        ) : (
                          <span className="text-muted-foreground text-[10px]">تلقائي (صورة)</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

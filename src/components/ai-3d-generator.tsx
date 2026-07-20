/**
 * AI 2D→3D Generator panel.
 *
 * Frontend-only architecture for the "generate 3D model from images"
 * workflow. The actual call to an external provider (Meshy / Luma /
 * Tripo / …) is stubbed in `generate3DFromImage` below — swap the
 * setTimeout for a real fetch when the API key is wired up.
 */
import { useState } from "react";
import { Sparkles, Loader2, RotateCw, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Product3DViewerCard } from "@/components/product-3d-viewer-card";
import { useServerFn } from "@tanstack/react-start";
import { generate3DModel } from "@/lib/ai-3d.functions";



type Props = {
  images: string[];
  currentModelUrl?: string;
  currentModelThumbnail?: string;
  currentModelStatus?: string;
  onGenerated?: (modelUrl: string, thumbnail: string, status: string) => void;
};

export function Ai3dGeneratorPanel({
  images,
  currentModelUrl,
  currentModelThumbnail,
  currentModelStatus = "pending",
  onGenerated,
}: Props) {
  const [status, setStatus] = useState<string>(
    currentModelStatus || (currentModelUrl ? "completed" : "pending")
  );
  const [modelUrl, setModelUrl] = useState<string | undefined>(currentModelUrl);
  const [progress, setProgress] = useState(0);
  const fetch3DModel = useServerFn(generate3DModel);

  const canGenerate = images.length > 0 && status !== "processing";

  const run = async () => {
    setStatus("processing");
    onGenerated?.("", "", "processing");
    setProgress(5);
    toast.info("يقوم الذكاء الاصطناعي حالياً بتوليد المجسم ثلاثي الأبعاد. يستغرق ذلك دقيقة تقريباً...");
    const timer = setInterval(() => {
      setProgress((p) => (p < 90 ? p + 5 : p));
    }, 200);
    try {
      const { modelUrl: url } = await fetch3DModel({ data: { images } });
      clearInterval(timer);
      setProgress(100);
      setModelUrl(url);
      setStatus("completed");
      toast.success("تم توليد النموذج ثلاثي الأبعاد بنجاح!");
      onGenerated?.(url, images[0] ?? "", "completed");
    } catch (err) {
      clearInterval(timer);
      setStatus("failed");
      onGenerated?.("", "", "failed");
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error(`فشل توليد المجسم ثلاثي الأبعاد: ${msg}`);
    }
  };

  return (
    <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/5 to-fuchsia-500/5 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-black">AI 3D Generator</h2>
        </div>
        {status === "completed" && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
            <CheckCircle2 className="h-3 w-3" /> جاهز
          </span>
        )}
        {status === "processing" && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-600 animate-pulse">
            <Loader2 className="h-3 w-3 animate-spin" /> جاري التحميل...
          </span>
        )}
      </div>

      <p className="mt-1 text-xs text-muted-foreground">
        حوّل صور منتجك الـ 2D المرفوعة إلى مجسم تفاعلي 3D بالذكاء الاصطناعي.
      </p>

      <button
        type="button"
        onClick={run}
        disabled={!canGenerate}
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-fuchsia-500 px-4 py-2.5 text-sm font-bold text-white shadow-brand transition disabled:cursor-not-allowed disabled:opacity-50"
      >
        {status === "processing" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> جاري التوليد... ({progress}%)
          </>
        ) : status === "completed" ? (
          <>
            <RotateCw className="h-4 w-4" /> إعادة توليد المجسم 3D
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" /> توليد مجسم 3D ذكي
          </>
        )}
      </button>

      {images.length === 0 && (
        <p className="mt-2 text-[11px] text-muted-foreground text-destructive">
          يرجى رفع صورة للمنتج أولاً لتتمكن من استخدام التوليد 3D.
        </p>
      )}

      <div className="mt-4 overflow-hidden rounded-xl border border-border/60 bg-surface">
        {status === "processing" && (
          <div className="p-4">
            <div className="aspect-square w-full animate-pulse rounded-lg bg-gradient-to-br from-muted via-muted/60 to-muted" />
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-gradient-to-r from-primary to-fuchsia-500 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-2 text-center text-[11px] font-bold text-muted-foreground">
              تخليق الشبكة ثلاثية الأبعاد (Mesh Generation) · {progress}%
            </p>
          </div>
        )}

        {status !== "processing" && modelUrl && (
          <div className="p-2">
            <Product3DViewerCard
              modelSrc={modelUrl}
              poster={images[0] ?? ""}
              title="المعاينة ثلاثية الأبعاد"
              subtitle="يمكنك تدوير المجسم واستعراضه"
              price=""
            />
          </div>
        )}

        {status === "pending" && !modelUrl && (
          <div className="grid aspect-square place-items-center p-6 text-center">
            <div>
              <Sparkles className="mx-auto h-8 w-8 text-primary/40" />
              <p className="mt-2 text-xs font-bold text-muted-foreground">
                لم يتم توليد مجسم بعد
              </p>
            </div>
          </div>
        )}

        {status === "failed" && (
          <div className="grid aspect-square place-items-center p-6 text-center">
            <div>
              <p className="text-xs font-bold text-destructive">
                فشل توليد المجسم. يرجى المحاولة مجدداً.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Ai3dGeneratorPanel;

import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Loader2, RefreshCw, Trash2, Upload, X, XCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { validateMediaFile } from "@/lib/media.functions";
import {
  cleanupMediaUploadFn,
  finalizeMediaUploadFn,
  prepareMediaUploadFn,
} from "@/lib/media-upload.functions";

type UploadStatus =
  | "queued"
  | "preparing"
  | "uploading"
  | "finalizing"
  | "done"
  | "error"
  | "cancelled";

type UploadQueueItem = {
  id: string;
  file: File;
  progress: number;
  status: UploadStatus;
  error?: string;
};

type UploadOptions = {
  bucket: string;
  path: string;
  file: File;
  signal?: AbortSignal;
  maxAttempts?: number;
  onProgress?: (percent: number) => void;
};

type UploadError = Error & { status?: number };

type MediaUploadPanelProps = {
  onUploaded?: () => void;
};

function encodeStoragePath(path: string): string {
  return path.split("/").map(encodeURIComponent).join("/");
}

function wait(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        window.clearTimeout(timer);
        reject(new DOMException("Upload cancelled", "AbortError"));
      },
      { once: true },
    );
  });
}

function uploadAttempt(
  options: UploadOptions,
  accessToken: string,
  publishableKey: string,
  baseUrl: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const url = `${baseUrl}/storage/v1/object/${encodeURIComponent(options.bucket)}/${encodeStoragePath(options.path)}`;

    xhr.open("POST", url);
    xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);
    xhr.setRequestHeader("apikey", publishableKey);
    xhr.setRequestHeader("Content-Type", options.file.type || "application/octet-stream");
    xhr.setRequestHeader("x-upsert", "false");
    xhr.setRequestHeader("cache-control", "2592000");

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        options.onProgress?.(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onerror = () => reject(new Error("تعذر الاتصال بخدمة التخزين."));
    xhr.onabort = () => reject(new DOMException("Upload cancelled", "AbortError"));
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        options.onProgress?.(100);
        resolve();
        return;
      }

      let message = `فشل رفع الملف (${xhr.status})`;
      try {
        const body = JSON.parse(xhr.responseText) as { message?: string; error?: string };
        message = body.message || body.error || message;
      } catch {
        // Keep the safe status message when Storage does not return JSON.
      }

      const error = new Error(message) as UploadError;
      error.status = xhr.status;
      reject(error);
    };

    options.signal?.addEventListener("abort", () => xhr.abort(), { once: true });
    xhr.send(options.file);
  });
}

async function uploadMediaDirect(options: UploadOptions): Promise<void> {
  const baseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

  if (!baseUrl || !publishableKey) {
    throw new Error("إعدادات Supabase العامة غير مكتملة.");
  }

  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error(error.message);

  const accessToken = data.session?.access_token;
  if (!accessToken) {
    throw new Error("انتهت جلسة تسجيل الدخول. سجّل الدخول ثم أعد المحاولة.");
  }

  const maxAttempts = Math.max(1, Math.min(options.maxAttempts ?? 3, 3));
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await uploadAttempt(options, accessToken, publishableKey, baseUrl.replace(/\/$/, ""));
      return;
    } catch (error) {
      lastError = error;
      const uploadError = error as UploadError;
      if (uploadError.name === "AbortError") throw uploadError;

      const retryable =
        uploadError.status === undefined ||
        uploadError.status === 408 ||
        uploadError.status === 429 ||
        uploadError.status >= 500;

      if (!retryable || attempt === maxAttempts) break;
      await wait(400 * 2 ** (attempt - 1), options.signal);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("فشل رفع الملف بعد عدة محاولات.");
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 MB";
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function statusLabel(status: UploadStatus): string {
  switch (status) {
    case "queued":
      return "في قائمة الانتظار";
    case "preparing":
      return "جارٍ تجهيز المسار الآمن";
    case "uploading":
      return "جارٍ الرفع إلى Storage";
    case "finalizing":
      return "جارٍ تسجيل بيانات الملف";
    case "done":
      return "اكتمل الرفع";
    case "cancelled":
      return "تم إلغاء الرفع";
    default:
      return "فشل الرفع";
  }
}

export function MediaUploadPanel({ onUploaded }: MediaUploadPanelProps) {
  const queryClient = useQueryClient();
  const prepareUpload = useServerFn(prepareMediaUploadFn);
  const finalizeUpload = useServerFn(finalizeMediaUploadFn);
  const cleanupUpload = useServerFn(cleanupMediaUploadFn);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const uploadControllersRef = useRef(new Map<string, AbortController>());
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);

  const updateUploadItem = (id: string, patch: Partial<UploadQueueItem>) => {
    setUploadQueue((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  };

  const uploadOne = async (item: UploadQueueItem) => {
    const validation = validateMediaFile(item.file);
    if (!validation.valid) {
      updateUploadItem(item.id, {
        status: "error",
        error: validation.error,
        progress: 0,
      });
      toast.error(`${item.file.name}: ${validation.error}`);
      return;
    }

    let prepared: {
      bucket: string;
      path: string;
      fileType: "image" | "video";
    } | null = null;
    let uploadCompleted = false;
    let finalizeStarted = false;

    const controller = new AbortController();
    uploadControllersRef.current.set(item.id, controller);

    try {
      updateUploadItem(item.id, {
        status: "preparing",
        error: undefined,
        progress: 0,
      });

      prepared = await prepareUpload({
        data: {
          fileName: item.file.name,
          sizeBytes: item.file.size,
          mimeType: item.file.type,
        },
      });

      updateUploadItem(item.id, { status: "uploading", progress: 0 });
      await uploadMediaDirect({
        bucket: prepared.bucket,
        path: prepared.path,
        file: item.file,
        signal: controller.signal,
        maxAttempts: 3,
        onProgress: (progress) =>
          updateUploadItem(item.id, { status: "uploading", progress }),
      });
      uploadCompleted = true;

      updateUploadItem(item.id, { status: "finalizing", progress: 100 });
      finalizeStarted = true;

      await finalizeUpload({
        data: {
          bucket: prepared.bucket,
          path: prepared.path,
          fileName: item.file.name,
          sizeBytes: item.file.size,
          mimeType: item.file.type,
          metadata: { source: "upload" },
        },
      });

      updateUploadItem(item.id, {
        status: "done",
        progress: 100,
        error: undefined,
      });
      toast.success(`تم رفع ${item.file.name} وتسجيله بنجاح`);
      await queryClient.invalidateQueries({ queryKey: ["admin-media-files"] });
      onUploaded?.();
    } catch (error) {
      const uploadError =
        error instanceof Error ? error : new Error("فشل رفع الملف");
      const cancelled =
        uploadError.name === "AbortError" || controller.signal.aborted;

      updateUploadItem(item.id, {
        status: cancelled ? "cancelled" : "error",
        error: cancelled ? "تم إلغاء الرفع" : uploadError.message,
      });

      if (prepared && uploadCompleted && !finalizeStarted) {
        try {
          await cleanupUpload({
            data: { bucket: prepared.bucket, path: prepared.path },
          });
        } catch (cleanupError) {
          console.error("[MEDIA_UPLOAD_CLIENT_CLEANUP_FAILED]", cleanupError);
        }
      }

      if (!cancelled) {
        toast.error(`${item.file.name}: ${uploadError.message}`);
      }
    } finally {
      uploadControllersRef.current.delete(item.id);
    }
  };

  const handleFileUpload = async (files: File[]) => {
    const entries = files.map<UploadQueueItem>((file) => ({
      id: crypto.randomUUID(),
      file,
      progress: 0,
      status: "queued",
    }));

    if (!entries.length) return;

    setUploadQueue((current) => [...entries, ...current]);
    for (const entry of entries) {
      await uploadOne(entry);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const activeUploads = uploadQueue.filter(
    (item) => !["done", "error", "cancelled"].includes(item.status),
  ).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={activeUploads > 0}
          className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-md disabled:opacity-60"
        >
          {activeUploads ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          {activeUploads ? `جارٍ رفع ${activeUploads}` : "رفع وسائط جديدة"}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml,video/mp4,video/webm"
          className="hidden"
          onChange={(event) =>
            void handleFileUpload(Array.from(event.target.files || []))
          }
        />
      </div>

      <section
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          void handleFileUpload(Array.from(event.dataTransfer.files || []));
        }}
        onClick={() => fileInputRef.current?.click()}
        className="group cursor-pointer rounded-3xl border-2 border-dashed border-border/80 bg-surface/40 p-5 text-center transition hover:border-primary/60 hover:bg-primary/5"
      >
        <Upload className="mx-auto h-8 w-8 text-primary transition-transform group-hover:scale-110" />
        <p className="mt-2 text-xs font-bold">
          اسحب الصور أو الفيديوهات هنا، أو انقر للاختيار من الهاتف أو الكمبيوتر
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          JPG, PNG, WebP, GIF, SVG حتى 10MB — MP4, WebM حتى 50MB
        </p>
      </section>

      {uploadQueue.length > 0 && (
        <section
          className="space-y-3 rounded-3xl border border-border bg-surface p-4 shadow-sm"
          aria-live="polite"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-black">حالة الرفع</h2>
              <p className="text-[11px] text-muted-foreground">
                الرفع المباشر يعيد المحاولة تلقائياً حتى 3 مرات للأخطاء المؤقتة.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setUploadQueue((current) =>
                  current.filter(
                    (item) => !["done", "cancelled"].includes(item.status),
                  ),
                )
              }
              className="rounded-xl border border-border px-3 py-1.5 text-[11px] font-bold"
            >
              تنظيف المكتمل
            </button>
          </div>

          <div className="space-y-2">
            {uploadQueue.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-border/70 bg-background p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {item.status === "done" ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                      ) : item.status === "error" ||
                        item.status === "cancelled" ? (
                        <XCircle className="h-4 w-4 shrink-0 text-destructive" />
                      ) : (
                        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
                      )}
                      <p className="truncate text-xs font-bold">
                        {item.file.name}
                      </p>
                      <span className="shrink-0 text-[10px] text-muted-foreground">
                        {formatBytes(item.file.size)}
                      </span>
                    </div>

                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-[width] duration-200"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>

                    <div className="mt-1 flex items-center justify-between gap-2 text-[10px]">
                      <span
                        className={
                          item.status === "error"
                            ? "text-destructive"
                            : "text-muted-foreground"
                        }
                      >
                        {item.error || statusLabel(item.status)}
                      </span>
                      <span className="font-mono font-bold">
                        {item.progress}%
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    {["queued", "preparing", "uploading"].includes(
                      item.status,
                    ) && (
                      <button
                        type="button"
                        onClick={() =>
                          uploadControllersRef.current.get(item.id)?.abort()
                        }
                        className="rounded-lg p-1.5 text-destructive hover:bg-destructive/10"
                        aria-label={`إلغاء رفع ${item.file.name}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}

                    {["error", "cancelled"].includes(item.status) && (
                      <button
                        type="button"
                        onClick={() =>
                          void uploadOne({
                            ...item,
                            status: "queued",
                            progress: 0,
                            error: undefined,
                          })
                        }
                        className="rounded-lg p-1.5 text-primary hover:bg-primary/10"
                        aria-label={`إعادة رفع ${item.file.name}`}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </button>
                    )}

                    {["done", "error", "cancelled"].includes(item.status) && (
                      <button
                        type="button"
                        onClick={() =>
                          setUploadQueue((current) =>
                            current.filter((entry) => entry.id !== item.id),
                          )
                        }
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent"
                        aria-label={`إزالة ${item.file.name} من القائمة`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

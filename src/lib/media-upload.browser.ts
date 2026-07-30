import { supabase } from "@/integrations/supabase/client";

type UploadOptions = {
  bucket: string;
  path: string;
  file: File;
  signal?: AbortSignal;
  maxAttempts?: number;
  onProgress?: (percent: number) => void;
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

function uploadAttempt(options: UploadOptions, accessToken: string, publishableKey: string, baseUrl: string): Promise<void> {
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
        const body = JSON.parse(xhr.responseText);
        message = body?.message || body?.error || message;
      } catch {
        // Response is not JSON; preserve the safe status message.
      }
      const error = new Error(message) as Error & { status?: number };
      error.status = xhr.status;
      reject(error);
    };

    options.signal?.addEventListener("abort", () => xhr.abort(), { once: true });
    xhr.send(options.file);
  });
}

export async function uploadMediaDirect(options: UploadOptions): Promise<void> {
  const baseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
  if (!baseUrl || !publishableKey) throw new Error("إعدادات Supabase العامة غير مكتملة.");

  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error(error.message);
  const accessToken = data.session?.access_token;
  if (!accessToken) throw new Error("انتهت جلسة تسجيل الدخول. سجّل الدخول ثم أعد المحاولة.");

  const maxAttempts = Math.max(1, Math.min(options.maxAttempts ?? 3, 3));
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await uploadAttempt(options, accessToken, publishableKey, baseUrl.replace(/\/$/, ""));
      return;
    } catch (error: any) {
      lastError = error;
      if (error?.name === "AbortError") throw error;
      const retryable = !error?.status || error.status === 408 || error.status === 429 || error.status >= 500;
      if (!retryable || attempt === maxAttempts) break;
      await wait(400 * 2 ** (attempt - 1), options.signal);
    }
  }
  throw lastError instanceof Error ? lastError : new Error("فشل رفع الملف بعد عدة محاولات.");
}

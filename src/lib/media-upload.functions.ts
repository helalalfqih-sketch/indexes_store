import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { resolveTenantId } from "@/lib/saas/tenant-context";
import { checkTenantPermission } from "@/lib/users.functions";

export const MEDIA_BUCKET = "product-images";
export const MAX_IMAGE_UPLOAD_BYTES = 10 * 1024 * 1024;
export const MAX_VIDEO_UPLOAD_BYTES = 50 * 1024 * 1024;

const ALLOWED_IMAGE_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
]);
const ALLOWED_VIDEO_MIME = new Set(["video/mp4", "video/webm"]);

function validateUpload(file: { name: string; size: number; mimeType: string }) {
  const isImage = ALLOWED_IMAGE_MIME.has(file.mimeType);
  const isVideo = ALLOWED_VIDEO_MIME.has(file.mimeType);
  if (!isImage && !isVideo) throw new Error("نوع الملف غير مسموح. استخدم JPG/PNG/WebP/GIF/SVG أو MP4/WebM.");
  if (isImage && file.size > MAX_IMAGE_UPLOAD_BYTES) throw new Error("الحد الأقصى لحجم الصورة هو 10 ميجابايت.");
  if (isVideo && file.size > MAX_VIDEO_UPLOAD_BYTES) throw new Error("الحد الأقصى لحجم الفيديو هو 50 ميجابايت.");
  return isVideo ? "video" : "image";
}

function safeFileName(name: string): string {
  const sanitized = name.normalize("NFKC").replace(/[^a-zA-Z0-9._\-\u0600-\u06FF]/g, "-");
  return sanitized.replace(/-+/g, "-").slice(-180) || "upload";
}

const PrepareSchema = z.object({
  fileName: z.string().min(1).max(255),
  sizeBytes: z.number().int().positive(),
  mimeType: z.string().min(1).max(120),
});

export const prepareMediaUploadFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => PrepareSchema.parse(input))
  .handler(async ({ data, context }) => {
    const ctx = context as any;
    if (!(await checkTenantPermission("cms", ctx))) throw new Error("صلاحية رفع الوسائط مرفوضة.");
    const tenantId = await resolveTenantId(ctx.supabase, { userId: ctx.userId });
    const fileType = validateUpload({ name: data.fileName, size: data.sizeBytes, mimeType: data.mimeType });
    const uniqueName = `${Date.now()}-${crypto.randomUUID()}-${safeFileName(data.fileName)}`;
    return {
      bucket: MEDIA_BUCKET,
      path: `uploads/${tenantId}/${uniqueName}`,
      fileType,
    };
  });

const FinalizeSchema = z.object({
  bucket: z.literal(MEDIA_BUCKET),
  path: z.string().min(1).max(1024),
  fileName: z.string().min(1).max(255),
  sizeBytes: z.number().int().positive(),
  mimeType: z.string().min(1).max(120),
  metadata: z.record(z.unknown()).optional(),
});

export const finalizeMediaUploadFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => FinalizeSchema.parse(input))
  .handler(async ({ data, context }) => {
    const ctx = context as any;
    if (!(await checkTenantPermission("cms", ctx))) throw new Error("صلاحية رفع الوسائط مرفوضة.");
    const db = ctx.supabase;
    const tenantId = await resolveTenantId(db, { userId: ctx.userId });
    const requiredPrefix = `uploads/${tenantId}/`;
    if (!data.path.startsWith(requiredPrefix) || data.path.includes("..")) {
      throw new Error("مسار التخزين لا ينتمي إلى المتجر الحالي.");
    }
    const fileType = validateUpload({ name: data.fileName, size: data.sizeBytes, mimeType: data.mimeType });
    const { data: urlData } = db.storage.from(data.bucket).getPublicUrl(data.path);
    const fileUrl = urlData?.publicUrl;
    if (!fileUrl) throw new Error("تعذر إنشاء رابط الملف بعد الرفع.");

    const payload = {
      tenant_id: tenantId,
      file_name: data.fileName,
      file_path: data.path,
      file_url: fileUrl,
      file_type: fileType,
      mime_type: data.mimeType,
      size_bytes: data.sizeBytes,
      source: "upload",
      metadata: { ...(data.metadata || {}), source: "upload", bucket: data.bucket },
      created_by: ctx.userId || null,
    };

    const { data: record, error } = await db.from("media_files").insert(payload).select("*").single();
    if (error) {
      const { error: cleanupError } = await db.storage.from(data.bucket).remove([data.path]);
      if (cleanupError) console.error("[MEDIA_UPLOAD_CLEANUP_FAILED]", cleanupError.message);
      throw new Error(error.message);
    }
    return record;
  });

const CleanupSchema = z.object({
  bucket: z.literal(MEDIA_BUCKET),
  path: z.string().min(1).max(1024),
});

export const cleanupMediaUploadFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => CleanupSchema.parse(input))
  .handler(async ({ data, context }) => {
    const ctx = context as any;
    if (!(await checkTenantPermission("cms", ctx))) throw new Error("صلاحية حذف الوسائط مرفوضة.");
    const tenantId = await resolveTenantId(ctx.supabase, { userId: ctx.userId });
    if (!data.path.startsWith(`uploads/${tenantId}/`) || data.path.includes("..")) {
      throw new Error("مسار التخزين لا ينتمي إلى المتجر الحالي.");
    }
    const { error } = await ctx.supabase.storage.from(data.bucket).remove([data.path]);
    if (error) throw new Error(error.message);
    return { success: true };
  });

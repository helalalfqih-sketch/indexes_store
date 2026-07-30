import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { resolveTenantId } from "@/lib/saas/tenant-context";
import { checkTenantPermission } from "@/lib/users.functions";

export interface MediaFileRecord {
  id: string;
  tenant_id: string;
  file_name: string;
  file_path: string;
  file_url: string;
  file_type: "image" | "video" | "other";
  mime_type: string;
  size_bytes: number;
  sequence_number?: number | null;
  thumbnail_url?: string | null;
  dimensions?: { width?: number; height?: number } | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
}

export const MEDIA_BUCKET = "product-images";
export const ALLOWED_IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "gif", "svg"]);
export const ALLOWED_VIDEO_EXTENSIONS = new Set(["mp4", "webm"]);
export const BANNED_EXTENSIONS = new Set(["exe", "js", "html", "htm", "sh", "bat", "cmd", "php", "vbs", "jar"]);
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
export const MAX_VIDEO_SIZE = 50 * 1024 * 1024;

const ALLOWED_IMAGE_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
]);
const ALLOWED_VIDEO_MIME = new Set(["video/mp4", "video/webm"]);

export function validateMediaFile(file: { name: string; size: number; type: string }): { valid: boolean; error?: string } {
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  if (BANNED_EXTENSIONS.has(ext)) {
    return { valid: false, error: `نوع الملف (.${ext}) غير مسموح به لأسباب أمنية.` };
  }

  const isImage = ALLOWED_IMAGE_MIME.has(file.type) && ALLOWED_IMAGE_EXTENSIONS.has(ext);
  const isVideo = ALLOWED_VIDEO_MIME.has(file.type) && ALLOWED_VIDEO_EXTENSIONS.has(ext);
  if (!isImage && !isVideo) {
    return { valid: false, error: "يسمح فقط بصور JPG/PNG/WebP/GIF/SVG أو فيديو MP4/WebM." };
  }
  if (isImage && file.size > MAX_IMAGE_SIZE) {
    return { valid: false, error: "الحد الأقصى لحجم الصورة هو 10 ميجابايت." };
  }
  if (isVideo && file.size > MAX_VIDEO_SIZE) {
    return { valid: false, error: "الحد الأقصى لحجم الفيديو هو 50 ميجابايت." };
  }
  if (file.size <= 0) return { valid: false, error: "الملف فارغ." };
  return { valid: true };
}

function assertStoragePath(path: string, tenantId: string): void {
  const requiredPrefix = `uploads/${tenantId}/`;
  if (!path.startsWith(requiredPrefix) || path.includes("..") || path.startsWith("data:")) {
    throw new Error("يجب استخدام مسار Storage حقيقي تابع للمتجر الحالي.");
  }
}

function storagePublicUrl(db: any, path: string): string {
  const { data } = db.storage.from(MEDIA_BUCKET).getPublicUrl(path);
  if (!data?.publicUrl) throw new Error("تعذر إنشاء رابط Storage للملف.");
  return data.publicUrl;
}

async function requireCmsAccess(context: any): Promise<{ db: any; tenantId: string; userId: string }> {
  const ctx = context as any;
  if (!(await checkTenantPermission("cms", ctx))) {
    throw new Error("صلاحية مكتبة الوسائط مرفوضة.");
  }
  const db = ctx.supabase;
  const tenantId = await resolveTenantId(db, { userId: ctx.userId });
  return { db, tenantId, userId: ctx.userId };
}

async function storageObjectExists(db: any, path: string): Promise<boolean> {
  const slashIndex = path.lastIndexOf("/");
  const folder = slashIndex >= 0 ? path.slice(0, slashIndex) : "";
  const fileName = slashIndex >= 0 ? path.slice(slashIndex + 1) : path;
  const { data, error } = await db.storage.from(MEDIA_BUCKET).list(folder, {
    limit: 10,
    search: fileName,
  });
  if (error) throw new Error(`تعذر التحقق من الملف في Storage: ${error.message}`);
  return Array.isArray(data) && data.some((item: { name?: string }) => item.name === fileName);
}

export const listMediaFiles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((data: { search?: string; type?: string; source?: string; category?: string; sort?: string; limit?: number }) => data)
  .handler(async ({ data, context }): Promise<MediaFileRecord[]> => {
    const { db, tenantId } = await requireCmsAccess(context);
    const limit = Math.max(1, Math.min(data.limit ?? 200, 500));
    let query = db.from("media_files").select("*").eq("tenant_id", tenantId).limit(limit);

    if (data.type && data.type !== "all") query = query.eq("file_type", data.type);
    if (data.source && data.source !== "all") query = query.eq("source", data.source);
    if (data.search?.trim()) query = query.ilike("file_name", `%${data.search.trim()}%`);

    const ascending = data.sort === "oldest" || data.sort === "name_asc" || data.sort === "seq_asc";
    const sortColumn = data.sort?.startsWith("name_")
      ? "file_name"
      : data.sort?.startsWith("seq_")
        ? "sequence_number"
        : data.sort === "largest" || data.sort === "smallest"
          ? "size_bytes"
          : "created_at";
    if (data.sort === "largest") query = query.order(sortColumn, { ascending: false });
    else if (data.sort === "smallest") query = query.order(sortColumn, { ascending: true });
    else query = query.order(sortColumn, { ascending });

    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);

    let results = (rows || []) as MediaFileRecord[];
    if (data.category && data.category !== "all") {
      results = results.filter((row) => row.metadata?.category === data.category);
    }
    return results;
  });

/**
 * Compatibility recorder for callers that already uploaded a file to Storage.
 * It never accepts bytes, Data URLs, Base64, or arbitrary external URLs.
 */
export const recordMediaFile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: {
    file_name: string;
    file_path: string;
    file_url?: string;
    file_type: "image" | "video" | "other";
    mime_type: string;
    size_bytes: number;
    dimensions?: { width?: number; height?: number };
    metadata?: Record<string, unknown>;
  }) => data)
  .handler(async ({ data, context }): Promise<MediaFileRecord> => {
    const { db, tenantId, userId } = await requireCmsAccess(context);
    const validation = validateMediaFile({ name: data.file_name, size: data.size_bytes, type: data.mime_type });
    if (!validation.valid) throw new Error(validation.error);
    assertStoragePath(data.file_path, tenantId);
    if (data.file_url?.startsWith("data:")) throw new Error("Data URLs وBase64 غير مسموحة.");
    if (!(await storageObjectExists(db, data.file_path))) throw new Error("الملف غير موجود في Storage.");

    const fileUrl = storagePublicUrl(db, data.file_path);
    const source = String(data.metadata?.source || "upload");
    const payload = {
      tenant_id: tenantId,
      file_name: data.file_name,
      file_path: data.file_path,
      file_url: fileUrl,
      file_type: data.file_type,
      mime_type: data.mime_type,
      size_bytes: data.size_bytes,
      dimensions: data.dimensions || null,
      source,
      metadata: { ...(data.metadata || {}), bucket: MEDIA_BUCKET, source },
      created_by: userId || null,
    };

    const { data: record, error } = await db.from("media_files").insert(payload).select("*").single();
    if (error) {
      const { error: cleanupError } = await db.storage.from(MEDIA_BUCKET).remove([data.file_path]);
      if (cleanupError) console.error("[MEDIA_UPLOAD_CLEANUP_FAILED]", cleanupError.message);
      throw new Error(error.message);
    }
    return record as MediaFileRecord;
  });

export const deleteMediaFile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { id: string }) => data)
  .handler(async ({ data, context }) => {
    const { db, tenantId, userId } = await requireCmsAccess(context);
    const { data: record, error: readError } = await db
      .from("media_files")
      .select("file_path, metadata")
      .eq("id", data.id)
      .eq("tenant_id", tenantId)
      .maybeSingle();
    if (readError) throw new Error(readError.message);

    const { error } = await db.from("media_files").delete().eq("id", data.id).eq("tenant_id", tenantId);
    if (error) throw new Error(error.message);

    if (record?.file_path?.startsWith(`uploads/${tenantId}/`)) {
      const bucket = record.metadata?.bucket === MEDIA_BUCKET ? MEDIA_BUCKET : MEDIA_BUCKET;
      const { error: storageError } = await db.storage.from(bucket).remove([record.file_path]);
      if (storageError) console.error("[MEDIA_DELETE_STORAGE_FAILED]", storageError.message);
    }

    await db.from("tenant_audit_logs").insert({
      tenant_id: tenantId,
      actor_id: userId || null,
      action: "media_delete",
      details: { file_id: data.id },
    });
    return { ok: true };
  });

export const bulkDeleteMediaFiles = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { ids: string[] }) => data)
  .handler(async ({ data, context }) => {
    if (!data.ids.length) return { ok: true, deleted: 0 };
    const { db, tenantId } = await requireCmsAccess(context);
    const { data: rows, error: readError } = await db
      .from("media_files")
      .select("id, file_path")
      .eq("tenant_id", tenantId)
      .in("id", data.ids);
    if (readError) throw new Error(readError.message);

    const { error } = await db.from("media_files").delete().eq("tenant_id", tenantId).in("id", data.ids);
    if (error) throw new Error(error.message);

    const paths = (rows || [])
      .map((row: { file_path?: string }) => row.file_path)
      .filter((path: string | undefined): path is string => Boolean(path?.startsWith(`uploads/${tenantId}/`)));
    if (paths.length) {
      const { error: storageError } = await db.storage.from(MEDIA_BUCKET).remove(paths);
      if (storageError) console.error("[MEDIA_BULK_DELETE_STORAGE_FAILED]", storageError.message);
    }
    return { ok: true, deleted: rows?.length || 0 };
  });

export const findUnusedMediaFiles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MediaFileRecord[]> => {
    const { db, tenantId } = await requireCmsAccess(context);
    const [{ data: mediaRows, error: mediaError }, { data: products }, { data: categories }] = await Promise.all([
      db.from("media_files").select("*").eq("tenant_id", tenantId),
      db.from("products").select("images, model_3d_url").eq("tenant_id", tenantId),
      db.from("categories").select("image_url").eq("tenant_id", tenantId),
    ]);
    if (mediaError) throw new Error(mediaError.message);

    const used = new Set<string>();
    for (const product of products || []) {
      if (Array.isArray(product.images)) product.images.forEach((url: string) => used.add(url));
      if (product.model_3d_url) used.add(product.model_3d_url);
    }
    for (const category of categories || []) if (category.image_url) used.add(category.image_url);
    return ((mediaRows || []) as MediaFileRecord[]).filter((row) => !used.has(row.file_url) && !used.has(row.file_path));
  });

export const getMediaFilesByIds = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { ids: string[] }) => data)
  .handler(async ({ data, context }): Promise<MediaFileRecord[]> => {
    if (!data.ids.length) return [];
    const { db, tenantId } = await requireCmsAccess(context);
    const { data: rows, error } = await db
      .from("media_files")
      .select("*")
      .eq("tenant_id", tenantId)
      .in("id", data.ids)
      .order("sequence_number", { ascending: true });
    if (error) throw new Error(error.message);
    return (rows || []) as MediaFileRecord[];
  });

export const linkProductMedia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { productId: string; mediaIds: string[] }) => data)
  .handler(async ({ data, context }) => {
    if (!data.productId || !data.mediaIds.length) return { ok: true };
    const { db, tenantId } = await requireCmsAccess(context);
    const { data: product } = await db.from("products").select("id").eq("id", data.productId).eq("tenant_id", tenantId).maybeSingle();
    if (!product) throw new Error("المنتج غير موجود في المتجر الحالي.");

    const { data: mediaRows } = await db.from("media_files").select("id").eq("tenant_id", tenantId).in("id", data.mediaIds);
    if (!mediaRows || mediaRows.length !== data.mediaIds.length) throw new Error("بعض الوسائط لا تنتمي إلى المتجر الحالي.");

    const records = data.mediaIds.map((mediaId, index) => ({
      tenant_id: tenantId,
      product_id: data.productId,
      media_id: mediaId,
      sort_order: index + 1,
    }));
    const { error } = await db.from("product_media").upsert(records, { onConflict: "product_id,media_id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const searchExistingProductsForLink = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((data: { query?: string }) => data)
  .handler(async ({ data, context }) => {
    const { db, tenantId } = await requireCmsAccess(context);
    let query = db
      .from("products")
      .select("id, name, price, currency, images, sku, is_published")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(30);
    if (data.query?.trim()) query = query.ilike("name", `%${data.query.trim()}%`);
    const { data: products, error } = await query;
    if (error) throw new Error(error.message);
    return products || [];
  });

export const attachMediaToExistingProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { productId: string; mediaIds: string[] }) => data)
  .handler(async ({ data, context }) => {
    if (!data.productId || !data.mediaIds.length) throw new Error("يرجى تحديد المنتج والوسائط.");
    const { db, tenantId } = await requireCmsAccess(context);

    const { data: mediaRows, error: mediaError } = await db
      .from("media_files")
      .select("*")
      .eq("tenant_id", tenantId)
      .in("id", data.mediaIds);
    if (mediaError) throw new Error(mediaError.message);
    if (!mediaRows || mediaRows.length !== data.mediaIds.length) throw new Error("بعض الوسائط لا تنتمي إلى المتجر الحالي.");

    const { data: product, error: productError } = await db
      .from("products")
      .select("images")
      .eq("id", data.productId)
      .eq("tenant_id", tenantId)
      .single();
    if (productError || !product) throw new Error("المنتج المحدد غير موجود.");

    const sorted = [...mediaRows].sort((a: any, b: any) => (a.sequence_number || 0) - (b.sequence_number || 0));
    const imageUrls = sorted.filter((row: any) => row.file_type === "image").map((row: any) => row.file_url);
    const firstVideo = sorted.find((row: any) => row.file_type === "video");
    const images = Array.from(new Set([...(Array.isArray(product.images) ? product.images : []), ...imageUrls]));
    const updatePayload: Record<string, unknown> = { images, updated_at: new Date().toISOString() };
    if (firstVideo) updatePayload.source_url = firstVideo.file_url;

    const { error: updateError } = await db
      .from("products")
      .update(updatePayload)
      .eq("id", data.productId)
      .eq("tenant_id", tenantId);
    if (updateError) throw new Error(updateError.message);

    const links = data.mediaIds.map((mediaId, index) => ({
      tenant_id: tenantId,
      product_id: data.productId,
      media_id: mediaId,
      sort_order: index + 1,
    }));
    const { error: linkError } = await db.from("product_media").upsert(links, { onConflict: "product_id,media_id" });
    if (linkError) throw new Error(linkError.message);
    return { ok: true, linkedCount: data.mediaIds.length, imagesAdded: imageUrls.length };
  });

export const getWhatsAppDiagnosticsMedia = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MediaFileRecord[]> => {
    const { db, tenantId } = await requireCmsAccess(context);
    const { data, error } = await db
      .from("media_files")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("source", "whatsapp")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return (data || []) as MediaFileRecord[];
  });

export const updateMediaFileThumbnail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { mediaId: string; thumbnailUrl: string }) => data)
  .handler(async ({ data, context }) => {
    const { db, tenantId } = await requireCmsAccess(context);
    if (data.thumbnailUrl.startsWith("data:")) throw new Error("Data URL thumbnails غير مسموحة.");
    const { error } = await db
      .from("media_files")
      .update({ thumbnail_url: data.thumbnailUrl })
      .eq("id", data.mediaId)
      .eq("tenant_id", tenantId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const backfillVideoThumbnails = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { db, tenantId } = await requireCmsAccess(context);
    const { data, error } = await db
      .from("media_files")
      .select("id, file_url")
      .eq("tenant_id", tenantId)
      .eq("file_type", "video")
      .is("thumbnail_url", null);
    if (error) throw new Error(error.message);
    return { count: data?.length || 0, videos: data || [] };
  });

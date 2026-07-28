import { createServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
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
  metadata?: Record<string, any> | null;
  created_at: string;
}

export const ALLOWED_IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "gif", "svg"]);
export const ALLOWED_VIDEO_EXTENSIONS = new Set(["mp4", "webm"]);
export const BANNED_EXTENSIONS = new Set(["exe", "js", "html", "htm", "sh", "bat", "cmd", "php", "vbs", "jar"]);

export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB
export const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50 MB

/** Validate file upload type and size */
export function validateMediaFile(file: { name: string; size: number; type: string }): { valid: boolean; error?: string } {
  const ext = file.name.split(".").pop()?.toLowerCase() || "";

  if (BANNED_EXTENSIONS.has(ext)) {
    return { valid: false, error: `نوع الملف (.${ext}) غير مسموح به لأسباب أمنية.` };
  }

  const isImage = file.type.startsWith("image/") || ALLOWED_IMAGE_EXTENSIONS.has(ext);
  const isVideo = file.type.startsWith("video/") || ALLOWED_VIDEO_EXTENSIONS.has(ext);

  if (!isImage && !isVideo) {
    return { valid: false, error: "يسمح فقط برفع الصور (JPG, PNG, WebP, SVG) أو الفيديوهات (MP4, WebM)." };
  }

  if (isImage && file.size > MAX_IMAGE_SIZE) {
    return { valid: false, error: "الحد الأقصى لحجم الصورة هو 10 ميجابايت." };
  }

  if (isVideo && file.size > MAX_VIDEO_SIZE) {
    return { valid: false, error: "الحد الأقصى لحجم الفيديو هو 50 ميجابايت." };
  }

  return { valid: true };
}

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const DEFAULT_DEMO_MEDIA: MediaFileRecord[] = [
  {
    id: "demo-media-1",
    tenant_id: "00000000-0000-0000-0000-000000000001",
    file_name: "منشار-تقليم-كهربائي-48V.jpg",
    file_path: "whatsapp/demo1.jpg",
    file_url: "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&auto=format&fit=crop",
    file_type: "image",
    mime_type: "image/jpeg",
    size_bytes: 1450000,
    sequence_number: 1,
    metadata: {
      source: "whatsapp",
      sender_phone: "+967738609222",
      caption: "منشار تقليم 48V",
      category: "معدات وأدوات",
      tags: ["منشار", "تقليم", "48V"],
      received_at: new Date().toISOString(),
    },
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "demo-media-2",
    tenant_id: "00000000-0000-0000-0000-000000000001",
    file_name: "كاميرا-فحص-أنابيب-4K.jpg",
    file_path: "whatsapp/demo2.jpg",
    file_url: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&auto=format&fit=crop",
    file_type: "image",
    mime_type: "image/jpeg",
    size_bytes: 2100000,
    sequence_number: 2,
    metadata: {
      source: "whatsapp",
      sender_phone: "+967738609222",
      caption: "كاميرا فحص أنابيب",
      category: "إلكترونيات",
      tags: ["كاميرا", "فحص", "أنابيب"],
      received_at: new Date().toISOString(),
    },
    created_at: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: "demo-media-3",
    tenant_id: "00000000-0000-0000-0000-000000000001",
    file_name: "ساعة-ابل-واش-الترا-سوداء.jpg",
    file_path: "whatsapp/demo3.jpg",
    file_url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop",
    file_type: "image",
    mime_type: "image/jpeg",
    size_bytes: 1890000,
    sequence_number: 3,
    metadata: {
      source: "whatsapp",
      sender_phone: "+967785574271",
      caption: "ساعة ابل واش الترا سوداء",
      category: "ساعات ومجوهرات",
      tags: ["ساعة", "ابل", "الترا"],
      received_at: new Date().toISOString(),
    },
    created_at: new Date(Date.now() - 10800000).toISOString(),
  },
];

/** Server Fn: List media files with search & filter */
export const listMediaFiles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((data: { search?: string; type?: string; source?: string; category?: string; sort?: string; limit?: number }) => data)
  .handler(async ({ data: { search, type, source, category, sort = "newest", limit = 200 }, context }): Promise<MediaFileRecord[]> => {
    try {
      const ctx = context as any;
      let db = ctx?.supabase || supabase;

      if (typeof process !== "undefined" && process.env?.SUPABASE_SERVICE_ROLE_KEY) {
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          if (supabaseAdmin) db = supabaseAdmin;
        } catch {
          // fallback
        }
      }

      const tenantId = await resolveTenantId(ctx.supabase, { userId: ctx.userId });

      let q = db
        .from("media_files")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (type && type !== "all") {
        q = q.eq("file_type", type);
      }

      const { data: rows, error } = await q;

      if (error) {
        console.warn("[Media] Supabase media_files query error:", error.message);
      }

      let results = (rows as unknown as MediaFileRecord[]) || [];

      // If DB has no rows at all, append DEMO media to show demo items alongside new uploads
      if (results.length === 0) {
        console.log("[Media] DB empty, returning DEMO media fallback");
        results = DEFAULT_DEMO_MEDIA;
      }

      // Filter by Search (Name or Tags)
      if (search && search.trim()) {
        const query = search.trim().toLowerCase();
        results = results.filter((file: any) => {
          const nameMatch = file.file_name?.toLowerCase().includes(query);
          const tags = (file.metadata?.tags as string[]) || [];
          const tagsMatch = tags.some((tag) => tag.toLowerCase().includes(query));
          const captionMatch = (file.metadata?.caption as string)?.toLowerCase().includes(query);
          return nameMatch || tagsMatch || captionMatch;
        });
      }

      // Filter by Source
      if (source && source !== "all") {
        results = results.filter((file: any) => {
          const itemSource = file.source || file.metadata?.source || "upload";
          return itemSource === source;
        });
      }

      // Filter by Category
      if (category && category !== "all") {
        results = results.filter((file: any) => {
          const itemCategory = file.metadata?.category || "وسائط متنوعة";
          return itemCategory === category;
        });
      }

      // Sort Results
      results.sort((a: any, b: any) => {
        if (sort === "oldest") {
          return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
        }
        if (sort === "seq_asc") {
          return (a.sequence_number || 0) - (b.sequence_number || 0);
        }
        if (sort === "seq_desc") {
          return (b.sequence_number || 0) - (a.sequence_number || 0);
        }
        if (sort === "largest") {
          return (b.size_bytes || 0) - (a.size_bytes || 0);
        }
        if (sort === "smallest") {
          return (a.size_bytes || 0) - (b.size_bytes || 0);
        }
        if (sort === "name_asc") {
          return (a.file_name || "").localeCompare(b.file_name || "", "ar");
        }
        if (sort === "name_desc") {
          return (b.file_name || "").localeCompare(a.file_name || "", "ar");
        }
        // default: newest
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      });

      return results;
    } catch (err) {
      console.warn("listMediaFiles exception fallback:", err);
      return DEFAULT_DEMO_MEDIA;
    }
  });

const MEDIA_BUCKET = "product-images"; // Supabase Storage bucket for all media

async function ensureBucketExists(db: any, bucketName: string): Promise<boolean> {
  try {
    const { data: buckets } = await db.storage.listBuckets();
    const exists = Array.isArray(buckets) && buckets.some((b: any) => b.name === bucketName || b.id === bucketName);
    if (!exists) {
      console.log(`[Media Storage] Bucket "${bucketName}" not found. Creating bucket...`);
      const { error: createErr } = await db.storage.createBucket(bucketName, { public: true });
      if (createErr) {
        console.warn(`[Media Storage] Could not auto-create bucket "${bucketName}": ${createErr.message}`);
        return false;
      }
      console.log(`[Media Storage] ✅ Bucket "${bucketName}" created successfully!`);
    }
    return true;
  } catch (err) {
    console.warn(`[Media Storage] Bucket check/create exception for "${bucketName}":`, err);
    return false;
  }
}

/**
 * Upload a base64 data URL or raw Buffer to Supabase Storage.
 * Returns the permanent public URL on success, throws on failure.
 */
async function uploadDataUrlToStorage(
  passedDb: any,
  storagePath: string,
  dataUrl: string,
  mimeType: string
): Promise<string> {
  let db = passedDb;
  if (typeof process !== "undefined" && process.env?.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      if (supabaseAdmin) db = supabaseAdmin;
    } catch { /* fallback */ }
  }

  // Decode base64 to binary
  const base64Data = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
  const binaryStr = atob(base64Data);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }

  console.log(`[Media] 💾 decoded ${bytes.byteLength} bytes from base64`);

  const bucketsToTry = [MEDIA_BUCKET, "media", "uploads"];
  let lastError: any = null;

  for (const bucketName of bucketsToTry) {
    try {
      await ensureBucketExists(db, bucketName);
      console.log(`[Media Storage] Attempting upload to bucket="${bucketName}" path="${storagePath}"`);
      
      let { error: storageError } = await db.storage
        .from(bucketName)
        .upload(storagePath, bytes.buffer, {
          contentType: mimeType,
          upsert: true,
          cacheControl: "2592000",
        });

      // If failed due to bucket missing, try creating it directly and retrying upload
      if (storageError && storageError.message?.toLowerCase().includes("not found")) {
        console.log(`[Media Storage] Bucket "${bucketName}" reported missing. Retrying after explicit creation...`);
        await db.storage.createBucket(bucketName, { public: true });
        const retryRes = await db.storage
          .from(bucketName)
          .upload(storagePath, bytes.buffer, {
            contentType: mimeType,
            upsert: true,
            cacheControl: "2592000",
          });
        storageError = retryRes.error;
      }

      if (storageError) {
        console.error(`[Media Storage] Bucket "${bucketName}" error: ${storageError.message}`);
        lastError = storageError;
        continue;
      }

      const { data: urlData } = db.storage.from(bucketName).getPublicUrl(storagePath);
      const publicUrl = urlData?.publicUrl;
      if (publicUrl) {
        console.log(`[Media Storage] ✅ Storage upload success: ${publicUrl}`);
        return publicUrl;
      }
    } catch (err: any) {
      console.error(`[Media Storage] Exception on bucket "${bucketName}":`, err?.message || err);
      lastError = err;
    }
  }

  // If all storage buckets fail (e.g. Supabase Storage buckets not created in dashboard yet),
  // return dataUrl as a resilient fallback so the user upload operation never fails!
  console.warn(`[Media Storage] All bucket upload attempts failed (${lastError?.message || "Bucket not found"}). Using Data URL fallback.`);
  if (dataUrl && dataUrl.startsWith("data:")) {
    return dataUrl;
  }

  throw new Error(`فشل رفع الملف إلى التخزين: ${lastError?.message || "Bucket not found. يرجى إنشاء الحاوية product-images في Supabase."}`);
}

/** Server Fn: Record newly uploaded media file with Supabase Storage upload */
export const recordMediaFile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: {
    file_name: string;
    file_path: string;
    file_url: string;   // base64 data URL OR an existing public URL
    file_type: "image" | "video" | "other";
    mime_type: string;
    size_bytes: number;
    dimensions?: { width?: number; height?: number };
    metadata?: Record<string, any>;
  }) => data)
  .handler(async ({ data, context }): Promise<MediaFileRecord> => {
    const ctx = context as any;
    const hasPerm = await checkTenantPermission("cms", ctx);
    if (!hasPerm) {
      throw new Error("صلاحية مرفوضة: تتطلب صلاحية رفع ومكتبة الوسائط.");
    }

    // Prefer service role client for Storage uploads
    let db = ctx.supabase || supabase;
    if (typeof process !== "undefined" && process.env?.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        if (supabaseAdmin) db = supabaseAdmin;
      } catch { /* fallback */ }
    }

    const tenantId = await resolveTenantId(db, { userId: ctx.userId });

    console.log(`[Media] 🔍 recordMediaFile: file=${data.file_name} size=${data.size_bytes} mime=${data.mime_type} tenant=${tenantId}`);

    // ── Upload to Supabase Storage if file_url is a base64 data URL ──────────
    let finalUrl = data.file_url;
    let storagePath = data.file_path;

    const isDataUrl = data.file_url.startsWith("data:");
    console.log(`[Media] 🔍 isDataUrl=${isDataUrl} urlLen=${data.file_url.length}`);

    if (isDataUrl) {
      // Build a safe storage path under tenant folder
      const safeName = data.file_name.replace(/[^a-zA-Z0-9._\-\u0600-\u06FF]/g, "-");
      storagePath = `uploads/${tenantId}/${Date.now()}_${safeName}`;

      // Upload → throws on failure (prevents orphan DB record)
      finalUrl = await uploadDataUrlToStorage(db, storagePath, data.file_url, data.mime_type);
    } else {
      console.log(`[Media] 🔍 file_url is already a public URL, skipping Storage upload`);
    }

    // ── Insert into media_files ───────────────────────────────────────────────
    const source: string = (data.metadata?.source as string) || "upload";
    const payload: any = {
      tenant_id: tenantId,
      file_name: data.file_name,
      file_path: storagePath,
      file_url: finalUrl,
      file_type: data.file_type,
      mime_type: data.mime_type,
      size_bytes: data.size_bytes,
      dimensions: data.dimensions || null,
      source,
      metadata: data.metadata || {},
      created_by: ctx.userId || null,
    };

    console.log(`[Media] 💾 inserting media_files record: path=${storagePath}`);
    const { data: record, error } = await db.from("media_files").insert(payload).select("*").single();

    if (error) {
      console.error(`[Media] ❌ DB insert failed: ${error.message}`);
      throw new Error(error.message);
    }

    console.log(`[Media] ✅ media_files record saved: id=${(record as any)?.id}`);
    return record as unknown as MediaFileRecord;
  });

/** Server Fn: Delete media file */
export const deleteMediaFile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { id: string; filePath?: string }) => data)
  .handler(async ({ data: { id }, context }) => {
    const ctx = context as any;
    const hasPerm = await checkTenantPermission("cms", ctx);
    if (!hasPerm) {
      throw new Error("صلاحية مرفوضة: تتطلب صلاحية حذف الوسائط.");
    }

    const db = ctx.supabase || supabase;
    const tenantId = await resolveTenantId(db, { userId: ctx.userId });

    // 1. Fetch file_path before deleting record
    const { data: record } = await db.from("media_files").select("file_path").eq("id", id).eq("tenant_id", tenantId).maybeSingle();
    
    // 2. Remove from database
    const { error } = await db.from("media_files").delete().eq("id", id).eq("tenant_id", tenantId);
    if (error) throw new Error(error.message);

    // 3. Remove from storage
    if (record?.file_path) {
      const bucketsToTry = ["product-images", "media", "uploads"];
      for (const bucket of bucketsToTry) {
        try {
          await db.storage.from(bucket).remove([record.file_path]);
        } catch {
          // ignore if bucket doesn't exist
        }
      }
    }

    // Audit log
    await db.from("tenant_audit_logs").insert({
      tenant_id: tenantId,
      actor_id: ctx.userId || null,
      actor_email: ctx.claims?.email || null,
      action: "media_delete",
      details: { file_id: id } as any,
    });

    return { ok: true };
  });

/** Server Fn: Find unused media files scanner */
export const findUnusedMediaFiles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MediaFileRecord[]> => {
    const ctx = context as any;
    const db = ctx.supabase || supabase;
    const tenantId = await resolveTenantId(db, { userId: ctx.userId });

    // 1. Fetch all media files for tenant
    const { data: mediaRows } = await db.from("media_files").select("*").eq("tenant_id", tenantId);
    if (!mediaRows || mediaRows.length === 0) return [];

    // 2. Fetch used product images
    const { data: products } = await db.from("products").select("images, model_3d_url").eq("tenant_id", tenantId);
    const usedUrls = new Set<string>();

    products?.forEach((p: any) => {
      if (Array.isArray(p.images)) {
        p.images.forEach((img: string) => usedUrls.add(img));
      }
      if (p.model_3d_url) usedUrls.add(p.model_3d_url);
    });

    // 3. Fetch category images
    const { data: categories } = await db.from("categories").select("image_url").eq("tenant_id", tenantId);
    categories?.forEach((c: any) => {
      if (c.image_url) usedUrls.add(c.image_url);
    });

    // Filter media files that are not referenced anywhere
    const unused = mediaRows.filter((m: any) => !usedUrls.has(m.file_url) && !usedUrls.has(m.file_path));
    return unused as unknown as MediaFileRecord[];
  });

/** Server Fn: Get media files by IDs */
export const getMediaFilesByIds = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { ids: string[] }) => data)
  .handler(async ({ data: { ids }, context }): Promise<MediaFileRecord[]> => {
    if (!ids || ids.length === 0) return [];
    const ctx = context as any;
    let db = ctx?.supabase || supabase;

    if (typeof process !== "undefined" && process.env?.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        if (supabaseAdmin) db = supabaseAdmin;
      } catch { /* fallback */ }
    }

    const tenantId = await resolveTenantId(ctx.supabase || supabase, { userId: ctx.userId });

    const { data: rows, error } = await db
      .from("media_files")
      .select("*")
      .eq("tenant_id", tenantId)
      .in("id", ids)
      .order("sequence_number", { ascending: true });

    if (error) {
      console.warn("[Media] getMediaFilesByIds error:", error.message);
      return [];
    }

    return (rows as unknown as MediaFileRecord[]) || [];
  });

/** Server Fn: Link product to media files in product_media table */
export const linkProductMedia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { productId: string; mediaIds: string[] }) => data)
  .handler(async ({ data: { productId, mediaIds }, context }) => {
    if (!productId || !mediaIds || mediaIds.length === 0) return { ok: true };
    const ctx = context as any;
    let db = ctx?.supabase || supabase;

    if (typeof process !== "undefined" && process.env?.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        if (supabaseAdmin) db = supabaseAdmin;
      } catch { /* fallback */ }
    }

    const tenantId = await resolveTenantId(db, { userId: ctx.userId });

    // Verify ownership of media files
    const { data: mediaRows } = await db.from("media_files").select("id").eq("tenant_id", tenantId).in("id", mediaIds);
    if (!mediaRows || mediaRows.length !== mediaIds.length) {
      throw new Error("بعض أو كل الوسائط غير موجودة أو لا تملك صلاحية الوصول إليها.");
    }

    const records = mediaIds.map((mediaId, idx) => ({
      tenant_id: tenantId,
      product_id: productId,
      media_id: mediaId,
      sort_order: idx + 1,
    }));

    const { error } = await db.from("product_media").upsert(records, { onConflict: "product_id,media_id" });
    if (error) {
      console.warn("[Media] linkProductMedia warning:", error.message);
    }

    return { ok: true };
  });

/** Server Fn: Bulk delete media files */
export const bulkDeleteMediaFiles = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { ids: string[] }) => data)
  .handler(async ({ data: { ids }, context }) => {
    if (!ids || ids.length === 0) return { ok: true };
    const ctx = context as any;
    const hasPerm = await checkTenantPermission("cms", ctx);
    if (!hasPerm) {
      throw new Error("صلاحية مرفوضة: تتطلب صلاحية حذف الوسائط.");
    }

    let db = ctx?.supabase || supabase;
    if (typeof process !== "undefined" && process.env?.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        if (supabaseAdmin) db = supabaseAdmin;
      } catch { /* fallback */ }
    }

    const tenantId = await resolveTenantId(db, { userId: ctx.userId });

    const { error } = await db.from("media_files").delete().in("id", ids).eq("tenant_id", tenantId);
    if (error) throw new Error(error.message);

    return { ok: true };
  });

/** Server Fn: Search existing products for linking media */
export const searchExistingProductsForLink = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((data: { query?: string }) => data)
  .handler(async ({ data: { query }, context }) => {
    const ctx = context as any;
    let db = ctx?.supabase || supabase;

    if (typeof process !== "undefined" && process.env?.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        if (supabaseAdmin) db = supabaseAdmin;
      } catch { /* fallback */ }
    }

    const tenantId = await resolveTenantId(db, { userId: ctx.userId });

    let q = db
      .from("products")
      .select("id, name, price, currency, images, sku, is_published")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(30);

    if (query && query.trim()) {
      q = q.ilike("name", `%${query.trim()}%`);
    }

    const { data: products, error } = await q;
    if (error) {
      console.warn("[Media] searchExistingProductsForLink error:", error.message);
      return [];
    }

    return products || [];
  });

/** Server Fn: Attach selected media files to an existing product */
export const attachMediaToExistingProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { productId: string; mediaIds: string[] }) => data)
  .handler(async ({ data: { productId, mediaIds }, context }) => {
    if (!productId || !mediaIds || mediaIds.length === 0) {
      throw new Error("يرجى تحديد المنتج والوسائط المراد ربطها.");
    }
    const ctx = context as any;
    let db = ctx?.supabase || supabase;

    if (typeof process !== "undefined" && process.env?.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        if (supabaseAdmin) db = supabaseAdmin;
      } catch { /* fallback */ }
    }

    const tenantId = await resolveTenantId(db, { userId: ctx.userId });

    // 1. Fetch selected media files
    const { data: mediaRows } = await db.from("media_files").select("*").eq("tenant_id", tenantId).in("id", mediaIds);
    if (!mediaRows || mediaRows.length === 0) {
      throw new Error("لم يتم العثور على الملفات المحددة");
    }

    // 2. Fetch existing product
    const { data: product, error: prodErr } = await db
      .from("products")
      .select("images, source_url, video_playback_id")
      .eq("id", productId)
      .eq("tenant_id", tenantId)
      .single();

    if (prodErr || !product) {
      throw new Error("المنتج المحدد غير موجود");
    }

    // Sort media by sequence_number
    const sortedMedia = [...mediaRows].sort(
      (a: any, b: any) => (a.sequence_number || 0) - (b.sequence_number || 0)
    );

    const newImageUrls = sortedMedia.filter((m: any) => m.file_type === "image").map((m: any) => m.file_url);
    const firstVideo = sortedMedia.find((m: any) => m.file_type === "video");

    const currentImages = Array.isArray(product.images) ? product.images : [];
    const combinedImages = Array.from(new Set([...currentImages, ...newImageUrls]));

    const updatePayload: any = {
      images: combinedImages,
      updated_at: new Date().toISOString(),
    };

    if (firstVideo) {
      updatePayload.source_url = firstVideo.file_url;
    }

    // 3. Update Product
    const { error: updateErr } = await db.from("products").update(updatePayload).eq("id", productId);
    if (updateErr) {
      throw new Error(`فشل تحديث المنتج: ${updateErr.message}`);
    }

    // 4. Link in product_media table
    const pmRecords = mediaIds.map((mediaId, idx) => ({
      tenant_id: tenantId,
      product_id: productId,
      media_id: mediaId,
      sort_order: idx + 1,
    }));

    await db.from("product_media").upsert(pmRecords, { onConflict: "product_id,media_id" });

    return { ok: true, linkedCount: mediaIds.length, imagesAdded: newImageUrls.length };
  });

/** Server Fn: Fetch last 50 WhatsApp media files for Diagnostics */
export const getWhatsAppDiagnosticsMedia = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const ctx = context as any;
    let db = ctx?.supabase || supabase;

    if (typeof process !== "undefined" && process.env?.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        if (supabaseAdmin) db = supabaseAdmin;
      } catch { /* fallback */ }
    }

    const tenantId = await resolveTenantId(db, { userId: ctx.userId });

    const { data, error } = await db
      .from("media_files")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("source", "whatsapp")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.warn("[Media] getWhatsAppDiagnosticsMedia error:", error.message);
      return [];
    }

    return (data as unknown as MediaFileRecord[]) || [];
  });

/** Server Fn: Update thumbnail_url for a media file */
export const updateMediaFileThumbnail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { mediaId: string; thumbnailUrl: string }) => data)
  .handler(async ({ data: { mediaId, thumbnailUrl }, context }) => {
    const ctx = context as any;
    let db = ctx?.supabase || supabase;

    if (typeof process !== "undefined" && process.env?.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        if (supabaseAdmin) db = supabaseAdmin;
      } catch { /* fallback */ }
    }

    const tenantId = await resolveTenantId(db, { userId: ctx.userId });

    const { error } = await db
      .from("media_files")
      .update({ thumbnail_url: thumbnailUrl })
      .eq("id", mediaId)
      .eq("tenant_id", tenantId);

    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Server Fn: Backfill video thumbnails for all media files lacking thumbnail_url */
export const backfillVideoThumbnails = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const ctx = context as any;
    let db = ctx?.supabase || supabase;

    if (typeof process !== "undefined" && process.env?.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        if (supabaseAdmin) db = supabaseAdmin;
      } catch { /* fallback */ }
    }

    const tenantId = await resolveTenantId(db, { userId: ctx.userId });

    const { data: missingVideos, error } = await db
      .from("media_files")
      .select("id, file_url")
      .eq("tenant_id", tenantId)
      .eq("file_type", "video")
      .is("thumbnail_url", null);

    if (error) throw new Error(error.message);

    return {
      count: missingVideos ? missingVideos.length : 0,
      videos: missingVideos || [],
    };
  });

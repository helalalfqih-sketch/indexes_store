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
  dimensions?: { width?: number; height?: number } | null;
  metadata?: Record<string, string | number | boolean | null> | null;
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

/** Server Fn: List media files with search & filter */
export const listMediaFiles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((data: { search?: string; type?: string; limit?: number }) => data)
  .handler(async ({ data: { search, type, limit = 100 }, context }): Promise<MediaFileRecord[]> => {
    const ctx = context as any;
    const db = ctx.supabase || supabase;
    const tenantId = await resolveTenantId(db, { userId: ctx.userId });

    let q = db
      .from("media_files")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (type && type !== "all") {
      q = q.eq("file_type", type);
    }

    if (search) {
      q = q.ilike("file_name", `%${search}%`);
    }

    const { data: rows, error } = await q;
    if (error) {
      console.error("Error fetching media files:", error);
      return [];
    }
    return (rows as unknown as MediaFileRecord[]) || [];
  });

/** Server Fn: Record newly uploaded media file */
export const recordMediaFile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: {
    file_name: string;
    file_path: string;
    file_url: string;
    file_type: "image" | "video" | "other";
    mime_type: string;
    size_bytes: number;
    dimensions?: { width?: number; height?: number };
    metadata?: Record<string, string | number | boolean | null>;
  }) => data)
  .handler(async ({ data, context }): Promise<MediaFileRecord> => {
    const ctx = context as any;
    const hasPerm = await checkTenantPermission("cms", ctx);
    if (!hasPerm) {
      throw new Error("صلاحية مرفوضة: تتطلب صلاحية رفع ومكتبة الوسائط.");
    }

    const db = ctx.supabase || supabase;
    const tenantId = await resolveTenantId(db, { userId: ctx.userId });

    const payload: any = {
      tenant_id: tenantId,
      file_name: data.file_name,
      file_path: data.file_path,
      file_url: data.file_url,
      file_type: data.file_type,
      mime_type: data.mime_type,
      size_bytes: data.size_bytes,
      dimensions: data.dimensions || null,
      metadata: data.metadata || {},
      created_by: ctx.userId || null,
    };

    const { data: record, error } = await db.from("media_files").insert(payload).select("*").single();

    if (error) throw new Error(error.message);

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

    const { error } = await db.from("media_files").delete().eq("id", id).eq("tenant_id", tenantId);
    if (error) throw new Error(error.message);

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

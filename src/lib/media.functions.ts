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
    file_url: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop",
    file_type: "image",
    mime_type: "image/jpeg",
    size_bytes: 1450000,
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
    file_url: "https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=800&auto=format&fit=crop",
    file_type: "image",
    mime_type: "image/jpeg",
    size_bytes: 2100000,
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
      let db = supabase;
      if (typeof process !== "undefined" && process.env?.SUPABASE_SERVICE_ROLE_KEY) {
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          if (supabaseAdmin) db = supabaseAdmin;
        } catch {
          db = ctx?.supabase || supabase;
        }
      }

      let q = db
        .from("media_files")
        .select("*")
        .limit(limit);

      if (type && type !== "all") {
        q = q.eq("file_type", type);
      }

      const { data: rows, error } = await q;
      if (error) {
        console.error("Error fetching media files:", error);
      }

      let results = (rows as unknown as MediaFileRecord[]) || [];

      if (results.length === 0) {
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
    metadata?: Record<string, any>;
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

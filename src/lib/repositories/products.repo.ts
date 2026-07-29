/**
 * Products Repository — the ONLY module allowed to query `products` table.
 * All UI/services go through here. Never call supabase.from('products') from UI.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { ProductDTO, ProductMediaItem } from "@/lib/domain/product";

type DB = SupabaseClient<Database>;

export function isVideoUrl(url?: string | null): boolean {
  if (!url || typeof url !== "string") return false;
  const lower = url.trim().toLowerCase();
  if (/\.(mp4|webm|ogg|mov|avi|mkv|m3u8)(\?.*)?$/i.test(lower)) return true;
  if (lower.includes("stream.mux.com") || lower.includes("player.mux.com")) return true;
  if (lower.includes("youtube.com") || lower.includes("youtu.be") || lower.includes("vimeo.com"))
    return true;
  if (lower.startsWith("data:video/")) return true;
  return false;
}

export function extractMuxId(url?: string | null): string | null {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  const m = trimmed.match(/(?:stream\.mux\.com\/|player\.mux\.com\/|mux\.com\/)([A-Za-z0-9]+)/);
  if (m) return m[1];
  if (
    !trimmed.includes("http") &&
    !trimmed.includes("/") &&
    /^[A-Za-z0-9_-]{10,40}$/.test(trimmed)
  ) {
    return trimmed;
  }
  return null;
}

export function buildProductMediaAndVideos(r: any): {
  images: string[];
  videos: string[];
  media: ProductMediaItem[];
} {
  const mediaItems: ProductMediaItem[] = [];
  const seenUrls = new Set<string>();

  const rawImages: string[] = Array.isArray(r.images) ? r.images.filter(Boolean) : [];
  const fallbackPoster = rawImages[0] || (typeof r.image === "string" ? r.image : null);

  // 1. Process joined product_media records if present
  if (Array.isArray(r.product_media) && r.product_media.length > 0) {
    const sortedPM = [...r.product_media].sort(
      (a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
    );
    for (const pm of sortedPM) {
      const file = pm.media_files;
      if (!file || !file.file_url) continue;
      const fileUrl: string = file.file_url;
      if (seenUrls.has(fileUrl)) continue;
      seenUrls.add(fileUrl);

      const isVid = file.file_type === "video" || isVideoUrl(fileUrl);
      if (isVid) {
        mediaItems.push({
          type: "video",
          url: fileUrl,
          poster: file.thumbnail_url || fallbackPoster,
          playbackId: extractMuxId(fileUrl) || extractMuxId(r.video_playback_id),
        });
      } else {
        mediaItems.push({
          type: "image",
          url: fileUrl,
        });
      }
    }
  }

  // 2. Fallback / Supplement: Explicit videos array
  if (Array.isArray(r.videos)) {
    for (const vUrl of r.videos) {
      if (!vUrl || typeof vUrl !== "string" || seenUrls.has(vUrl)) continue;
      seenUrls.add(vUrl);
      mediaItems.push({
        type: "video",
        url: vUrl,
        poster: fallbackPoster,
        playbackId: extractMuxId(vUrl),
      });
    }
  }

  // 3. Fallback / Supplement: video_playback_id column
  if (r.video_playback_id && typeof r.video_playback_id === "string") {
    const vId = r.video_playback_id.trim();
    if (vId) {
      const isUrl = isVideoUrl(vId) || vId.startsWith("http");
      const vUrl = isUrl ? vId : `https://stream.mux.com/${vId}.m3u8`;
      const muxId = extractMuxId(vId) || extractMuxId(vUrl) || (!isUrl ? vId : null);
      const posterUrl = muxId ? `https://image.mux.com/${muxId}/thumbnail.webp` : fallbackPoster;

      if (!seenUrls.has(vUrl)) {
        seenUrls.add(vUrl);
        mediaItems.push({
          type: "video",
          url: vUrl,
          poster: posterUrl,
          playbackId: muxId,
        });
      }
    }
  }

  // 4. Fallback / Supplement: source_url column (often holds video links)
  if (r.source_url && typeof r.source_url === "string" && isVideoUrl(r.source_url)) {
    const sUrl = r.source_url.trim();
    if (!seenUrls.has(sUrl)) {
      seenUrls.add(sUrl);
      mediaItems.push({
        type: "video",
        url: sUrl,
        poster: fallbackPoster,
        playbackId: extractMuxId(sUrl),
      });
    }
  }

  // 5. Fallback / Supplement: images array (check if any entry is actually a video vs image)
  for (const imgUrl of rawImages) {
    if (seenUrls.has(imgUrl)) continue;
    seenUrls.add(imgUrl);
    if (isVideoUrl(imgUrl)) {
      mediaItems.push({
        type: "video",
        url: imgUrl,
        poster: fallbackPoster,
        playbackId: extractMuxId(imgUrl),
      });
    } else {
      mediaItems.push({
        type: "image",
        url: imgUrl,
      });
    }
  }

  // Extract separate arrays for backwards compatibility
  const cleanImages = mediaItems.filter((m) => m.type === "image").map((m) => m.url);
  const cleanVideos = mediaItems.filter((m) => m.type === "video").map((m) => m.url);

  // If no images were classified in mediaItems, fallback to rawImages
  const finalImages = cleanImages.length > 0 ? cleanImages : rawImages;

  return {
    images: finalImages,
    videos: cleanVideos,
    media: mediaItems,
  };
}

const toDTO = (r: any): ProductDTO => {
  const { images, videos, media } = buildProductMediaAndVideos(r);
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    description: r.description ?? "",
    price: Number(r.price),
    currency: r.currency,
    category_id: r.category_id,
    brand: r.brand,
    images,
    videos,
    media,
    model_url: r.model_url,
    stock: r.stock,
    reserved_stock: r.reserved_stock,
    rating: Number(r.rating),
    reviews_count: r.reviews_count,
    tags: r.tags ?? [],
    is_published: r.is_published,
    created_at: r.created_at,
    updated_at: r.updated_at,
    video_playback_id: r.video_playback_id,
    old_price: r.old_price != null ? Number(r.old_price) : null,
    badge: r.badge,
    sku: r.sku,
    barcode: r.barcode,
    compare_at_price: r.compare_at_price != null ? Number(r.compare_at_price) : null,
    cost_price: r.cost_price != null ? Number(r.cost_price) : null,
    model_3d_url: r.model_3d_url,
    model_3d_thumbnail: r.model_3d_thumbnail,
    model_3d_status: r.model_3d_status,
    availability: r.availability,
    condition: r.condition,
    source_url: r.source_url,
    meta_sync_status: r.meta_sync_status,
    featured: r.featured ?? false,
    is_deal: r.is_deal ?? false,
    deal_start: r.deal_start ?? null,
    deal_end: r.deal_end ?? null,
  };
};

const SELECT_MEDIA_JOIN = `
  *,
  product_media (
    sort_order,
    media_files (
      id,
      file_url,
      file_type,
      thumbnail_url,
      sequence_number
    )
  )
`;

export interface ProductFilters {
  tenantId?: string;
  categoryId?: string;
  search?: string;
  limit?: number;
  offset?: number;
  includeUnpublished?: boolean;
}

export type ProductCreateInput = Omit<
  Database["public"]["Tables"]["products"]["Insert"],
  "tenant_id"
>;

export const productsRepo = {
  async list(db: DB, filters: ProductFilters = {}): Promise<ProductDTO[]> {
    let q: any;
    try {
      q = db.from("products").select(SELECT_MEDIA_JOIN).order("created_at", { ascending: false });
    } catch {
      q = db.from("products").select("*").order("created_at", { ascending: false });
    }

    if (filters.tenantId) q = q.eq("tenant_id", filters.tenantId);
    if (!filters.includeUnpublished) q = q.eq("is_published", true);
    if (filters.categoryId) q = q.eq("category_id", filters.categoryId);
    if (filters.search) q = q.ilike("name", `%${filters.search}%`);
    if (filters.limit) q = q.limit(filters.limit);
    if (filters.offset != null && filters.limit) {
      q = q.range(filters.offset, filters.offset + filters.limit - 1);
    }
    let { data, error } = await q;

    if (error && error.message?.includes("product_media")) {
      // Fallback query if product_media table/relation query errors out
      let fallbackQ = db.from("products").select("*").order("created_at", { ascending: false });
      if (filters.tenantId) fallbackQ = fallbackQ.eq("tenant_id", filters.tenantId);
      if (!filters.includeUnpublished) fallbackQ = fallbackQ.eq("is_published", true);
      if (filters.categoryId) fallbackQ = fallbackQ.eq("category_id", filters.categoryId);
      if (filters.search) fallbackQ = fallbackQ.ilike("name", `%${filters.search}%`);
      if (filters.limit) fallbackQ = fallbackQ.limit(filters.limit);
      if (filters.offset != null && filters.limit) {
        fallbackQ = fallbackQ.range(filters.offset, filters.offset + filters.limit - 1);
      }
      const res = await fallbackQ;
      data = res.data;
      error = res.error;
    }

    if (error) throw error;
    return (data ?? []).map(toDTO);
  },

  async getBySlug(db: DB, slug: string, tenantId?: string): Promise<ProductDTO | null> {
    let q: any = db.from("products").select(SELECT_MEDIA_JOIN).eq("slug", slug);
    if (tenantId) q = q.eq("tenant_id", tenantId);
    let { data, error } = await q.maybeSingle();

    if (error && error.message?.includes("product_media")) {
      let fallbackQ = db.from("products").select("*").eq("slug", slug);
      if (tenantId) fallbackQ = fallbackQ.eq("tenant_id", tenantId);
      const res = await fallbackQ.maybeSingle();
      data = res.data;
      error = res.error;
    }

    if (error) throw error;
    return data ? toDTO(data) : null;
  },

  async getById(db: DB, id: string, tenantId?: string): Promise<ProductDTO | null> {
    let q: any = db.from("products").select(SELECT_MEDIA_JOIN).eq("id", id);
    if (tenantId) q = q.eq("tenant_id", tenantId);
    let { data, error } = await q.maybeSingle();

    if (error && error.message?.includes("product_media")) {
      let fallbackQ = db.from("products").select("*").eq("id", id);
      if (tenantId) fallbackQ = fallbackQ.eq("tenant_id", tenantId);
      const res = await fallbackQ.maybeSingle();
      data = res.data;
      error = res.error;
    }

    if (error) throw error;
    return data ? toDTO(data) : null;
  },

  async create(db: DB, tenantId: string, input: ProductCreateInput): Promise<ProductDTO> {
    if (!tenantId) throw new Error("productsRepo.create: tenantId required");
    const { data, error } = await db
      .from("products")
      .insert({ ...input, tenant_id: tenantId })
      .select("*")
      .single();
    if (error) throw error;
    return toDTO(data);
  },

  async update(
    db: DB,
    tenantId: string,
    id: string,
    patch: Database["public"]["Tables"]["products"]["Update"],
  ): Promise<ProductDTO> {
    if (!tenantId) throw new Error("productsRepo.update: tenantId required");
    const { data, error } = await db
      .from("products")
      .update(patch)
      .eq("id", id)
      .eq("tenant_id", tenantId)
      .select("*")
      .single();
    if (error) throw error;
    return toDTO(data);
  },

  async remove(db: DB, tenantId: string, id: string): Promise<void> {
    if (!tenantId) throw new Error("productsRepo.remove: tenantId required");
    const { error } = await db.from("products").delete().eq("id", id).eq("tenant_id", tenantId);
    if (error) throw error;
  },

  async count(
    db: DB,
    filters: Pick<ProductFilters, "tenantId" | "includeUnpublished" | "categoryId"> = {},
  ): Promise<number> {
    let q = db.from("products").select("*", { count: "exact", head: true });
    if (filters.tenantId) q = q.eq("tenant_id", filters.tenantId);
    if (!filters.includeUnpublished) q = q.eq("is_published", true);
    if (filters.categoryId) q = q.eq("category_id", filters.categoryId);
    const { count, error } = await q;
    if (error) throw error;
    return count ?? 0;
  },
};

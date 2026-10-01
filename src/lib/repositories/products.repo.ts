/**
 * Products Repository — the ONLY module allowed to query `products` table.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { ProductDTO, ProductMediaItem } from "@/lib/domain/product";

type DB = SupabaseClient<Database>;
type ProductRow = Database["public"]["Tables"]["products"]["Row"];

type ProductMediaLink = {
  product_id: string;
  media_id: string;
  sort_order: number | null;
};

type MediaFile = {
  id: string;
  file_url: string;
  file_type: string | null;
  thumbnail_url: string | null;
  sequence_number: number | null;
};

type JoinedProductMedia = {
  sort_order: number | null;
  media_files: MediaFile;
};

type ProductMediaSource = {
  images?: string[] | null;
  image?: string | null;
  videos?: string[] | null;
  product_media?: JoinedProductMedia[];
  video_playback_id?: string | null;
  source_url?: string | null;
};

type ProductSourceRow = ProductRow & ProductMediaSource;

type MediaDatabase = Database & {
  public: Database["public"] & {
    Tables: Database["public"]["Tables"] & {
      product_media: {
        Row: ProductMediaLink;
        Insert: ProductMediaLink;
        Update: Partial<ProductMediaLink>;
        Relationships: [];
      };
      media_files: {
        Row: MediaFile;
        Insert: MediaFile;
        Update: Partial<MediaFile>;
        Relationships: [];
      };
    };
  };
};

type MediaDB = SupabaseClient<MediaDatabase>;

export function isVideoUrl(url?: string | null): boolean {
  if (!url || typeof url !== "string") return false;
  const lower = url.trim().toLowerCase();
  if (/\.(mp4|webm|ogg|mov|avi|mkv|m3u8)(\?.*)?$/i.test(lower)) return true;
  if (lower.includes("stream.mux.com") || lower.includes("player.mux.com")) return true;
  if (lower.includes("youtube.com") || lower.includes("youtu.be") || lower.includes("vimeo.com")) {
    return true;
  }
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
    if (
      trimmed.startsWith("demo-") ||
      trimmed.startsWith("mux-playback-") ||
      trimmed.startsWith("test-") ||
      trimmed.includes(" ")
    ) {
      return null;
    }
    return trimmed;
  }
  return null;
}

export function buildProductMediaAndVideos(r: ProductMediaSource): {
  images: string[];
  videos: string[];
  media: ProductMediaItem[];
} {
  const mediaItems: ProductMediaItem[] = [];
  const seenUrls = new Set<string>();
  const rawImages = Array.isArray(r.images) ? r.images.filter(Boolean) : [];
  const fallbackPoster = rawImages[0] || (typeof r.image === "string" ? r.image : null);

  if (Array.isArray(r.product_media) && r.product_media.length > 0) {
    const sortedPM = [...r.product_media].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    for (const pm of sortedPM) {
      const file = pm.media_files;
      if (!file?.file_url) continue;
      const fileUrl = file.file_url;
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
        mediaItems.push({ type: "image", url: fileUrl });
      }
    }
  }

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

  if (r.video_playback_id && typeof r.video_playback_id === "string") {
    const vId = r.video_playback_id.trim();
    if (vId) {
      const isUrl = isVideoUrl(vId) || vId.startsWith("http");
      const vUrl = isUrl ? vId : `https://stream.mux.com/${vId}.m3u8`;
      const muxId = extractMuxId(vId) || extractMuxId(vUrl) || (!isUrl ? vId : null);
      const posterUrl = muxId ? `https://image.mux.com/${muxId}/thumbnail.webp` : fallbackPoster;
      if (!seenUrls.has(vUrl)) {
        seenUrls.add(vUrl);
        mediaItems.push({ type: "video", url: vUrl, poster: posterUrl, playbackId: muxId });
      }
    }
  }

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
      mediaItems.push({ type: "image", url: imgUrl });
    }
  }

  const cleanImages = mediaItems.filter((m) => m.type === "image").map((m) => m.url);
  const cleanVideos = mediaItems.filter((m) => m.type === "video").map((m) => m.url);
  return {
    images: cleanImages.length > 0 ? cleanImages : rawImages,
    videos: cleanVideos,
    media: mediaItems,
  };
}

const toDTO = (r: ProductSourceRow): ProductDTO => {
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

async function hydrateProductMedia(db: DB, rows: ProductRow[]): Promise<ProductSourceRow[]> {
  if (rows.length === 0) return rows;
  const productIds = rows.map((row) => row.id).filter(Boolean);
  if (productIds.length === 0) return rows;

  const mediaDb = db as unknown as MediaDB;
  const { data: links, error: linksError } = await mediaDb
    .from("product_media")
    .select("product_id, media_id, sort_order")
    .in("product_id", productIds)
    .order("sort_order", { ascending: true });

  if (linksError || !links?.length) return rows;

  const mediaIds = [...new Set(links.map((link) => link.media_id).filter(Boolean))];
  if (mediaIds.length === 0) return rows;

  const { data: files, error: filesError } = await mediaDb
    .from("media_files")
    .select("id, file_url, file_type, thumbnail_url, sequence_number")
    .in("id", mediaIds);

  if (filesError || !files?.length) return rows;

  const filesById = new Map(files.map((file) => [file.id, file]));
  const linksByProduct = new Map<string, JoinedProductMedia[]>();
  for (const link of links) {
    const file = filesById.get(link.media_id);
    if (!file) continue;
    const current = linksByProduct.get(link.product_id) ?? [];
    current.push({ sort_order: link.sort_order, media_files: file });
    linksByProduct.set(link.product_id, current);
  }

  return rows.map((row) => ({ ...row, product_media: linksByProduct.get(row.id) ?? [] }));
}

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
    let q = db
      .from("products")
      .select("*")
      .order("created_at", { ascending: false })
      .order("id", { ascending: true });
    if (filters.tenantId) q = q.eq("tenant_id", filters.tenantId);
    if (!filters.includeUnpublished) q = q.eq("is_published", true);
    if (filters.categoryId) q = q.eq("category_id", filters.categoryId);
    if (filters.search) q = q.ilike("name", `%${filters.search}%`);
    if (filters.limit) q = q.limit(filters.limit);
    if (filters.offset != null && filters.limit) {
      q = q.range(filters.offset, filters.offset + filters.limit - 1);
    } else if (filters.offset != null) {
      q = q.range(filters.offset, filters.offset + 999);
    }

    const { data, error } = await q;
    if (error) throw error;
    const hydrated = await hydrateProductMedia(db, data ?? []);
    return hydrated.map(toDTO);
  },

  async getBySlug(db: DB, slug: string, tenantId?: string): Promise<ProductDTO | null> {
    let q = db.from("products").select("*").eq("slug", slug);
    if (tenantId) q = q.eq("tenant_id", tenantId);
    const { data, error } = await q.maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const [hydrated] = await hydrateProductMedia(db, [data]);
    return toDTO(hydrated);
  },

  async getById(db: DB, id: string, tenantId?: string): Promise<ProductDTO | null> {
    let q = db.from("products").select("*").eq("id", id);
    if (tenantId) q = q.eq("tenant_id", tenantId);
    const { data, error } = await q.maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const [hydrated] = await hydrateProductMedia(db, [data]);
    return toDTO(hydrated);
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

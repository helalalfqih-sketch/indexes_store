/**
 * Products Repository — the ONLY module allowed to query `products` table.
 * All UI/services go through here. Never call supabase.from('products') from UI.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { ProductDTO } from "@/lib/domain/product";

type DB = SupabaseClient<Database>;
type Row = Database["public"]["Tables"]["products"]["Row"];

const toDTO = (r: Row): ProductDTO => ({
  id: r.id,
  slug: r.slug,
  name: r.name,
  description: r.description ?? "",
  price: Number(r.price),
  currency: r.currency,
  category_id: r.category_id,
  brand: r.brand,
  images: r.images ?? [],
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
  // V3 CMS fields
  featured: r.featured ?? false,
  is_deal: r.is_deal ?? false,
  deal_start: r.deal_start ?? null,
  deal_end: r.deal_end ?? null,
});


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
    let q = db.from("products").select("*").order("created_at", { ascending: false });
    if (filters.tenantId) q = q.eq("tenant_id", filters.tenantId);
    if (!filters.includeUnpublished) q = q.eq("is_published", true);
    if (filters.categoryId) q = q.eq("category_id", filters.categoryId);
    if (filters.search) q = q.ilike("name", `%${filters.search}%`);
    if (filters.limit) q = q.limit(filters.limit);
    if (filters.offset != null && filters.limit) {
      q = q.range(filters.offset, filters.offset + filters.limit - 1);
    }
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []).map(toDTO);
  },

  async getBySlug(db: DB, slug: string, tenantId?: string): Promise<ProductDTO | null> {
    let q = db.from("products").select("*").eq("slug", slug);
    if (tenantId) q = q.eq("tenant_id", tenantId);
    const { data, error } = await q.maybeSingle();
    if (error) throw error;
    return data ? toDTO(data) : null;
  },

  async getById(db: DB, id: string, tenantId?: string): Promise<ProductDTO | null> {
    let q = db.from("products").select("*").eq("id", id);
    if (tenantId) q = q.eq("tenant_id", tenantId);
    const { data, error } = await q.maybeSingle();
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

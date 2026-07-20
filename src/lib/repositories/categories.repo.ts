/**
 * Categories Repository — the ONLY module allowed to query `categories`.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { CategoryDTO } from "@/lib/domain/product";

type DB = SupabaseClient<Database>;
type Row = Database["public"]["Tables"]["categories"]["Row"];

export type CategoryWithMetaDTO = CategoryDTO & {
  icon: string | null;
  color: string | null;
  is_active: boolean;
};

const toDTO = (r: Row): CategoryWithMetaDTO => ({
  id: r.id,
  slug: r.slug,
  name: r.name,
  description: r.description,
  image_url: r.image_url,
  parent_id: r.parent_id,
  sort: r.sort,
  icon: r.icon,
  color: r.color,
  is_active: r.is_active,
});

export type CategoryCreateInput = Omit<
  Database["public"]["Tables"]["categories"]["Insert"],
  "tenant_id"
>;

export const categoriesRepo = {
  async list(
    db: DB,
    opts: { tenantId?: string; includeInactive?: boolean } = {},
  ): Promise<CategoryWithMetaDTO[]> {
    let q = db.from("categories").select("*").order("sort", { ascending: true });
    if (opts.tenantId) q = q.eq("tenant_id", opts.tenantId);
    if (!opts.includeInactive) q = q.eq("is_active", true);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []).map(toDTO);
  },

  async getBySlug(db: DB, slug: string, tenantId?: string): Promise<CategoryWithMetaDTO | null> {
    let q = db.from("categories").select("*").eq("slug", slug);
    if (tenantId) q = q.eq("tenant_id", tenantId);
    const { data, error } = await q.maybeSingle();
    if (error) throw error;
    return data ? toDTO(data) : null;
  },

  async getById(db: DB, id: string, tenantId?: string): Promise<CategoryWithMetaDTO | null> {
    let q = db.from("categories").select("*").eq("id", id);
    if (tenantId) q = q.eq("tenant_id", tenantId);
    const { data, error } = await q.maybeSingle();
    if (error) throw error;
    return data ? toDTO(data) : null;
  },

  async create(db: DB, tenantId: string, input: CategoryCreateInput): Promise<CategoryWithMetaDTO> {
    if (!tenantId) throw new Error("categoriesRepo.create: tenantId required");
    const { data, error } = await db
      .from("categories")
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
    patch: Database["public"]["Tables"]["categories"]["Update"],
  ): Promise<CategoryWithMetaDTO> {
    if (!tenantId) throw new Error("categoriesRepo.update: tenantId required");
    const { data, error } = await db
      .from("categories")
      .update(patch)
      .eq("id", id)
      .eq("tenant_id", tenantId)
      .select("*")
      .single();
    if (error) throw error;
    return toDTO(data);
  },

  async remove(db: DB, tenantId: string, id: string): Promise<void> {
    if (!tenantId) throw new Error("categoriesRepo.remove: tenantId required");
    const { error } = await db.from("categories").delete().eq("id", id).eq("tenant_id", tenantId);
    if (error) throw error;
  },
};

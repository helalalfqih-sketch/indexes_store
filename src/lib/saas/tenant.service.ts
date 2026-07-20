/**
 * Tenant Service — business logic for tenants (create / suspend / plan).
 * Repositories not extracted since the ops are simple. If they grow,
 * split into `src/lib/repositories/tenants.repo.ts`.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type DB = SupabaseClient<Database>;
type TenantRow = Database["public"]["Tables"]["tenants"]["Row"];

export const tenantService = {
  async list(db: DB): Promise<TenantRow[]> {
    const { data, error } = await db
      .from("tenants")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async get(db: DB, id: string): Promise<TenantRow | null> {
    const { data, error } = await db.from("tenants").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return data;
  },

  async create(
    db: DB,
    input: {
      slug: string;
      name: string;
      owner_user_id?: string | null;
      plan?: Database["public"]["Enums"]["tenant_plan"];
    },
  ): Promise<TenantRow> {
    const { data, error } = await db
      .from("tenants")
      .insert({
        slug: input.slug,
        name: input.name,
        owner_user_id: input.owner_user_id ?? null,
        plan: input.plan ?? "free",
        status: "active",
      })
      .select("*")
      .single();
    if (error) throw error;
    return data;
  },

  async setStatus(
    db: DB,
    id: string,
    status: Database["public"]["Enums"]["tenant_status"],
  ): Promise<TenantRow> {
    const { data, error } = await db
      .from("tenants")
      .update({ status })
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return data;
  },

  async setPlan(
    db: DB,
    id: string,
    plan: Database["public"]["Enums"]["tenant_plan"],
  ): Promise<TenantRow> {
    const { data, error } = await db
      .from("tenants")
      .update({ plan })
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return data;
  },

  async usage(db: DB, tenantId: string): Promise<{ products: number; categories: number; members: number }> {
    const [{ count: products }, { count: categories }, { count: members }] = await Promise.all([
      db.from("products").select("*", { count: "exact", head: true }).eq("tenant_id", tenantId),
      db.from("categories").select("*", { count: "exact", head: true }).eq("tenant_id", tenantId),
      db.from("tenant_members").select("*", { count: "exact", head: true }).eq("tenant_id", tenantId),
    ]);
    return { products: products ?? 0, categories: categories ?? 0, members: members ?? 0 };
  },
};

/**
 * Inventory Repository — records stock movements. The DB trigger applies
 * the delta to `products.stock` atomically.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type DB = SupabaseClient<Database>;
type Row = Database["public"]["Tables"]["inventory_movements"]["Row"];

export type InventoryMovementDTO = {
  id: string;
  product_id: string;
  delta: number;
  reason: string;
  reference: string | null;
  note: string | null;
  created_by: string | null;
  created_at: string;
};

const toDTO = (r: Row): InventoryMovementDTO => ({
  id: r.id,
  product_id: r.product_id,
  delta: r.delta,
  reason: r.reason,
  reference: r.reference,
  note: r.note,
  created_by: r.created_by,
  created_at: r.created_at,
});

export const inventoryRepo = {
  async listByProduct(
    db: DB,
    tenantId: string,
    productId: string,
    limit = 50,
  ): Promise<InventoryMovementDTO[]> {
    if (!tenantId) throw new Error("inventoryRepo.listByProduct: tenantId required");
    const { data, error } = await db
      .from("inventory_movements")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("product_id", productId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []).map(toDTO);
  },

  async record(
    db: DB,
    tenantId: string,
    input: {
      product_id: string;
      delta: number;
      reason: string;
      reference?: string | null;
      note?: string | null;
      created_by?: string | null;
    },
  ): Promise<InventoryMovementDTO> {
    if (!tenantId) throw new Error("inventoryRepo.record: tenantId required");
    const { data, error } = await db
      .from("inventory_movements")
      .insert({ ...input, tenant_id: tenantId })
      .select("*")
      .single();
    if (error) throw error;
    return toDTO(data);
  },
};

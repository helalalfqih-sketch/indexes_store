/**
 * Inventory Actions — UI-facing wrapper over inventory server functions.
 * Admin CRUD screens (Phase 4B) will consume these.
 */
import { z } from "zod";
import {
  adminRecordInventory,
  adminListInventory,
} from "@/lib/catalog.functions";

export const adjustStockInput = z.object({
  productId: z.string().uuid(),
  delta: z.number().int(),
  reason: z.string().trim().max(200).optional(),
  tenantId: z.string().uuid().optional(),
});
export type AdjustStockInput = z.infer<typeof adjustStockInput>;

export async function adjustStock(input: AdjustStockInput) {
  const data = adjustStockInput.parse(input);
  return adminRecordInventory({ data });
}

export async function fetchMovements(productId: string) {
  return adminListInventory({ data: { productId } });
}

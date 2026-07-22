/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { resolveCurrentTenant } from "@/lib/saas/tenant-resolver";
import * as svc from "@/lib/services/store-dashboard.service";

/**
 * /store/* server functions. Auth model:
 *  - tenant_id is ALWAYS resolved server-side from the caller's membership
 *    (never accepted from the client payload);
 *  - explicit role check via has_tenant_permission RPC per operation
 *    (writes: staff+; customer data: staff+; reads: viewer+);
 *  - member RLS policies are the database backstop.
 */

async function ctxOf(context: unknown) {
  const { supabase, userId } = context as { supabase: any; userId: string };
  const tenantId = await resolveCurrentTenant(supabase, { userId });
  return { supabase, userId, tenantId };
}

async function allow(
  db: any,
  tenantId: string,
  userId: string,
  role: "viewer" | "staff" | "manager" | "owner",
): Promise<boolean> {
  const { data } = await db.rpc("has_tenant_permission", {
    _tenant_id: tenantId,
    _user_id: userId,
    _required_role: role,
  });
  return Boolean(data);
}

// ── Products ─────────────────────────────────────────────────────────────────

export const getStoreProducts = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) =>
    z
      .object({
        search: z.string().trim().max(120).optional(),
        onlyDrafts: z.boolean().optional(),
        onlyLow: z.boolean().optional(),
      })
      .optional()
      .parse(raw),
  )
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }): Promise<svc.StoreProduct[]> => {
    const { supabase, userId, tenantId } = await ctxOf(context);
    if (!(await allow(supabase, tenantId, userId, "viewer"))) return [];
    return svc.listStoreProducts(supabase, tenantId, data ?? {});
  });

export const createStoreProduct = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) =>
    z
      .object({
        name: z.string().trim().min(2, "اسم المنتج قصير").max(200),
        price: z.number().min(0),
        stock: z.number().int().min(0).default(0),
        image: z.string().trim().url().max(600).optional(),
        is_published: z.boolean().default(false),
        description: z.string().trim().max(4000).optional(),
      })
      .parse(raw),
  )
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }): Promise<{ success: boolean; message?: string; id?: string }> => {
    const { supabase, userId, tenantId } = await ctxOf(context);
    if (!(await allow(supabase, tenantId, userId, "staff"))) {
      return { success: false, message: "غير مسموح: إدارة المنتجات تتطلب دور موظف فأعلى" };
    }
    const res = await svc.createStoreProduct(supabase, tenantId, data);
    return res.ok ? { success: true, id: res.id } : { success: false, message: res.message };
  });

export const updateStoreProduct = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        name: z.string().trim().min(2).max(200).optional(),
        price: z.number().min(0).optional(),
        stock: z.number().int().min(0).optional(),
        is_published: z.boolean().optional(),
      })
      .parse(raw),
  )
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }): Promise<{ success: boolean; message?: string }> => {
    const { supabase, userId, tenantId } = await ctxOf(context);
    if (!(await allow(supabase, tenantId, userId, "staff"))) {
      return { success: false, message: "غير مسموح: إدارة المنتجات تتطلب دور موظف فأعلى" };
    }
    const { id, ...patch } = data;
    const res = await svc.updateStoreProduct(supabase, tenantId, id, patch);
    return res.ok ? { success: true } : { success: false, message: res.message };
  });

export const deleteStoreProduct = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => z.object({ id: z.string().uuid() }).parse(raw))
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }): Promise<{ success: boolean; message?: string }> => {
    const { supabase, userId, tenantId } = await ctxOf(context);
    if (!(await allow(supabase, tenantId, userId, "manager"))) {
      return { success: false, message: "غير مسموح: حذف المنتجات لمدير المتجر فأعلى" };
    }
    const res = await svc.deleteStoreProduct(supabase, tenantId, data.id);
    return res.ok ? { success: true } : { success: false, message: res.message };
  });

// ── Inventory ────────────────────────────────────────────────────────────────

export const getStoreInventory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ movements: svc.InventoryMovement[]; lowStock: svc.StoreProduct[] }> => {
    const { supabase, userId, tenantId } = await ctxOf(context);
    if (!(await allow(supabase, tenantId, userId, "viewer"))) return { movements: [], lowStock: [] };
    const [movements, lowStock] = await Promise.all([
      svc.listInventoryMovements(supabase, tenantId),
      svc.listStoreProducts(supabase, tenantId, { onlyLow: true }),
    ]);
    return { movements, lowStock };
  });

export const recordStoreInventory = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) =>
    z
      .object({
        productId: z.string().uuid(),
        delta: z.number().int().min(-9999).max(9999).refine((v) => v !== 0, "القيمة لا يمكن أن تكون صفراً"),
        reason: z.enum(["restock", "adjustment", "damage", "return"]),
        note: z.string().trim().max(300).optional(),
      })
      .parse(raw),
  )
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }): Promise<{ success: boolean; message?: string }> => {
    const { supabase, userId, tenantId } = await ctxOf(context);
    if (!(await allow(supabase, tenantId, userId, "staff"))) {
      return { success: false, message: "غير مسموح: تسجيل حركات المخزون يتطلب دور موظف فأعلى" };
    }
    const res = await svc.recordInventoryMovement(supabase, tenantId, data, userId);
    return res.ok ? { success: true } : { success: false, message: res.message };
  });

// ── Customers & analytics ────────────────────────────────────────────────────

export const getStoreCustomers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<svc.StoreCustomer[]> => {
    const { supabase, userId, tenantId } = await ctxOf(context);
    // Customer PII is staff-level (privacy: viewers don't see contact data).
    if (!(await allow(supabase, tenantId, userId, "staff"))) return [];
    return svc.listStoreCustomers(supabase, tenantId);
  });

export const getStoreTopProducts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<svc.TopProduct[]> => {
    const { supabase, userId, tenantId } = await ctxOf(context);
    if (!(await allow(supabase, tenantId, userId, "viewer"))) return [];
    return svc.listTopProducts(supabase, tenantId);
  });

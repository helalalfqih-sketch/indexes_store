/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import * as adminStore from "@/lib/services/admin-store.service";
import { upsertStoreProfile } from "@/lib/services/store.service";
import { storeProfileSchema } from "@/lib/validators/store";

/**
 * /admin/stores server functions — PLATFORM ADMIN ONLY.
 * Every handler: verified admin (has_role RPC) + zod input + service-layer
 * I/O + append-only audit entry for every mutation. RLS is the backstop.
 */

async function requirePlatformAdmin(
  db: any,
  userId: string,
): Promise<{ ok: boolean; email: string | null }> {
  const { data: isAdmin } = await db.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (!isAdmin) return { ok: false, email: null };
  const { data: userData } = await db.auth.getUser();
  return { ok: true, email: userData?.user?.email ?? null };
}

const tenantIdSchema = z.object({ tenantId: z.string().uuid() });

export const listStoresAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<adminStore.StoreListItem[]> => {
    const { supabase, userId } = context as unknown as { supabase: any; userId: string };
    const gate = await requirePlatformAdmin(supabase, userId);
    if (!gate.ok) return [];
    return adminStore.listStoresWithStats(supabase);
  });

export const getStoreDetailsAdmin = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) => tenantIdSchema.parse(raw))
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }): Promise<adminStore.StoreDetails | null> => {
    const { supabase, userId } = context as unknown as { supabase: any; userId: string };
    const gate = await requirePlatformAdmin(supabase, userId);
    if (!gate.ok) return null;
    return adminStore.getStoreDetails(supabase, data.tenantId);
  });

export const updateStoreStatusAdmin = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) =>
    tenantIdSchema.extend({ status: z.enum(["active", "suspended", "pending"]) }).parse(raw),
  )
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }): Promise<{ success: boolean; message?: string }> => {
    const { supabase, userId } = context as unknown as { supabase: any; userId: string };
    const gate = await requirePlatformAdmin(supabase, userId);
    if (!gate.ok) return { success: false, message: "غير مسموح: صلاحية مدير المنصّة مطلوبة" };

    const res = await adminStore.updateStoreStatus(supabase, data.tenantId, data.status);
    if (!res.ok) return { success: false, message: res.message };

    await adminStore.logAudit(supabase, {
      tenantId: data.tenantId,
      actorId: userId,
      actorEmail: gate.email,
      action: "status_change",
      details: { status: data.status },
    });
    return { success: true };
  });

export const updateStorePlanAdmin = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) =>
    tenantIdSchema
      .extend({
        plan: z.enum(["free", "pro", "enterprise"]),
        periodEnd: z.string().datetime().nullable().optional(),
      })
      .parse(raw),
  )
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }): Promise<{ success: boolean; message?: string }> => {
    const { supabase, userId } = context as unknown as { supabase: any; userId: string };
    const gate = await requirePlatformAdmin(supabase, userId);
    if (!gate.ok) return { success: false, message: "غير مسموح: صلاحية مدير المنصّة مطلوبة" };

    const res = await adminStore.updateStorePlan(supabase, data.tenantId, data.plan, data.periodEnd ?? null);
    if (!res.ok) return { success: false, message: res.message };

    await adminStore.logAudit(supabase, {
      tenantId: data.tenantId,
      actorId: userId,
      actorEmail: gate.email,
      action: "plan_change",
      details: { plan: data.plan, periodEnd: data.periodEnd ?? null },
    });
    return { success: true };
  });

export const updateStoreProfileAdmin = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) =>
    z.object({ tenantId: z.string().uuid(), profile: storeProfileSchema }).parse(raw),
  )
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }): Promise<{ success: boolean; message?: string }> => {
    const { supabase, userId } = context as unknown as { supabase: any; userId: string };
    const gate = await requirePlatformAdmin(supabase, userId);
    if (!gate.ok) return { success: false, message: "غير مسموح: صلاحية مدير المنصّة مطلوبة" };

    const res = await upsertStoreProfile(supabase, data.tenantId, data.profile);
    if (!res.ok) return { success: false, message: res.message };

    await adminStore.logAudit(supabase, {
      tenantId: data.tenantId,
      actorId: userId,
      actorEmail: gate.email,
      action: "profile_update",
      details: { fields: Object.keys(data.profile) },
    });
    return { success: true };
  });

export const upsertStoreMemberAdmin = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) =>
    tenantIdSchema
      .extend({
        userId: z.string().uuid(),
        role: z.enum(["owner", "manager", "staff", "viewer"]),
      })
      .parse(raw),
  )
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }): Promise<{ success: boolean; message?: string }> => {
    const { supabase, userId } = context as unknown as { supabase: any; userId: string };
    const gate = await requirePlatformAdmin(supabase, userId);
    if (!gate.ok) return { success: false, message: "غير مسموح: صلاحية مدير المنصّة مطلوبة" };

    const res = await adminStore.upsertStoreMember(supabase, data.tenantId, data.userId, data.role);
    if (!res.ok) return { success: false, message: res.message };

    await adminStore.logAudit(supabase, {
      tenantId: data.tenantId,
      actorId: userId,
      actorEmail: gate.email,
      action: "member_upsert",
      details: { memberId: data.userId, role: data.role },
    });
    return { success: true };
  });

export const removeStoreMemberAdmin = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => tenantIdSchema.extend({ userId: z.string().uuid() }).parse(raw))
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }): Promise<{ success: boolean; message?: string }> => {
    const { supabase, userId } = context as unknown as { supabase: any; userId: string };
    const gate = await requirePlatformAdmin(supabase, userId);
    if (!gate.ok) return { success: false, message: "غير مسموح: صلاحية مدير المنصّة مطلوبة" };

    const res = await adminStore.removeStoreMember(supabase, data.tenantId, data.userId);
    if (!res.ok) return { success: false, message: res.message };

    await adminStore.logAudit(supabase, {
      tenantId: data.tenantId,
      actorId: userId,
      actorEmail: gate.email,
      action: "member_remove",
      details: { memberId: data.userId },
    });
    return { success: true };
  });

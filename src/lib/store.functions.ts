/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { resolveCurrentTenant } from "@/lib/saas/tenant-resolver";
import {
  storeProfileSchema,
  upsertStoreSettingSchema,
} from "@/lib/validators/store";
import * as storeService from "@/lib/services/store.service";

/**
 * Store server functions (Tenant = Electronic Store).
 * Auth model: caller's RLS-scoped client + explicit role check via the
 * has_tenant_permission RPC (owner-level for identity/settings writes);
 * RLS policies are the database backstop.
 */

async function getCallerRole(db: any, tenantId: string, userId: string): Promise<string | null> {
  const { data } = await db
    .from("tenant_members")
    .select("role")
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .maybeSingle();
  return data?.role ?? null;
}

async function requireTenantRole(
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

export interface MyStore {
  tenantId: string;
  name: string;
  slug: string;
  status: string;
  plan: string;
  myRole: string | null;
  profile: storeService.StoreProfileRow | null;
  settings: storeService.StoreSettingRow[];
  subscription: any | null;
}

/** The caller's store (tenant) with profile, settings and their role. */
export const getMyStore = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MyStore | null> => {
    const { supabase, userId } = context as unknown as { supabase: any; userId: string };

    const tenantId = await resolveCurrentTenant(supabase, { userId });
    const { data: tenant } = await supabase
      .from("tenants")
      .select("id, name, slug, status, plan")
      .eq("id", tenantId)
      .maybeSingle();
    if (!tenant) return null;

    const [myRole, profile, settings, subscription] = await Promise.all([
      getCallerRole(supabase, tenantId, userId),
      storeService.getStoreProfile(supabase, tenantId),
      storeService.listStoreSettings(supabase, tenantId),
      storeService.getLatestSubscription(supabase, tenantId),
    ]);

    // Non-members get nothing (defense-in-depth; RLS already hides rows).
    if (!myRole) return null;

    return {
      tenantId,
      name: tenant.name,
      slug: tenant.slug,
      status: tenant.status,
      plan: tenant.plan,
      myRole,
      profile,
      settings,
      subscription,
    };
  });

/** Update the store identity (owner-level). */
export const updateStoreProfile = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => storeProfileSchema.parse(raw))
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }): Promise<{ success: boolean; message?: string }> => {
    const { supabase, userId } = context as unknown as { supabase: any; userId: string };

    const tenantId = await resolveCurrentTenant(supabase, { userId });
    const allowed = await requireTenantRole(supabase, tenantId, userId, "owner");
    if (!allowed) {
      return { success: false, message: "غير مسموح: تعديل هوية المتجر لصاحب المتجر فقط" };
    }

    const res = await storeService.upsertStoreProfile(supabase, tenantId, data);
    if (!res.ok) return { success: false, message: res.message };
    return { success: true };
  });

/** Update one store setting (payment/shipping/contact/…) — owner-level. */
export const updateStoreSetting = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => upsertStoreSettingSchema.parse(raw))
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }): Promise<{ success: boolean; message?: string }> => {
    const { supabase, userId } = context as unknown as { supabase: any; userId: string };

    const tenantId = await resolveCurrentTenant(supabase, { userId });
    const allowed = await requireTenantRole(supabase, tenantId, userId, "owner");
    if (!allowed) {
      return { success: false, message: "غير مسموح: إعدادات المتجر لصاحب المتجر فقط" };
    }

    const res = await storeService.upsertStoreSetting(supabase, tenantId, data.key, data.value, userId);
    if (!res.ok) return { success: false, message: res.message };
    return { success: true };
  });

/** List store members (any member may view). */
export const listStoreMembers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<storeService.StoreMemberRow[]> => {
    const { supabase, userId } = context as unknown as { supabase: any; userId: string };
    const tenantId = await resolveCurrentTenant(supabase, { userId });
    const allowed = await requireTenantRole(supabase, tenantId, userId, "viewer");
    if (!allowed) return [];
    return storeService.listStoreMembers(supabase, tenantId);
  });

/** Applicable commission rules + earnings history reads (Phase 7 prep). */
export const getStoreCommissionInfo = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ rules: any[] }> => {
    const { supabase, userId } = context as unknown as { supabase: any; userId: string };
    const tenantId = await resolveCurrentTenant(supabase, { userId });
    const allowed = await requireTenantRole(supabase, tenantId, userId, "viewer");
    if (!allowed) return { rules: [] };
    const rules = await storeService.listApplicableCommissionRules(supabase, tenantId);
    return { rules };
  });

// Keep zod import referenced for future input schemas in this module.
void z;

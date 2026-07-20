/**
 * Tenant server functions — used by the Global Admin panel and, later,
 * by the tenant owner dashboard.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { tenantService } from "@/lib/saas/tenant.service";
import { planService } from "@/lib/saas/plan.service";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const isPlatformAdmin = async (ctx: { supabase: SupabaseClient<Database>; userId: string }) => {
  const { data, error } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin",
  });
  if (error) throw error;
  return Boolean(data);
};

const assertPlatformAdmin = async (ctx: { supabase: SupabaseClient<Database>; userId: string }) => {
  if (!(await isPlatformAdmin(ctx))) throw new Error("Forbidden: platform admin required");
};

// ---------- Reads ----------

export const listTenants = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertPlatformAdmin(context);
    const tenants = await tenantService.list(context.supabase);
    const withUsage = await Promise.all(
      tenants.map(async (t) => ({
        ...t,
        usage: await tenantService.usage(context.supabase, t.id),
        limits: planService.limitsFor(t.plan),
      })),
    );
    return withUsage;
  });

export const getMyTenant = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const own = await context.supabase
      .from("tenants")
      .select("*")
      .eq("owner_user_id", context.userId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (own.data) return { tenant: own.data, role: "owner" as const };
    const mem = await context.supabase
      .from("tenant_members")
      .select("role, tenants(*)")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (!mem.data?.tenants) return null;
    return { tenant: mem.data.tenants, role: mem.data.role };
  });

// ---------- Writes (platform admin) ----------

export const createTenant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z
      .object({
        slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
        name: z.string().min(1),
        owner_user_id: z.string().uuid().nullable().optional(),
        plan: z.enum(["free", "pro", "enterprise"]).optional(),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    await assertPlatformAdmin(context);
    return tenantService.create(context.supabase, data);
  });

export const updateTenantPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z
      .object({ id: z.string().uuid(), plan: z.enum(["free", "pro", "enterprise"]) })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    await assertPlatformAdmin(context);
    return tenantService.setPlan(context.supabase, data.id, data.plan);
  });

export const updateTenantStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["active", "suspended", "pending"]),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    await assertPlatformAdmin(context);
    return tenantService.setStatus(context.supabase, data.id, data.status);
  });

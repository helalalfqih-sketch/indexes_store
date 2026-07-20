/**
 * Onboarding server functions — self-service tenant creation for signed-in users.
 *
 * Flow:
 *  1. User signs up / signs in (Supabase Auth).
 *  2. UI calls `getOnboardingStatus` to know whether they already own a store.
 *  3. If none, UI shows `/onboarding` form → calls `completeOnboarding`.
 *
 * We use `supabaseAdmin` (service role) inside these handlers because:
 *  - The `tenants` INSERT policy is restricted to platform admins (correct default).
 *  - We still authenticate the caller via `requireSupabaseAuth` and enforce
 *    one-owner-one-tenant + slug uniqueness + reserved-slug guard in code.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { onboardingSchema, slugCheckSchema, RESERVED_SLUGS } from "@/lib/validators/onboarding";
import type { Database } from "@/integrations/supabase/types";

type TenantRow = Database["public"]["Tables"]["tenants"]["Row"];

// ---------- Read: status ----------

export const getOnboardingStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const owned = await supabase
      .from("tenants")
      .select("id, slug, name, plan, status")
      .eq("owner_user_id", userId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (owned.data) {
      return { hasTenant: true, role: "owner" as const, tenant: owned.data };
    }

    const member = await supabase
      .from("tenant_members")
      .select("role, tenants(id, slug, name, plan, status)")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (member.data?.tenants) {
      return {
        hasTenant: true,
        role: member.data.role,
        tenant: member.data.tenants,
      };
    }

    return { hasTenant: false, role: null, tenant: null };
  });

// ---------- Read: slug availability ----------

export const checkSlugAvailability = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => slugCheckSchema.parse(raw))
  .handler(async ({ data }) => {
    if (RESERVED_SLUGS.has(data.slug)) {
      return { available: false, reason: "reserved" as const };
    }
    // Admin client bypasses tenant SELECT RLS (which restricts to members only)
    // so we can detect existing slugs across the whole platform.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: hit, error } = await supabaseAdmin
      .from("tenants")
      .select("id")
      .eq("slug", data.slug)
      .maybeSingle();
    if (error) throw error;
    return { available: !hit, reason: hit ? ("taken" as const) : null };
  });

// ---------- Write: complete onboarding ----------

export const completeOnboarding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => onboardingSchema.parse(raw))
  .handler(async ({ data, context }): Promise<TenantRow> => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Guard: one tenant per owner at onboarding time.
    const existing = await supabaseAdmin
      .from("tenants")
      .select("id")
      .eq("owner_user_id", userId)
      .limit(1)
      .maybeSingle();
    if (existing.data) throw new Error("لديك متجر بالفعل");

    // Guard: slug uniqueness (admin bypasses tenant SELECT RLS).
    const slugHit = await supabaseAdmin
      .from("tenants")
      .select("id")
      .eq("slug", data.slug)
      .maybeSingle();
    if (slugHit.data) throw new Error("هذا المعرّف مستخدم بالفعل");

    // Privileged write: bypasses restricted INSERT policy after our checks.
    const { data: tenant, error } = await supabaseAdmin
      .from("tenants")
      .insert({
        slug: data.slug,
        name: data.name,
        owner_user_id: userId,
        plan: data.plan ?? "free",
        status: "active",
      })
      .select("*")
      .single();
    if (error) throw error;

    // Owner membership is attached by the `attach_tenant_owner` trigger,
    // but we upsert defensively in case the trigger is disabled.
    await supabaseAdmin
      .from("tenant_members")
      .upsert(
        { tenant_id: tenant.id, user_id: userId, role: "owner" },
        { onConflict: "tenant_id,user_id" },
      );

    return tenant;
  });

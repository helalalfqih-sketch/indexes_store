/**
 * Branch Management Server Functions
 * Multi-store branch system with geographic support
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import type { SupabaseClient } from "@supabase/supabase-js";

interface AuthContext {
  supabase: SupabaseClient<Database>;
  userId: string;
  claims: { sub: string; email: string };
}

const branchInputSchema = z.object({
  tenantId: z.string().uuid(),
  name: z.string().min(1).max(200),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  country: z.string().max(100).default("Yemen"),
  phone: z.string().max(50).optional(),
  email: z.string().email().max(255).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  isMainBranch: z.boolean().default(false),
  isActive: z.boolean().default(true),
  openingHours: z.record(z.string()).optional(),
  managerName: z.string().max(200).optional(),
  managerPhone: z.string().max(50).optional(),
});

export const listBranches = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ tenantId: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as AuthContext;
    const { data: result, error } = await ctx.supabase
      .from("branches")
      .select("*")
      .eq("tenant_id", data.tenantId)
      .order("is_main_branch", { ascending: false })
      .order("created_at", { ascending: true });
    if (error) throw error;
    return result ?? [];
  });

export const createBranch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => branchInputSchema.parse(raw))
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as AuthContext;
    const { data: result, error } = await ctx.supabase
      .from("branches")
      .insert({
        tenant_id: data.tenantId,
        name: data.name,
        slug: data.slug,
        address: data.address ?? null,
        city: data.city ?? null,
        country: data.country,
        phone: data.phone ?? null,
        email: data.email ?? null,
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        is_main_branch: data.isMainBranch,
        is_active: data.isActive,
        opening_hours: data.openingHours ?? {},
        manager_name: data.managerName ?? null,
        manager_phone: data.managerPhone ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    return result;
  });

export const updateBranch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        tenantId: z.string().uuid(),
        updates: branchInputSchema.partial(),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as AuthContext;
    const { data: result, error } = await ctx.supabase
      .from("branches")
      .update({
        name: data.updates.name,
        slug: data.updates.slug,
        address: data.updates.address,
        city: data.updates.city,
        country: data.updates.country,
        phone: data.updates.phone,
        email: data.updates.email,
        latitude: data.updates.latitude,
        longitude: data.updates.longitude,
        is_main_branch: data.updates.isMainBranch,
        is_active: data.updates.isActive,
        opening_hours: data.updates.openingHours,
        manager_name: data.updates.managerName,
        manager_phone: data.updates.managerPhone,
      })
      .eq("id", data.id)
      .eq("tenant_id", data.tenantId)
      .select()
      .single();
    if (error) throw error;
    return result;
  });

export const deleteBranch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        tenantId: z.string().uuid(),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as AuthContext;
    const { error } = await ctx.supabase
      .from("branches")
      .delete()
      .eq("id", data.id)
      .eq("tenant_id", data.tenantId);
    if (error) throw error;
    return { success: true };
  });

export const getBranchBySlug = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z
      .object({
        tenantId: z.string().uuid(),
        slug: z.string(),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as AuthContext;
    const { data: result, error } = await ctx.supabase
      .from("branches")
      .select("*")
      .eq("tenant_id", data.tenantId)
      .eq("slug", data.slug)
      .single();
    if (error) throw error;
    return result;
  });

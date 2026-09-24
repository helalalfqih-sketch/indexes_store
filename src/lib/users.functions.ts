import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { SupabaseAuthContext } from "@/integrations/supabase/auth-middleware";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { resolveTenantId } from "@/lib/saas/tenant-context";

export type TenantRole = "owner" | "manager" | "marketing" | "employee" | "staff" | "viewer";

export type PermissionKey =
  "products" | "orders" | "inventory" | "deals" | "cms" | "settings" | "analytics";

export const ALL_PERMISSIONS: Array<{ key: PermissionKey; label: string; icon: string }> = [
  { key: "products", label: "إدارة المنتجات والتصنيفات", icon: "Package" },
  { key: "orders", label: "إدارة الطلبات والشحن", icon: "ShoppingBag" },
  { key: "inventory", label: "إدارة المخزون والفروع", icon: "Boxes" },
  { key: "deals", label: "إدارة العروض والكوبونات والحملات", icon: "Flame" },
  { key: "cms", label: "إدارة الصفحات والمظهر والميديا وSEO", icon: "BookOpen" },
  { key: "settings", label: "إعدادات المتجر والتكاملات", icon: "Settings" },
  { key: "analytics", label: "التقارير والإحصائيات والمالية", icon: "BarChart3" },
];

export const ROLE_PRESETS: Record<TenantRole, PermissionKey[]> = {
  owner: ["products", "orders", "inventory", "deals", "cms", "settings", "analytics"],
  manager: ["products", "orders", "inventory", "deals", "cms", "settings", "analytics"],
  marketing: ["cms", "deals", "analytics"],
  employee: ["products", "orders", "inventory"],
  staff: ["products", "orders", "inventory"],
  viewer: [],
};

export interface TenantMemberRecord {
  id: string;
  tenant_id: string;
  user_id: string;
  role: TenantRole;
  permissions: PermissionKey[];
  created_at: string;
  profile?: {
    full_name?: string | null;
    avatar_url?: string | null;
    phone?: string | null;
    email?: string | null;
  };
}

// ── Error Classes ─────────────────────────────────────────────────────

export class PermissionDeniedError extends Error {
  status = 403;
  constructor(message = "Permission Denied") {
    super(`403: ${message}`);
    this.name = "PermissionDeniedError";
  }
}

export class ServiceUnavailableError extends Error {
  status = 503;
  constructor(message = "Service Unavailable") {
    super(`503: ${message}`);
    this.name = "ServiceUnavailableError";
  }
}

export class ConfigurationError extends Error {
  status = 400;
  constructor(message = "Configuration Error") {
    super(`400: ${message}`);
    this.name = "ConfigurationError";
  }
}

// ── Canonical Permission Resolver (Shared) ──────────────────────────────

/**
 * Utility: Check if current session user has specific tenant permission (Fail-Closed).
 * Used by Server Functions, route guards, services, and tests.
 */
export async function checkTenantPermission(
  permission: PermissionKey,
  context?: Partial<SupabaseAuthContext>,
): Promise<boolean> {
  let userId: string | undefined = context?.userId;
  const client = context?.supabase || supabase;

  if (!userId) {
    const { data: authUser } = await supabase.auth.getUser();
    if (authUser.user) {
      userId = authUser.user.id;
    }
  }

  if (!userId) {
    throw new PermissionDeniedError("Unauthenticated: Missing user session");
  }

  let tenantId: string;
  try {
    tenantId = await resolveTenantId(client, { userId });
  } catch (err) {
    throw new ConfigurationError("Tenant not resolved");
  }

  if (!tenantId) {
    throw new ConfigurationError("Tenant not resolved");
  }

  // 1. Platform admin check (user_roles table)
  try {
    const { data: roles } = await client.from("user_roles").select("role").eq("user_id", userId);

    if (roles?.some((r) => r.role === "admin")) return true;
  } catch {
    throw new ServiceUnavailableError("Permission check failed during admin role verification");
  }

  // 2. Tenant owner check — owner_user_id in tenants table
  try {
    const { data: tenantRow } = await client
      .from("tenants")
      .select("owner_user_id")
      .eq("id", tenantId)
      .maybeSingle();

    if (tenantRow?.owner_user_id === userId) return true;
  } catch {
    throw new ServiceUnavailableError("Permission check failed during tenant verification");
  }

  // 3. Tenant member permission check
  const { data: member, error: memberErr } = await client
    .from("tenant_members")
    .select("role, permissions")
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .maybeSingle();

  if (memberErr) {
    throw new ServiceUnavailableError("Permission check failed during membership verification");
  }

  if (!member) {
    throw new PermissionDeniedError("Not a member of this tenant");
  }

  if (member.role === "owner" || member.role === "manager") return true;
  const perms =
    (member.permissions as PermissionKey[]) || ROLE_PRESETS[member.role as TenantRole] || [];
  if (perms.includes(permission)) return true;

  throw new PermissionDeniedError(`Insufficient permissions for action '${permission}'`);
}

export type PermissionCheckInput = {
  db?: SupabaseClient<Database>;
  userId: string;
  tenantId: string;
  permission: PermissionKey;
};

export async function requireTenantPermission(
  input: PermissionCheckInput,
): Promise<{ role: TenantRole; permissions: PermissionKey[] }> {
  const { db, userId, tenantId, permission } = input;
  const client = db || supabase;

  if (!userId) {
    throw new PermissionDeniedError("Unauthenticated");
  }

  if (!tenantId) {
    throw new ConfigurationError("Tenant not resolved");
  }

  const { data: member, error } = await client
    .from("tenant_members")
    .select("role, permissions")
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new ServiceUnavailableError("Permission lookup failed");
  }

  if (!member) {
    throw new PermissionDeniedError("Not a tenant member");
  }

  const perms =
    (member.permissions as PermissionKey[]) || ROLE_PRESETS[member.role as TenantRole] || [];
  const allowed =
    member.role === "owner" || member.role === "manager" || perms.includes(permission);

  if (!allowed) {
    throw new PermissionDeniedError("Insufficient permission");
  }

  return {
    role: member.role as TenantRole,
    permissions: perms,
  };
}

// ── Server Functions (All Authenticated & RBAC-Gated) ───────────────────

/** Server Fn: List all members for current tenant (Requires auth + settings permission) */
export const listTenantMembers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase: authDb, userId } = context;

    // Resolve tenant from authenticated context
    const tenantId = await resolveTenantId(authDb, { userId });
    if (!tenantId) {
      throw new ConfigurationError("Tenant not resolved for authenticated user");
    }

    // Require settings permission or owner/manager role
    await requireTenantPermission({
      db: authDb,
      userId,
      tenantId,
      permission: "settings",
    });

    // Query members — explicit error on DB failure (never return [])
    const { data: members, error } = await authDb
      .from("tenant_members")
      .select("id, tenant_id, user_id, role, permissions, created_at")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: true });

    if (error) {
      throw new ServiceUnavailableError(`Failed to list tenant members: ${error.message}`);
    }

    // Only expose profiles of members returned by the authorized tenant query.
    const { getSupabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userIds = members.map((m) => m.user_id);
    const { data: profiles, error: profileError } = await getSupabaseAdmin()
      .from("profiles")
      .select("id, full_name, avatar_url, phone")
      .in("id", userIds.length > 0 ? userIds : ["00000000-0000-0000-0000-000000000000"]);

    if (profileError) throw new ServiceUnavailableError("Failed to load member profiles");

    const profileMap = new Map(profiles?.map((p) => [p.id, p]));

    return members.map((m) => ({
      ...m,
      role: m.role as TenantRole,
      permissions: (m.permissions as PermissionKey[]) || ROLE_PRESETS[m.role as TenantRole] || [],
      profile: profileMap.get(m.user_id) || { full_name: "مستخدم المتجر" },
    })) as TenantMemberRecord[];
  });

/** Server Fn: Update user role and permissions in tenant (Requires auth + owner/authorized manager) */
export const updateMemberRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    z.object({
      memberId: z.string().uuid(),
      targetUserId: z.string().uuid(),
      newRole: z.enum(["owner", "manager", "marketing", "employee", "staff", "viewer"]),
      permissions: z
        .array(z.enum(["products", "orders", "inventory", "deals", "cms", "settings", "analytics"]))
        .optional(),
    }),
  )
  .handler(async ({ data: { memberId, targetUserId, newRole, permissions }, context }) => {
    const { supabase: authDb, userId } = context;

    // Resolve tenant from authenticated context
    const tenantId = await resolveTenantId(authDb, { userId });
    if (!tenantId) {
      throw new ConfigurationError("Tenant not resolved for authenticated user");
    }

    // Require settings permission for the caller
    const callerAuth = await requireTenantPermission({
      db: authDb,
      userId,
      tenantId,
      permission: "settings",
    });

    // Fetch target member record — must belong to this tenant
    const { data: targetMember, error: targetErr } = await authDb
      .from("tenant_members")
      .select("id, role, user_id, tenant_id")
      .eq("id", memberId)
      .eq("tenant_id", tenantId)
      .single();

    if (targetErr || !targetMember) {
      throw new PermissionDeniedError("عضو المتجر غير موجود أو لا ينتمي لهذا المتجر.");
    }

    // Verify targetUserId matches the actual member record (never trust browser-provided userId independently)
    if (targetMember.user_id !== targetUserId) {
      throw new PermissionDeniedError("Target user ID does not match member record.");
    }

    // ── Owner Invariants ──

    // 1. A user cannot self-promote
    if (userId === targetUserId && newRole !== targetMember.role) {
      // Self-modification: only allow keeping the same role (e.g., updating permissions)
      const ROLE_RANK: Record<string, number> = {
        viewer: 0,
        staff: 1,
        employee: 1,
        marketing: 2,
        manager: 3,
        owner: 4,
      };
      if ((ROLE_RANK[newRole] || 0) > (ROLE_RANK[targetMember.role] || 0)) {
        throw new PermissionDeniedError("لا يمكنك ترقية نفسك.");
      }
    }

    // 2. An owner cannot be modified by a non-owner
    if (targetMember.role === "owner" && callerAuth.role !== "owner") {
      throw new PermissionDeniedError(
        "لا يمكن تعديل دور المالك (Owner) إلا بواسطة مالك المتجر نفسه.",
      );
    }

    // 3. A manager cannot promote anyone to owner
    if (callerAuth.role === "manager" && newRole === "owner") {
      throw new PermissionDeniedError("المدير لا يمكنه ترقية أي عضو إلى مالك.");
    }

    // 4. A manager cannot modify an owner
    if (callerAuth.role === "manager" && targetMember.role === "owner") {
      throw new PermissionDeniedError("المدير لا يمكنه تعديل صلاحيات المالك.");
    }

    // 5. The final owner cannot be demoted (check for other owners)
    if (targetMember.role === "owner" && newRole !== "owner") {
      const { data: otherOwners, error: ownerCountErr } = await authDb
        .from("tenant_members")
        .select("id")
        .eq("tenant_id", tenantId)
        .eq("role", "owner")
        .neq("id", memberId);

      if (ownerCountErr) {
        throw new ServiceUnavailableError("Failed to verify owner count.");
      }

      if (!otherOwners || otherOwners.length === 0) {
        throw new PermissionDeniedError(
          "لا يمكن تخفيض دور المالك الوحيد. يجب تعيين مالك آخر أولاً.",
        );
      }
    }

    const nextPermissions = permissions || ROLE_PRESETS[newRole] || [];

    const { error } = await authDb
      .from("tenant_members")
      .update({
        role: newRole as Database["public"]["Enums"]["tenant_role"],
        permissions: nextPermissions,
      })
      .eq("id", memberId)
      .eq("tenant_id", tenantId);

    if (error) throw new ServiceUnavailableError(`Failed to update member role: ${error.message}`);

    // Audit log
    await authDb.from("tenant_audit_logs").insert({
      tenant_id: tenantId,
      actor_id: userId,
      actor_email: context.claims?.email || null,
      action: "member_role_update",
      details: {
        member_id: memberId,
        target_user_id: targetUserId,
        new_role: newRole,
        permissions: nextPermissions,
      },
    });

    return { ok: true };
  });

/** Server Fn: Remove member from tenant (Requires auth + owner/authorized manager) */
export const removeTenantMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    z.object({
      memberId: z.string().uuid(),
    }),
  )
  .handler(async ({ data: { memberId }, context }) => {
    const { supabase: authDb, userId } = context;

    // Resolve tenant from authenticated context
    const tenantId = await resolveTenantId(authDb, { userId });
    if (!tenantId) {
      throw new ConfigurationError("Tenant not resolved for authenticated user");
    }

    // Require settings permission for the caller
    const callerAuth = await requireTenantPermission({
      db: authDb,
      userId,
      tenantId,
      permission: "settings",
    });

    // Fetch target member
    const { data: member, error: memberErr } = await authDb
      .from("tenant_members")
      .select("role, user_id")
      .eq("id", memberId)
      .eq("tenant_id", tenantId)
      .single();

    if (memberErr || !member) {
      throw new PermissionDeniedError("العضو غير موجود أو لا ينتمي لهذا المتجر.");
    }

    // Owner cannot be removed
    if (member.role === "owner") {
      throw new PermissionDeniedError("لا يمكن حذف مالك المتجر الأساسي.");
    }

    // Manager cannot remove another manager (only owner can)
    if (member.role === "manager" && callerAuth.role !== "owner") {
      throw new PermissionDeniedError("فقط المالك يمكنه حذف مدير.");
    }

    const { error } = await authDb
      .from("tenant_members")
      .delete()
      .eq("id", memberId)
      .eq("tenant_id", tenantId);
    if (error) throw new ServiceUnavailableError(`Failed to remove member: ${error.message}`);

    // Audit log
    await authDb.from("tenant_audit_logs").insert({
      tenant_id: tenantId,
      actor_id: userId,
      actor_email: context.claims?.email || null,
      action: "member_remove",
      details: { member_id: memberId, user_id: member.user_id },
    });

    return { ok: true };
  });

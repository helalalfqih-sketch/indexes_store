import { createServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { resolveTenantId } from "@/lib/saas/tenant-context";

export type TenantRole = "owner" | "manager" | "marketing" | "employee" | "staff" | "viewer";

export type PermissionKey =
  | "products"
  | "orders"
  | "inventory"
  | "deals"
  | "cms"
  | "settings"
  | "analytics";

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

/** Server Fn: List all members for current tenant */
export const listTenantMembers = createServerFn({ method: "GET" }).handler(async () => {
  const tenantId = await resolveTenantId(supabase);

  const { data: members, error } = await supabase
    .from("tenant_members")
    .select("id, tenant_id, user_id, role, permissions, created_at")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error listing tenant members:", error);
    return [];
  }

  // Fetch associated profiles
  const userIds = members.map((m) => m.user_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, phone")
    .in("id", userIds.length > 0 ? userIds : ["00000000-0000-0000-0000-000000000000"]);

  const profileMap = new Map(profiles?.map((p) => [p.id, p]));

  return members.map((m) => ({
    ...m,
    role: m.role as TenantRole,
    permissions: (m.permissions as PermissionKey[]) || ROLE_PRESETS[m.role as TenantRole] || [],
    profile: profileMap.get(m.user_id) || { full_name: "مستخدم المتجر" },
  })) as TenantMemberRecord[];
});

/** Server Fn: Update user role and permissions in tenant */
export const updateMemberRole = createServerFn({ method: "POST" })
  .validator((data: { memberId: string; targetUserId: string; newRole: TenantRole; permissions?: PermissionKey[] }) => data)
  .handler(async ({ data: { memberId, targetUserId, newRole, permissions } }) => {
    const tenantId = await resolveTenantId(supabase);
    const { data: authUser } = await supabase.auth.getUser();

    // Check target member existing role
    const { data: targetMember } = await supabase
      .from("tenant_members")
      .select("role")
      .eq("id", memberId)
      .eq("tenant_id", tenantId)
      .single();

    if (!targetMember) throw new Error("عضو المتجر غير موجود.");

    // Owner security rule: Non-owners CANNOT modify or downgrade an Owner role!
    if (targetMember.role === "owner" && authUser.user?.id !== targetUserId) {
      throw new Error("لا يمكن تعديل دور المالك (Owner) إلا بواسطة مالك المتجر نفسه.");
    }

    const nextPermissions = permissions || ROLE_PRESETS[newRole] || [];

    const { error } = await supabase
      .from("tenant_members")
      .update({
        role: newRole as any,
        permissions: nextPermissions as any,
      })
      .eq("id", memberId)
      .eq("tenant_id", tenantId);

    if (error) throw new Error(error.message);

    // Audit log
    await supabase.from("tenant_audit_logs").insert({
      tenant_id: tenantId,
      actor_id: authUser.user?.id || null,
      actor_email: authUser.user?.email || null,
      action: "member_role_update",
      details: { member_id: memberId, new_role: newRole, permissions: nextPermissions },
    });

    return { ok: true };
  });

/** Server Fn: Remove member from tenant */
export const removeTenantMember = createServerFn({ method: "POST" })
  .validator((data: { memberId: string }) => data)
  .handler(async ({ data: { memberId } }) => {
    const tenantId = await resolveTenantId(supabase);
    const { data: authUser } = await supabase.auth.getUser();

    const { data: member } = await supabase
      .from("tenant_members")
      .select("role, user_id")
      .eq("id", memberId)
      .eq("tenant_id", tenantId)
      .single();

    if (!member) throw new Error("العضو غير موجود");
    if (member.role === "owner") throw new Error("لا يمكن حذف مالك المتجر الأساسي.");

    const { error } = await supabase.from("tenant_members").delete().eq("id", memberId).eq("tenant_id", tenantId);
    if (error) throw new Error(error.message);

    // Audit log
    await supabase.from("tenant_audit_logs").insert({
      tenant_id: tenantId,
      actor_id: authUser.user?.id || null,
      actor_email: authUser.user?.email || null,
      action: "member_remove",
      details: { member_id: memberId, user_id: member.user_id },
    });

    return { ok: true };
  });

/** Utility: Helper to check if current session user has specific tenant permission */
export async function checkTenantPermission(permission: PermissionKey): Promise<boolean> {
  try {
    const { data: authUser } = await supabase.auth.getUser();
    if (!authUser.user) return false;

    const tenantId = await resolveTenantId(supabase);

    // 1. Platform admin bypass (user_roles table)
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", authUser.user.id);

    if (roles?.some((r) => r.role === "admin")) return true;

    // 2. Tenant owner bypass — owner_user_id in tenants table
    //    The store creator may never have been inserted into tenant_members.
    const { data: tenantRow } = await supabase
      .from("tenants")
      .select("owner_user_id")
      .eq("id", tenantId)
      .maybeSingle();

    if (tenantRow?.owner_user_id === authUser.user.id) return true;

    // 3. Tenant member permission check
    const { data: member } = await supabase
      .from("tenant_members")
      .select("role, permissions")
      .eq("tenant_id", tenantId)
      .eq("user_id", authUser.user.id)
      .maybeSingle();

    if (!member) return false;
    if (member.role === "owner") return true;

    const perms = (member.permissions as PermissionKey[]) || ROLE_PRESETS[member.role as TenantRole] || [];
    return perms.includes(permission);
  } catch {
    return false;
  }
}

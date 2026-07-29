/**
 * Full Role-Based Access Control (RBAC) Service — Phase 1 🔐
 *
 * Defines Roles, Permission Matrix, and Enforcement middleware for Server Functions & Dashboard Pages.
 * Roles: owner > admin > manager > staff > viewer > customer
 */

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getAdminDb } from "@/lib/ai-agent.functions";
import { resolveTenantId } from "@/lib/saas/tenant-context";

export type RoleType = "owner" | "admin" | "manager" | "staff" | "viewer" | "customer";

export type AppPermission =
  // Products
  | "view_products"
  | "create_products"
  | "edit_products"
  | "delete_products"
  // Orders
  | "view_orders"
  | "update_order_status"
  | "refund_orders"
  // Settings
  | "manage_store_settings"
  | "manage_payment"
  | "manage_shipping"
  // AI Agent
  | "use_ai_agent"
  | "approve_ai_changes"
  | "execute_ai_tasks";

// ─────────────────────────────────────────────────
// Comprehensive Permission Matrix
// ─────────────────────────────────────────────────

const ROLE_PERMISSIONS_MATRIX: Record<RoleType, AppPermission[]> = {
  owner: [
    "view_products",
    "create_products",
    "edit_products",
    "delete_products",
    "view_orders",
    "update_order_status",
    "refund_orders",
    "manage_store_settings",
    "manage_payment",
    "manage_shipping",
    "use_ai_agent",
    "approve_ai_changes",
    "execute_ai_tasks",
  ],
  admin: [
    "view_products",
    "create_products",
    "edit_products",
    "delete_products",
    "view_orders",
    "update_order_status",
    "refund_orders",
    "manage_store_settings",
    "manage_payment",
    "manage_shipping",
    "use_ai_agent",
    "approve_ai_changes",
    "execute_ai_tasks",
  ],
  manager: [
    "view_products",
    "create_products",
    "edit_products",
    "view_orders",
    "update_order_status",
    "manage_store_settings",
    "manage_shipping",
    "use_ai_agent",
  ],
  staff: ["view_products", "edit_products", "view_orders", "update_order_status"],
  viewer: ["view_products", "view_orders"],
  customer: [],
};

/**
 * Check if a role possesses a specific permission.
 */
export function hasPermission(role: RoleType, permission: AppPermission): boolean {
  const permissions = ROLE_PERMISSIONS_MATRIX[role] || [];
  return permissions.includes(permission);
}

/**
 * Enforce specific permission check on server function execution context.
 * Throws 403 error if unauthorized and logs security violation.
 */
export async function enforcePermission(
  context: any,
  permission: AppPermission,
): Promise<{ userId: string; tenantId: string; role: RoleType }> {
  const userId = context?.userId;
  if (!userId) {
    throw new Error("401: غير مصرح. يرجى تسجيل الدخول أولاً.");
  }

  const db = await getAdminDb(context);
  const tenantId = await resolveTenantId(db, { userId });
  if (!tenantId) {
    throw new Error("400: تعذر تحديد معرف المتجر (Tenant ID).");
  }

  // Resolve User Roles
  const { data: roleRows } = await db.from("user_roles").select("role").eq("user_id", userId);

  const rawRoles: string[] = ((roleRows ?? []) as { role: string }[]).map((r) =>
    r.role.toLowerCase(),
  );

  // Default role resolution
  let userRole: RoleType = "customer";
  if (rawRoles.includes("admin") || rawRoles.includes("owner")) {
    userRole = "admin";
  } else if (rawRoles.includes("manager")) {
    userRole = "manager";
  } else if (rawRoles.includes("staff") || rawRoles.includes("employee")) {
    userRole = "staff";
  } else if (rawRoles.includes("viewer")) {
    userRole = "viewer";
  }

  if (!hasPermission(userRole, permission)) {
    console.warn(
      `[Phase1_RBAC_Violation] User ${userId} with role "${userRole}" attempted unauthorized permission "${permission}" on tenant ${tenantId}`,
    );
    throw new Error(
      `403: ليس لديك صلاحية تنفيذ هذا الإجراء ("${permission}"). الصلاحية غير متوفرة لرتبتك الحالية (${userRole}).`,
    );
  }

  return { userId, tenantId, role: userRole };
}

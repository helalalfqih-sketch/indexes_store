import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { AgentRole } from "@/services/ai-agent/agent.permissions";

export type ProjectSupabaseClient = SupabaseClient<Database>;
export type DynamicSupabaseClient = SupabaseClient;

interface AuthenticatedContext {
  userId: string;
  supabase: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function requireContext(value: unknown): AuthenticatedContext {
  if (!isRecord(value) || typeof value.userId !== "string" || !value.userId) {
    throw new Error("401: Unauthorized. Authenticated user is required.");
  }
  if (!value.supabase || typeof value.supabase !== "object") {
    throw new Error("401: Unauthorized. Authenticated database client is required.");
  }

  return {
    userId: value.userId,
    supabase: value.supabase,
  };
}

/**
 * Dynamic administrative callers use tables that are not yet represented in the
 * generated Database type. This remains the authenticated request client; it is
 * not a service-role escalation.
 */
export async function getAdminDb(context?: unknown): Promise<DynamicSupabaseClient> {
  return requireContext(context).supabase as DynamicSupabaseClient;
}

/** Typed client used by tenant/RBAC code whose tables are in generated types. */
export async function getAgentDb(context?: unknown): Promise<ProjectSupabaseClient> {
  return requireContext(context).supabase as ProjectSupabaseClient;
}

export async function resolveAgentRole(
  db: ProjectSupabaseClient,
  userId: string,
  tenantId: string,
): Promise<AgentRole> {
  if (!userId) throw new Error("401: Unauthorized. User ID is missing.");
  if (!tenantId || tenantId === "default") {
    throw new Error("CONFIGURATION_ERROR: Missing or invalid tenant ID.");
  }

  const { data: platformRoles, error: platformRoleError } = await db
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  if (platformRoleError) {
    throw new Error(`503: Platform-role verification failed: ${platformRoleError.message}`);
  }
  if (platformRoles?.some((entry) => entry.role === "admin")) return "owner";

  const { data: tenant, error: tenantError } = await db
    .from("tenants")
    .select("owner_user_id")
    .eq("id", tenantId)
    .maybeSingle();
  if (tenantError) {
    throw new Error(`503: Tenant ownership verification failed: ${tenantError.message}`);
  }
  if (!tenant?.owner_user_id) {
    throw new Error("404: Tenant not found or has no configured owner.");
  }
  if (tenant.owner_user_id === userId) return "owner";

  const { data: member, error: memberError } = await db
    .from("tenant_members")
    .select("role")
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .maybeSingle();
  if (memberError) {
    throw new Error(`503: Tenant membership verification failed: ${memberError.message}`);
  }
  if (!member) {
    throw new Error("403: Access denied. Active tenant membership is required.");
  }

  const memberRole = String(member.role);
  switch (memberRole) {
    case "owner":
      return "owner";
    case "manager":
      return "admin";
    case "marketing":
    case "employee":
    case "staff":
      return "developer";
    case "viewer":
      return "viewer";
    default:
      throw new Error(`403: Access denied. Unknown tenant role '${memberRole}'.`);
  }
}

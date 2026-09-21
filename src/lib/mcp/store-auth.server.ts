import { getSupabaseAdmin } from "@/integrations/supabase/client.server";

type OwnedTenant = { id: string };
type AdminMembership = { tenant_id: string; role: string };

export function selectStoreAdminTenant(
  ownedTenants: OwnedTenant[],
  memberships: AdminMembership[],
): string {
  const tenantIds = new Set<string>();
  for (const tenant of ownedTenants) tenantIds.add(tenant.id);
  for (const membership of memberships) {
    if (membership.role === "owner" || membership.role === "manager") {
      tenantIds.add(membership.tenant_id);
    }
  }
  if (tenantIds.size === 0) throw new Error("STORE_ADMIN_TENANT_NOT_FOUND");
  if (tenantIds.size !== 1) throw new Error("STORE_ADMIN_TENANT_AMBIGUOUS");
  return [...tenantIds][0];
}

export async function requireStoreAdminSession(
  request: Request,
): Promise<{ sub: string; tenantId: string }> {
  const match = /^Bearer ([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/.exec(
    request.headers.get("authorization") || "",
  );
  if (!match || match[1].length > 8192) throw new Error("UNAUTHORIZED");

  const db = getSupabaseAdmin();
  const { data, error } = await db.auth.getUser(match[1]);
  const userId = data.user?.id;
  if (error || !userId) throw new Error("UNAUTHORIZED");

  const [owned, memberships] = await Promise.all([
    db
      .from("tenants")
      .select("id")
      .eq("owner_user_id", userId)
      .order("created_at", { ascending: true })
      .limit(2),
    db
      .from("tenant_members")
      .select("tenant_id, role")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .limit(100),
  ]);
  if (owned.error || memberships.error) throw new Error("AUTHORIZATION_UNAVAILABLE");

  return {
    sub: userId,
    tenantId: selectStoreAdminTenant(owned.data ?? [], memberships.data ?? []),
  };
}

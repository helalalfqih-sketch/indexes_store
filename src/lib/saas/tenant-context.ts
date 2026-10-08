/**
 * Tenant Context — resolves the current tenant for a request.
 *
 * Resolution priority:
 *   1. Explicit override (passed in by caller / server fn input).
 *   2. Subdomain (`store1.example.com` → slug `store1`).
 *   3. `x-tenant-id` request header (uuid) or `x-tenant-slug`.
 *   4. User's owned/first-membership tenant (authenticated only).
 *   5. Fallback: `default` tenant (backward compatibility guarantee).
 *
 * Callers MUST resolve a tenant BEFORE hitting repositories. Repositories
 * refuse to write without a tenant id.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export const DEFAULT_TENANT_SLUG = "default";

export type TenantSummary = {
  id: string;
  slug: string;
  name: string;
  plan: Database["public"]["Enums"]["tenant_plan"];
  status: Database["public"]["Enums"]["tenant_status"];
};

const PLATFORM_HOST_SUFFIXES = [
  ".vercel.app",
  ".lovable.app",
  ".lovableproject.com",
  ".pages.dev",
  ".netlify.app",
  ".workers.dev",
];

/**
 * Extract a tenant slug only from a custom storefront hostname.
 *
 * Deployment-provider hostnames encode the project/deployment in their first
 * label (for example `indexes-store-git-main-team.vercel.app`). Treating that
 * label as a tenant caused every SSR render to make a doomed tenant lookup
 * before the real default-tenant lookup. During a provider outage that doubled
 * the render-path timeout.
 */
export const parseTenantSubdomainSlug = (host: string | null | undefined): string | null => {
  if (!host) return null;
  const clean = host.split(":")[0].toLowerCase().replace(/\.$/, "");
  // IP literals are local/edge hosts, never tenant-bearing custom domains.
  // (Bracketed IPv6 is already rejected by the label-count check below.)
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(clean)) return null;
  if (PLATFORM_HOST_SUFFIXES.some((suffix) => clean.endsWith(suffix))) return null;
  const parts = clean.split(".");
  if (parts.length < 3) return null;
  const sub = parts[0];
  if (["www", "app", "admin", "api", "localhost", DEFAULT_TENANT_SLUG].includes(sub)) return null;
  return sub;
};

export async function resolveTenantId(
  db: SupabaseClient<Database>,
  opts: {
    override?: string | null;
    headers?: Headers | Record<string, string | null | undefined> | null;
    userId?: string | null;
  } = {},
): Promise<string> {
  if (opts.override) return opts.override;

  const readHeader = (name: string): string | null => {
    if (!opts.headers) return null;
    if (opts.headers instanceof Headers) return opts.headers.get(name);
    return (opts.headers[name] ?? opts.headers[name.toLowerCase()] ?? null) as string | null;
  };

  // Header-based (uuid or slug)
  const headerId = readHeader("x-tenant-id");
  if (headerId && /^[0-9a-f-]{36}$/i.test(headerId)) return headerId;

  const headerSlug = readHeader("x-tenant-slug") ?? parseTenantSubdomainSlug(readHeader("host"));
  if (headerSlug) {
    const bySlug = await db.from("tenants").select("id").eq("slug", headerSlug).maybeSingle();
    // Fail closed on an unavailable tenant lookup. Falling through to the
    // default tenant would both repeat the same failed network request and
    // risk serving the wrong storefront for a valid custom subdomain.
    if (bySlug.error) throw bySlug.error;
    if (!bySlug.data) throw new Error("Requested tenant was not found.");
    return bySlug.data.id;
  }

  // User-owned membership
  if (opts.userId) {
    const own = await db
      .from("tenants")
      .select("id")
      .eq("owner_user_id", opts.userId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (own.data) return own.data.id;

    const member = await db
      .from("tenant_members")
      .select("tenant_id")
      .eq("user_id", opts.userId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (member.data) return member.data.tenant_id;
  }

  // Fallback: default tenant
  return getDefaultTenantId(db);
}

let _defaultTenantId: string | null = null;
export async function getDefaultTenantId(db: SupabaseClient<Database>): Promise<string> {
  if (_defaultTenantId) return _defaultTenantId;
  const { data, error } = await db
    .from("tenants")
    .select("id")
    .eq("slug", DEFAULT_TENANT_SLUG)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Default tenant not found — run SaaS migration.");
  _defaultTenantId = data.id;
  return _defaultTenantId;
}

export async function getTenant(
  db: SupabaseClient<Database>,
  id: string,
): Promise<TenantSummary | null> {
  const { data, error } = await db
    .from("tenants")
    .select("id, slug, name, plan, status")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

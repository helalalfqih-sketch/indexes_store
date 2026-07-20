/**
 * Tenant Resolver — request-scoped helper.
 * Wraps `resolveTenantId` to pull request headers automatically inside
 * server-fn / server-route handlers.
 */
import { getRequest } from "@tanstack/react-start/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { resolveTenantId } from "./tenant-context";

export async function resolveCurrentTenant(
  db: SupabaseClient<Database>,
  opts: { override?: string | null; userId?: string | null } = {},
): Promise<string> {
  let headers: Headers | null = null;
  try {
    headers = getRequest().headers;
  } catch {
    headers = null;
  }
  return resolveTenantId(db, { override: opts.override, headers, userId: opts.userId ?? null });
}

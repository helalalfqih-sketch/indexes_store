/**
 * Public tenant discovery — resolves the tenant for the current request from
 * subdomain / header / query, and exposes a safe summary to the client UI.
 *
 * No auth required: storefronts are public. This does NOT return billing
 * or ownership details.
 */
import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { getRequest } from "@tanstack/react-start/server";
import type { Database } from "@/integrations/supabase/types";
import {
  DEFAULT_TENANT_SLUG,
  getTenant,
  resolveTenantId,
} from "@/lib/saas/tenant-context";

const publicClient = () => {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error(`Missing Supabase URL or Publishable Key. Ensure SUPABASE_URL/VITE_SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY/VITE_SUPABASE_PUBLISHABLE_KEY are set.`);
  }
  return createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
};

const readRequestHost = (): string | null => {
  try {
    return getRequest().headers.get("host");
  } catch {
    return null;
  }
};

const readRequestHeaders = (): Headers | null => {
  try {
    return getRequest().headers;
  } catch {
    return null;
  }
};

export const getCurrentTenant = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) =>
    z
      .object({
        slug: z.string().trim().toLowerCase().min(2).max(32).optional(),
        host: z.string().optional(),
      })
      .parse(raw ?? {}),
  )
  .handler(async ({ data }) => {
    const db = publicClient();

    // Client-provided context (e.g. from window.location on the browser call)
    // acts as an override so subdomain resolution works even when the request
    // hits the shared preview origin.
    const headers = new Headers(readRequestHeaders() ?? undefined);
    if (data.host) headers.set("host", data.host);
    if (data.slug) headers.set("x-tenant-slug", data.slug);

    const id = await resolveTenantId(db, { headers });
    const tenant = await getTenant(db, id);
    if (!tenant) {
      return {
        id,
        slug: DEFAULT_TENANT_SLUG,
        name: "Default Store",
        plan: "free" as const,
        status: "active" as const,
        isDefault: true,
        host: data.host ?? readRequestHost(),
      };
    }
    return { ...tenant, isDefault: tenant.slug === DEFAULT_TENANT_SLUG, host: data.host ?? readRequestHost() };
  });

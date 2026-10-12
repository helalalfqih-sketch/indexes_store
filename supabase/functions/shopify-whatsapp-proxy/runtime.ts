import { createClient } from "@supabase/supabase-js";
import type { DraftDatabase, DraftDependencies } from "../_shared/shopify-draft.ts";
import { HandoffError } from "../_shared/shopify-draft.ts";
import { saveNativeOrder, type NativeBackendConfig } from "./backend.ts";
import type { NativeOrderInput } from "./checkout-payload.ts";

export async function runNativeOrder(input: NativeOrderInput, config: NativeBackendConfig) {
  const db = createClient<DraftDatabase>(config.supabaseUrl, config.serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (url, options) => fetch(url, { ...options, signal: AbortSignal.timeout(15000) }),
    },
  });
  // A mutation is sent at most once: a timeout retains its durable DB claim.
  const graphql: DraftDependencies["graphql"] = async <T>(
    query: string,
    variables = {},
  ): Promise<T> => {
    const response = await fetch(`https://${config.domain}/admin/api/2026-07/graphql.json`, {
      method: "POST",
      redirect: "error",
      signal: AbortSignal.timeout(15000),
      headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": config.adminToken },
      body: JSON.stringify({ query, variables }),
    });
    if (!response.ok) throw new HandoffError(503, "SHOPIFY_REQUEST_FAILED");
    const result = await response.json();
    if (result.errors?.length || !result.data)
      throw new HandoffError(503, "SHOPIFY_REQUEST_FAILED");
    return result.data as T;
  };
  return saveNativeOrder(input, config, db, graphql);
}

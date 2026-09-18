import { WhapiError } from "./whapi.server";

export interface WhapiAuthClient {
  auth: {
    getUser: (token: string) => Promise<{ data: { user: { id: string } | null }; error: unknown }>;
  };
  rpc: (name: "has_role", args: { _user_id: string; _role: "admin" }) => PromiseLike<{ data: unknown; error: unknown }>;
}

async function createAuthClient(token: string): Promise<WhapiAuthClient> {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new WhapiError("AUTH_NOT_CONFIGURED", 503);
  const { createClient } = await import("@supabase/supabase-js");
  return createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

export async function requireWhapiAdmin(
  request: Request,
  factory: (token: string) => Promise<WhapiAuthClient> = createAuthClient,
): Promise<string> {
  const match = /^Bearer ([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/.exec(request.headers.get("authorization") || "");
  if (!match || match[1].length > 8192) throw new WhapiError("UNAUTHORIZED", 401);
  const client = await factory(match[1]);
  const { data, error } = await client.auth.getUser(match[1]);
  if (error || !data.user?.id) throw new WhapiError("UNAUTHORIZED", 401);
  // A deployment-wide WHAPI_TOKEN must NOT be available to tenant admins/customers.
  const role = await client.rpc("has_role", { _user_id: data.user.id, _role: "admin" });
  if (role.error) throw new WhapiError("AUTHORIZATION_UNAVAILABLE", 503);
  if (role.data !== true) throw new WhapiError("FORBIDDEN", 403);
  return data.user.id;
}

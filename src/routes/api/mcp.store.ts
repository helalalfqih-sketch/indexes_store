import { createClient } from "@supabase/supabase-js";
import { createFileRoute } from "@tanstack/react-router";
import type { Database } from "@/integrations/supabase/types";
import {
  STORE_MCP_PROTOCOL_VERSION,
  STORE_MCP_TOOLS,
  runStoreBridgeTool,
  type StoreBridgeContext,
} from "@/lib/mcp/store-bridge.server";

type JsonRpcRequest = {
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: {
    name?: string;
    arguments?: unknown;
  };
};

const SECURITY_HEADERS = {
  "Cache-Control": "no-store",
  "Content-Type": "application/json; charset=utf-8",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
} as const;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 60;
const requestWindows = new Map<string, { startedAt: number; count: number }>();

function response(body: unknown, status = 200, extraHeaders: Record<string, string> = {}): Response {
  return Response.json(body, {
    status,
    headers: { ...SECURITY_HEADERS, ...extraHeaders },
  });
}

function rpcError(
  id: JsonRpcRequest["id"],
  code: number,
  message: string,
  status = 200,
): Response {
  return response({ jsonrpc: "2.0", id: id ?? null, error: { code, message } }, status);
}

function environment(): { url: string; publishableKey: string } {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const publishableKey =
    process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error("Store bridge authentication is not configured.");
  }
  return { url, publishableKey };
}

function authFetch(apiKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );
    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }
    if (
      (apiKey.startsWith("sb_publishable_") || apiKey.startsWith("sb_secret_")) &&
      headers.get("Authorization") === `Bearer ${apiKey}`
    ) {
      headers.delete("Authorization");
    }
    headers.set("apikey", apiKey);
    return fetch(input, { ...init, headers });
  };
}

function bearerToken(request: Request): string | null {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return null;
  const token = authorization.slice("Bearer ".length).trim();
  return token.split(".").length === 3 ? token : null;
}

function enforceRateLimit(key: string): boolean {
  const now = Date.now();
  const current = requestWindows.get(key);
  if (!current || now - current.startedAt >= RATE_LIMIT_WINDOW_MS) {
    requestWindows.set(key, { startedAt: now, count: 1 });
    return true;
  }
  if (current.count >= RATE_LIMIT_MAX_REQUESTS) return false;
  current.count += 1;
  return true;
}

async function authenticate(request: Request): Promise<StoreBridgeContext> {
  const token = bearerToken(request);
  if (!token) throw new Error("Unauthorized: valid Supabase Bearer token required.");

  const tenantId = request.headers.get("x-tenant-id")?.trim() ?? "";
  if (!UUID_PATTERN.test(tenantId)) {
    throw new Error("Unauthorized: x-tenant-id must be an explicit tenant UUID.");
  }

  const { url, publishableKey } = environment();
  const db = createClient<Database>(url, publishableKey, {
    global: {
      fetch: authFetch(publishableKey),
      headers: { Authorization: `Bearer ${token}` },
    },
    auth: {
      storage: undefined,
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data: claimsData, error: claimsError } = await db.auth.getClaims(token);
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) {
    throw new Error("Unauthorized: invalid or expired Supabase token.");
  }

  const { data: isAdmin, error: adminError } = await db.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (!adminError && isAdmin) {
    return { db, tenantId, userId, access: "platform_admin" };
  }

  const { data: membership, error: membershipError } = await db
    .from("tenant_members")
    .select("tenant_id")
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .maybeSingle();

  if (membershipError || !membership) {
    throw new Error("Forbidden: user is not a member of the requested tenant.");
  }

  return { db, tenantId, userId, access: "tenant_member" };
}

export async function handleStoreMcpRequest(request: Request): Promise<Response> {
  let context: StoreBridgeContext;
  try {
    context = await authenticate(request);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized.";
    const status = message.startsWith("Forbidden") ? 403 : 401;
    return response(
      { error: message },
      status,
      status === 401 ? { "WWW-Authenticate": 'Bearer realm="indexes-store-mcp"' } : {},
    );
  }

  if (!enforceRateLimit(`${context.userId}:${context.tenantId}`)) {
    return response(
      { error: "Too many store bridge requests. Retry after one minute." },
      429,
      { "Retry-After": "60" },
    );
  }

  let payload: JsonRpcRequest;
  try {
    payload = (await request.json()) as JsonRpcRequest;
  } catch {
    return rpcError(null, -32700, "Parse error", 400);
  }

  if (payload.jsonrpc !== "2.0" || typeof payload.method !== "string") {
    return rpcError(payload.id, -32600, "Invalid JSON-RPC request", 400);
  }

  if (payload.method === "notifications/initialized") {
    return new Response(null, { status: 202, headers: SECURITY_HEADERS });
  }

  if (payload.method === "ping") {
    return response({ jsonrpc: "2.0", id: payload.id ?? null, result: {} });
  }

  if (payload.method === "initialize") {
    return response({
      jsonrpc: "2.0",
      id: payload.id ?? null,
      result: {
        protocolVersion: STORE_MCP_PROTOCOL_VERSION,
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: "indexes-store-readonly", version: "1.0.0" },
        instructions:
          "Read-only Indexes Store operations. Every tool requires tenant_id matching x-tenant-id.",
      },
    });
  }

  if (payload.method === "tools/list") {
    return response({
      jsonrpc: "2.0",
      id: payload.id ?? null,
      result: { tools: STORE_MCP_TOOLS },
    });
  }

  if (payload.method === "tools/call") {
    const name = payload.params?.name;
    if (!name) return rpcError(payload.id, -32602, "Tool name is required.");
    const result = await runStoreBridgeTool(name, payload.params?.arguments ?? {}, context);
    return response({ jsonrpc: "2.0", id: payload.id ?? null, result });
  }

  return rpcError(payload.id, -32601, `Method not found: ${payload.method}`);
}

function methodNotAllowed(): Response {
  return response(
    {
      error:
        "This is a private read-only MCP endpoint. Use authenticated JSON-RPC POST requests.",
    },
    405,
    { Allow: "POST" },
  );
}

export const Route = createFileRoute("/api/mcp/store")({
  server: {
    handlers: {
      GET: methodNotAllowed,
      POST: ({ request }) => handleStoreMcpRequest(request),
    },
  },
});

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

import { checkTenantPermission, PermissionDeniedError } from "@/lib/users.functions";

export async function authorizeAI(request: Request): Promise<Response | null> {
  const token = request.headers
    .get("authorization")
    ?.match(/^Bearer ([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/i)?.[1];
  if (!token || token.length > 8192)
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return Response.json({ error: "Authentication unavailable" }, { status: 503 });
  try {
    const db = createClient<Database>(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data, error } = await db.auth.getUser(token);
    if (error || !data.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    await checkTenantPermission("products", { supabase: db, userId: data.user.id });
    const budget = await db.rpc("consume_ai_request");
    if (budget.error) return Response.json({ error: "AI budget unavailable" }, { status: 503 });
    if (budget.data !== true)
      return Response.json({ error: "Daily AI limit reached" }, { status: 429 });
    return null;
  } catch (error) {
    const status = error instanceof PermissionDeniedError ? 403 : 503;
    return Response.json(
      { error: status === 403 ? "Forbidden" : "AI authorization unavailable" },
      { status },
    );
  }
}

// Enforce the limit while reading, including chunked requests without Content-Length.
export async function readBoundedJson(
  request: Request,
  maxBytes = 12 * 1024 * 1024,
): Promise<unknown> {
  if (Number(request.headers.get("content-length")) > maxBytes)
    throw new Error("Request too large");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Missing body");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        throw new Error("Request too large");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return JSON.parse(new TextDecoder().decode(body));
}

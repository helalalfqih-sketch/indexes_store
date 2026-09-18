import { requireWhapiAdmin } from "./whapi-auth.server";
import { parseWhapiReadInput, readBoundedJson, readWhapi, verifyWhapiWebhook, WhapiError } from "./whapi.server";
import type { WhapiReadInput } from "./whapi.server";

const PRIVATE_HEADERS = {
  "Cache-Control": "private, no-store",
  "Vary": "Authorization",
  "X-Content-Type-Options": "nosniff",
};

function json(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: PRIVATE_HEADERS });
}

function failure(error: unknown): Response {
  return error instanceof WhapiError
    ? json({ ok: false, code: error.code }, error.status)
    : json({ ok: false, code: "WHAPI_REQUEST_FAILED" }, 503);
}

interface ReadDependencies {
  authorize: (request: Request) => Promise<string>;
  read: (input: WhapiReadInput) => Promise<unknown>;
}

export async function handleWhapiRead(
  request: Request,
  resource?: "health",
  dependencies: ReadDependencies = { authorize: requireWhapiAdmin, read: readWhapi },
): Promise<Response> {
  if (request.method !== "GET") return json({ ok: false, code: "METHOD_NOT_ALLOWED" }, 405);
  try {
    await dependencies.authorize(request);
    const input = parseWhapiReadInput(new URL(request.url), resource);
    return json({ ok: true, resource: input.resource, data: await dependencies.read(input) });
  } catch (error) {
    return failure(error);
  }
}

export async function handleWhapiWebhook(request: Request): Promise<Response> {
  if (!verifyWhapiWebhook(request)) return json({ ok: false, code: "FORBIDDEN" }, 403);
  if (!/^application\/json(?:;|$)/i.test(request.headers.get("content-type") || "")) {
    return json({ ok: false, code: "JSON_REQUIRED" }, 415);
  }
  try {
    const body = await readBoundedJson(new Response(request.body, { headers: request.headers }), 256 * 1024);
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new WhapiError("INVALID_EVENT", 400);
    // Do NOT acknowledge deliveries until a durable inbox exists. Read tools need no webhook.
    return json({ ok: false, code: "WEBHOOK_PROCESSOR_NOT_CONFIGURED", processed: false }, 503);
  } catch (error) {
    return failure(error);
  }
}

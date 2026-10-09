declare const Deno: {
  serve: (handler: (req: Request) => Response | Promise<Response>) => void;
};

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_JOB_REQUEST_BYTES = 32 * 1024;

class RequestTooLargeError extends Error {
  constructor() {
    super("Request payload exceeds 32KB");
    this.name = "RequestTooLargeError";
  }
}

async function readJobRequest(req: Request): Promise<Record<string, unknown>> {
  const declaredLength = req.headers.get("content-length");
  if (declaredLength) {
    const bytes = Number(declaredLength);
    if (Number.isFinite(bytes) && bytes > MAX_JOB_REQUEST_BYTES) {
      throw new RequestTooLargeError();
    }
  }
  if (!req.body) return {};

  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_JOB_REQUEST_BYTES) {
        await reader.cancel();
        throw new RequestTooLargeError();
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return total === 0 ? {} : JSON.parse(new TextDecoder().decode(body));
}

function jsonResponse(body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body), {
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
    status,
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return new Response("Method not allowed", {
      headers: { ...CORS_HEADERS, Allow: "POST, OPTIONS" },
      status: 405,
    });
  }

  try {
    const body = await readJobRequest(req);
    const jobType = typeof body.job_type === "string" ? body.job_type.trim().slice(0, 64) : "";
    const tenantId = typeof body.tenant_id === "string" ? body.tenant_id.trim().slice(0, 64) : "";
    if (!jobType || !tenantId) {
      return jsonResponse({ success: false, error: "job_type and tenant_id are required" }, 400);
    }

    let result: Record<string, unknown>;
    switch (jobType) {
      case "whatsapp_catalog_sync":
        // This endpoint does not run a catalog import. Keep the historical
        // response keys without returning invented processed-item counts.
        result = { synced_items: 0, status: "noop" };
        break;
      case "media_optimization":
        // On-demand image optimization is disabled to avoid downloading and
        // re-encoding Storage objects in an Edge Function.
        result = { processed_files: 0, status: "disabled" };
        break;
      default:
        result = { status: "processed" };
        break;
    }

    return jsonResponse({ success: true, job_type: jobType, tenant_id: tenantId, result }, 200);
  } catch (error) {
    if (error instanceof RequestTooLargeError) {
      return jsonResponse({ success: false, error: error.message }, 413);
    }
    return jsonResponse(
      {
        success: false,
        error: error instanceof SyntaxError ? "Invalid JSON body" : "Invalid sync job request",
      },
      400,
    );
  }
});

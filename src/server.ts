import "./lib/error-capture";
import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { logServerError } from "@/services/live-logs.service";
import { shouldPersistHttpFailure } from "@/lib/monitoring/telemetry-policy";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);

      // Persist only server failures. Recording every successful request here
      // previously produced one Supabase INSERT per page/API hit and amplified
      // the quota outage with hundreds of doomed telemetry writes.
      const status = response.status;
      if (
        shouldPersistHttpFailure(status) &&
        !pathname.includes("live-logs") &&
        !pathname.includes("listLiveLogs")
      ) {
        const method = request.method;
        const host = url.hostname;

        let cause = `HTTP ${status} ${method} ${pathname}`;
        if (pathname.includes("/image-proxy")) {
          const targetUrl = url.searchParams.get("url");
          try {
            const hostObj = targetUrl ? new URL(targetUrl).hostname : "unknown";
            cause = `[IMAGE_PROXY] { hostname: '${hostObj}' }`;
          } catch {
            cause = `[IMAGE_PROXY] ${method} ${pathname}`;
          }
        } else if (pathname.includes("/_serverFn/")) {
          cause = `[ServerFn] ${method} ${pathname.substring(0, 32)}...`;
        }

        logServerError({
          errorName: `[${method}] ${pathname}`,
          errorType: pathname.startsWith("/api") ? "Server Function" : "Storefront UI",
          level: "error",
          location: pathname,
          cause,
          context: { method, status, host, path: pathname },
        }).catch(() => {});
      }

      return await normalizeCatastrophicSsrResponse(response);
    } catch (error: any) {
      console.error(error);

      if (!pathname.includes("live-logs")) {
        logServerError({
          errorName: `[${request.method}] ${pathname} Execution Error`,
          errorType: "Server Function",
          level: "error",
          location: pathname,
          cause: error?.message || String(error),
          stackTrace: error?.stack || String(error),
          context: { method: request.method, status: 500, host: url.hostname, path: pathname },
        }).catch(() => {});
      }

      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};

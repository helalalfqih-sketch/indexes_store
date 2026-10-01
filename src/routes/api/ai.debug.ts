import { createFileRoute } from "@tanstack/react-router";

/**
 * Provider diagnostics are intentionally not exposed over a public HTTP route.
 * The page used to reveal the active provider/model without authentication and
 * could bypass tenant scoping by resolving a global provider.
 */
export function disabledAiDebugResponse(): Response {
  return Response.json(
    { error: "Not found" },
    {
      status: 404,
      headers: {
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    },
  );
}

export const Route = createFileRoute("/api/ai/debug")({
  server: {
    handlers: {
      GET: disabledAiDebugResponse,
    },
  },
});

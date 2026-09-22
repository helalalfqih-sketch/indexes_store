import { createFileRoute } from "@tanstack/react-router";
import { handleStoreMcp } from "@/lib/mcp/store-handler.server";

/**
 * Versioned discovery endpoint for Store Control Plane V2.
 *
 * It intentionally uses the same OAuth audience and handler as /api/mcp/store.
 * The distinct URL forces connector clients to perform a fresh MCP initialize/tools/list
 * instead of reusing a schema cached for the original V1 endpoint.
 */
export const Route = createFileRoute("/api/mcp/store-v2")({
  server: {
    handlers: {
      POST: ({ request }) => handleStoreMcp(request),
      GET: ({ request }) => handleStoreMcp(request),
      OPTIONS: ({ request }) => handleStoreMcp(request),
    },
  },
});

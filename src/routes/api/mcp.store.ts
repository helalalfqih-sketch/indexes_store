import { createFileRoute } from "@tanstack/react-router";
import { handleStoreMcp } from "@/lib/mcp/store-handler.server";

export const Route = createFileRoute("/api/mcp/store")({
  server: {
    handlers: {
      POST: ({ request }) => handleStoreMcp(request),
      GET: ({ request }) => handleStoreMcp(request),
      OPTIONS: ({ request }) => handleStoreMcp(request),
    },
  },
});

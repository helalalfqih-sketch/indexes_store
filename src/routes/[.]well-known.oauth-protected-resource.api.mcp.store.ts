import { createFileRoute } from "@tanstack/react-router";
import { storeResourceMetadata } from "@/lib/mcp/store-oauth.server";

export const Route = createFileRoute("/.well-known/oauth-protected-resource/api/mcp/store")({
  server: {
    handlers: {
      GET: async () =>
        Response.json(storeResourceMetadata(), { headers: { "Cache-Control": "no-store" } }),
    },
  },
});

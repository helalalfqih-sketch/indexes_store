import { createFileRoute } from "@tanstack/react-router";
import { storeOauthMetadata } from "@/lib/mcp/store-oauth.server";

export const Route = createFileRoute(
  "/.well-known/oauth-authorization-server/api/mcp/store/oauth",
)({
  server: {
    handlers: {
      GET: async () =>
        Response.json(storeOauthMetadata(), { headers: { "Cache-Control": "no-store" } }),
    },
  },
});

import { createFileRoute } from "@tanstack/react-router";
import { oauthMetadata } from "@/lib/mcp/whatsapp-oauth.server";

export const Route = createFileRoute("/.well-known/oauth-authorization-server")({
  server: { handlers: { GET: async () => Response.json(oauthMetadata(), { headers: { "Cache-Control": "no-store" } }) } },
});

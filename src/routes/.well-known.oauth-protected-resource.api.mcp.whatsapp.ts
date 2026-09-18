import { createFileRoute } from "@tanstack/react-router";
import { resourceMetadata } from "@/lib/mcp/whatsapp-oauth.server";

export const Route = createFileRoute("/.well-known/oauth-protected-resource/api/mcp/whatsapp")({
  server:{handlers:{GET:async()=>Response.json(resourceMetadata(),{headers:{"Cache-Control":"no-store"}})}}
});

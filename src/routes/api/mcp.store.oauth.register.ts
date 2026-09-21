import { createFileRoute } from "@tanstack/react-router";
import { registerStoreClient } from "@/lib/mcp/store-oauth.server";

export const Route = createFileRoute("/api/mcp/store/oauth/register")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as { redirect_uris?: string[] };
          const redirectUris = body.redirect_uris ?? [];
          const clientId = registerStoreClient(redirectUris);
          return Response.json(
            {
              client_id: clientId,
              client_id_issued_at: Math.floor(Date.now() / 1000),
              redirect_uris: redirectUris,
              token_endpoint_auth_method: "none",
              grant_types: ["authorization_code", "refresh_token"],
              response_types: ["code"],
            },
            { status: 201, headers: { "Cache-Control": "no-store" } },
          );
        } catch {
          return Response.json(
            { error: "invalid_client_metadata" },
            { status: 400, headers: { "Cache-Control": "no-store" } },
          );
        }
      },
    },
  },
});

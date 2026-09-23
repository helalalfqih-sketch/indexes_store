import { createFileRoute } from "@tanstack/react-router";
import { issueStoreCode, validateStoreClient } from "@/lib/mcp/store-oauth.server";
import { requireStoreAdminSession } from "@/lib/mcp/store-auth.server";

export const Route = createFileRoute("/api/mcp/store/oauth/approve")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { sub, tenantId } = await requireStoreAdminSession(request);
          const body = (await request.json()) as Record<string, string>;
          validateStoreClient(body.client_id, body.redirect_uri);
          if (!body.state || !body.code_challenge) throw new Error("INVALID_REQUEST");
          const code = issueStoreCode({
            sub,
            tenantId,
            clientId: body.client_id,
            redirectUri: body.redirect_uri,
            challenge: body.code_challenge,
            scope: body.scope || "store.read",
          });
          const redirect = new URL(body.redirect_uri);
          redirect.searchParams.set("code", code);
          redirect.searchParams.set("state", body.state);
          return Response.json(
            { redirect: redirect.toString() },
            { headers: { "Cache-Control": "no-store" } },
          );
        } catch {
          return Response.json(
            { error: "access_denied" },
            { status: 403, headers: { "Cache-Control": "no-store" } },
          );
        }
      },
    },
  },
});

import { createFileRoute } from "@tanstack/react-router";
import { requireWhapiAdmin } from "@/lib/whapi-auth.server";
import { issueCode, validateClient } from "@/lib/mcp/whatsapp-oauth.server";

export const Route = createFileRoute("/api/mcp/oauth/approve")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const sub = await requireWhapiAdmin(request);
          const body = (await request.json()) as Record<string, string>;
          validateClient(body.client_id, body.redirect_uri);
          if (!body.state || !body.code_challenge) throw new Error();
          const code = issueCode({
            sub,
            clientId: body.client_id,
            redirectUri: body.redirect_uri,
            challenge: body.code_challenge,
          });
          const out = new URL(body.redirect_uri);
          out.searchParams.set("code", code);
          out.searchParams.set("state", body.state);
          return Response.json(
            { redirect: out.toString() },
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

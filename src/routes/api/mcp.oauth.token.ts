import { createFileRoute } from "@tanstack/react-router";
import { exchangeCode } from "@/lib/mcp/whatsapp-oauth.server";

export const Route = createFileRoute("/api/mcp/oauth/token")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const form = await request.formData();
          if (form.get("grant_type") !== "authorization_code") throw new Error();
          const code = String(form.get("code") || "");
          const clientId = String(form.get("client_id") || "");
          const redirectUri = String(form.get("redirect_uri") || "");
          const verifier = String(form.get("code_verifier") || "");
          if (!code || !clientId || !redirectUri || verifier.length < 43 || verifier.length > 128)
            throw new Error();
          const access_token = exchangeCode(code, clientId, redirectUri, verifier);
          return Response.json(
            { access_token, token_type: "Bearer", expires_in: 3600, scope: "whatsapp.read" },
            { headers: { "Cache-Control": "no-store", Pragma: "no-cache" } },
          );
        } catch {
          return Response.json(
            { error: "invalid_grant" },
            { status: 400, headers: { "Cache-Control": "no-store" } },
          );
        }
      },
    },
  },
});

import { createFileRoute } from "@tanstack/react-router";
import {
  exchangeStoreCode,
  exchangeStoreRefreshToken,
  STORE_MCP_SCOPE,
} from "@/lib/mcp/store-oauth.server";

function tokenResponse(tokens: { accessToken: string; refreshToken: string }) {
  return Response.json(
    {
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      token_type: "Bearer",
      expires_in: 3600,
      scope: STORE_MCP_SCOPE,
    },
    { headers: { "Cache-Control": "no-store", Pragma: "no-cache" } },
  );
}

export const Route = createFileRoute("/api/mcp/store/oauth/token")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const form = await request.formData();
          const grantType = String(form.get("grant_type") || "");
          if (grantType === "refresh_token") {
            const refreshToken = String(form.get("refresh_token") || "");
            if (!refreshToken) throw new Error("INVALID_GRANT");
            return tokenResponse(exchangeStoreRefreshToken(refreshToken));
          }
          if (grantType !== "authorization_code") throw new Error("INVALID_GRANT");
          const code = String(form.get("code") || "");
          const clientId = String(form.get("client_id") || "");
          const redirectUri = String(form.get("redirect_uri") || "");
          const verifier = String(form.get("code_verifier") || "");
          if (!code || !clientId || !redirectUri || verifier.length < 43 || verifier.length > 128) {
            throw new Error("INVALID_GRANT");
          }
          return tokenResponse(exchangeStoreCode(code, clientId, redirectUri, verifier));
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

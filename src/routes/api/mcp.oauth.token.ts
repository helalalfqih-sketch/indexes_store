import { createFileRoute } from "@tanstack/react-router";
import {
  exchangeCode,
  exchangeRefreshToken,
  issueRefreshToken,
} from "@/lib/mcp/whatsapp-oauth.server";

const SCOPE = "whatsapp.read whatsapp.write offline_access";

export const Route = createFileRoute("/api/mcp/oauth/token")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const form = await request.formData();
          const grantType = String(form.get("grant_type") || "");
          if (grantType === "refresh_token") {
            const refreshToken = String(form.get("refresh_token") || "");
            if (!refreshToken) throw new Error();
            const tokens = exchangeRefreshToken(refreshToken);
            return Response.json(
              {
                access_token: tokens.accessToken,
                refresh_token: tokens.refreshToken,
                token_type: "Bearer",
                expires_in: 3600,
                scope: SCOPE,
              },
              { headers: { "Cache-Control": "no-store", Pragma: "no-cache" } },
            );
          }
          if (grantType !== "authorization_code") throw new Error();
          const code = String(form.get("code") || "");
          const clientId = String(form.get("client_id") || "");
          const redirectUri = String(form.get("redirect_uri") || "");
          const verifier = String(form.get("code_verifier") || "");
          if (!code || !clientId || !redirectUri || verifier.length < 43 || verifier.length > 128)
            throw new Error();
          const access_token = exchangeCode(code, clientId, redirectUri, verifier);
          const sub = JSON.parse(
            Buffer.from(access_token.split(".")[0], "base64url").toString("utf8"),
          ).sub as string;
          return Response.json(
            {
              access_token,
              refresh_token: issueRefreshToken(sub),
              token_type: "Bearer",
              expires_in: 3600,
              scope: SCOPE,
            },
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

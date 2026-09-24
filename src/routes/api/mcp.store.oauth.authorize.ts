import { createFileRoute } from "@tanstack/react-router";
import {
  normalizeStoreScope,
  StoreClientRegistrationError,
  validateStoreClient,
} from "@/lib/mcp/store-oauth.server";

export const Route = createFileRoute("/api/mcp/store/oauth/authorize")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const clientId = url.searchParams.get("client_id") || "";
          const redirectUri = url.searchParams.get("redirect_uri") || "";
          const state = url.searchParams.get("state") || "";
          const challenge = url.searchParams.get("code_challenge") || "";
          const requestedScope = normalizeStoreScope(url.searchParams.get("scope") || "store.read");
          if (
            url.searchParams.get("response_type") !== "code" ||
            url.searchParams.get("code_challenge_method") !== "S256" ||
            !state ||
            !challenge ||
            !clientId ||
            !redirectUri
          ) {
            throw new Error("INVALID_REQUEST");
          }
          validateStoreClient(clientId, redirectUri);
          const next = new URL("/mcp-store-authorize", url.origin);
          for (const key of ["client_id", "redirect_uri", "state", "code_challenge"]) {
            next.searchParams.set(key, url.searchParams.get(key)!);
          }
          next.searchParams.set("scope", requestedScope);
          return Response.redirect(next, 302);
        } catch (error) {
          const code = error instanceof Error ? error.message : "";
          const unavailable = code === "STORE_MCP_OAUTH_NOT_CONFIGURED";
          const reason = unavailable
            ? "authorization_unavailable"
            : code === "INVALID_SCOPE"
              ? "unsupported_scope"
              : ["INVALID_CLIENT", "UNAUTHORIZED", "INVALID_REDIRECT_URI"].includes(code)
                ? "client_registration_invalid"
                : "authorization_parameters_invalid";
          return Response.json(
            {
              error: unavailable
                ? "temporarily_unavailable"
                : code === "INVALID_SCOPE"
                  ? "invalid_scope"
                  : "invalid_request",
              reason,
              ...(error instanceof StoreClientRegistrationError
                ? { registration_issue: error.issue }
                : {}),
            },
            { status: unavailable ? 503 : 400, headers: { "Cache-Control": "no-store" } },
          );
        }
      },
    },
  },
});

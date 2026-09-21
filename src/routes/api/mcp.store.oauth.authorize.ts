import { createFileRoute } from "@tanstack/react-router";
import { validateStoreClient } from "@/lib/mcp/store-oauth.server";

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
          const requestedScope = url.searchParams.get("scope") || "store.read";
          if (
            url.searchParams.get("response_type") !== "code" ||
            url.searchParams.get("code_challenge_method") !== "S256" ||
            !state ||
            !challenge ||
            !clientId ||
            !redirectUri ||
            !requestedScope.split(" ").every((scope) => ["store.read", "offline_access"].includes(scope))
          ) {
            throw new Error("INVALID_REQUEST");
          }
          validateStoreClient(clientId, redirectUri);
          const next = new URL("/mcp-store-authorize", url.origin);
          for (const key of ["client_id", "redirect_uri", "state", "code_challenge"]) {
            next.searchParams.set(key, url.searchParams.get(key)!);
          }
          return Response.redirect(next, 302);
        } catch {
          return Response.json(
            { error: "invalid_request" },
            { status: 400, headers: { "Cache-Control": "no-store" } },
          );
        }
      },
    },
  },
});

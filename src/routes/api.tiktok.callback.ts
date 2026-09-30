import { createFileRoute } from "@tanstack/react-router";
import { completeTikTokOAuth } from "@/lib/tiktok.server";

function safeReason(error: unknown): string {
  const value = error instanceof Error ? error.message : "TIKTOK_OAUTH_FAILED";
  const sanitized = value.replace(/[^A-Z0-9_:-]/gi, "").slice(0, 80);
  return sanitized || "TIKTOK_OAUTH_FAILED";
}

function redirect(location: string) {
  return new Response(null, {
    status: 302,
    headers: {
      Location: location,
      "Cache-Control": "no-store",
      Pragma: "no-cache",
    },
  });
}

export const Route = createFileRoute("/api/tiktok/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);

        if (url.searchParams.get("error")) {
          return redirect("/admin/integrations/tiktok?tiktok=error&reason=provider_denied");
        }

        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        if (!code || !state) {
          return redirect("/admin/integrations/tiktok?tiktok=error&reason=invalid_callback");
        }

        try {
          const result = await completeTikTokOAuth({ code, state });
          const target = new URL(result.returnTo, url.origin);
          target.searchParams.set("tiktok", "connected");
          return redirect(target.pathname + target.search);
        } catch (error) {
          console.error("[tiktok-oauth] callback failed", {
            reason: safeReason(error),
          });
          return redirect(
            `/admin/integrations/tiktok?tiktok=error&reason=${encodeURIComponent(safeReason(error))}`,
          );
        }
      },
    },
  },
});

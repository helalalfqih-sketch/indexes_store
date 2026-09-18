import { createFileRoute } from "@tanstack/react-router";
import { verifyWhapiWebhook } from "@/lib/whapi.server";

export const Route = createFileRoute("/api/webhooks/whapi")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!verifyWhapiWebhook(request)) {
          return new Response("Forbidden", { status: 403 });
        }
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }
        // Phase 1: authenticated ingestion only. No send/delete/publish side effects.
        return Response.json({ ok: true, provider: "whapi", received: Boolean(body) });
      },
    },
  },
});

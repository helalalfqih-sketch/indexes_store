import { createFileRoute } from "@tanstack/react-router";
import { handleWhapiWebhook } from "@/lib/whapi-http.server";

export const Route = createFileRoute("/api/webhooks/whapi")({
  server: { handlers: { POST: ({ request }) => handleWhapiWebhook(request) } },
});

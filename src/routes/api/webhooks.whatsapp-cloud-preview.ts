import { createFileRoute } from "@tanstack/react-router";
import { handleCloudPreviewWebhook } from "@/lib/mcp/whatsapp-cloud-preview.server";

export const Route = createFileRoute("/api/webhooks/whatsapp-cloud-preview")({
  server: {
    handlers: {
      GET: ({ request }) => handleCloudPreviewWebhook(request),
      POST: ({ request }) => handleCloudPreviewWebhook(request),
    },
  },
});

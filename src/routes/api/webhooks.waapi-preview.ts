import { createFileRoute } from "@tanstack/react-router";
import { disabledWaapiPreviewCallback } from "@/lib/mcp/waapi-preview.server";

/**
 * Intentionally fail closed. Do not acknowledge/store third-party webhook
 * payloads until WaAPI's authenticated callback contract is verified.
 */
export const Route = createFileRoute("/api/webhooks/waapi-preview")({
  server: {
    handlers: {
      GET: () => disabledWaapiPreviewCallback(),
      POST: () => disabledWaapiPreviewCallback(),
    },
  },
});

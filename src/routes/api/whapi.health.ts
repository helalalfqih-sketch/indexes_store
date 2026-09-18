import { createFileRoute } from "@tanstack/react-router";
import { whapiRequest } from "@/lib/whapi.server";

export const Route = createFileRoute("/api/whapi/health")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const channel = await whapiRequest("/health");
          return Response.json({ ok: true, provider: "whapi", channel });
        } catch {
          return Response.json({ ok: false, provider: "whapi" }, { status: 503 });
        }
      },
    },
  },
});

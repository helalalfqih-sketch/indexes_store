import { createFileRoute } from "@tanstack/react-router";
import { handleWhapiRead } from "@/lib/whapi-http.server";

export const Route = createFileRoute("/api/whapi/health")({
  server: { handlers: { GET: ({ request }) => handleWhapiRead(request, "health") } },
});

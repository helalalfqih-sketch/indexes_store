import { createFileRoute } from "@tanstack/react-router";
import { handleWhapiRead } from "@/lib/whapi-http.server";

export const Route = createFileRoute("/api/whapi/read")({
  server: { handlers: { GET: ({ request }) => handleWhapiRead(request) } },
});

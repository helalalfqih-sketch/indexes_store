import { createFileRoute } from "@tanstack/react-router";
import { createCatalogAdapter } from "@/lib/mcp/catalog.server";
import { handleMcpRequest } from "@/lib/mcp/handler.server";

const handle = ({ request }: { request: Request }) =>
  handleMcpRequest(request, createCatalogAdapter());

export const Route = createFileRoute("/api/mcp")({
  server: { handlers: { POST: handle, GET: handle, DELETE: handle, OPTIONS: handle } },
});

import { createFileRoute } from "@tanstack/react-router";
import { diagnoseShopifyCatalog } from "@/lib/shopify/catalog.functions";

export const Route = createFileRoute("/api/catalog-health")({
  server: {
    handlers: {
      GET: async () =>
        Response.json(await diagnoseShopifyCatalog(), {
          headers: { "Cache-Control": "no-store" },
        }),
    },
  },
});

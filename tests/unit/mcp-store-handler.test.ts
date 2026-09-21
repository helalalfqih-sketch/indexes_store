import { describe, expect, it, vi } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { handleStoreMcp } from "@/lib/mcp/store-handler.server";
import type { StoreAdminAdapter } from "@/lib/mcp/store-admin.server";

function fixture(): StoreAdminAdapter {
  return {
    health: vi.fn(async () => ({ mode: "read-only", tenant: { id: "tenant-a" } })),
    searchProducts: vi.fn(async () => ({ products: [] })),
    getProduct: vi.fn(async () => ({ found: false, product: null })),
    inspectCatalog: vi.fn(async () => ({ issues: [] })),
    inspectInventory: vi.fn(async () => ({ products: [] })),
    inspectOrders: vi.fn(async () => ({ orders: [], piiIncluded: false })),
    inspectPages: vi.fn(async () => ({ pages: [] })),
    inspectRuntimeErrors: vi.fn(async () => ({ incidents: [] })),
    auditLog: vi.fn(async () => ({ entries: [] })),
  };
}

async function connected() {
  const adapter = fixture();
  const client = new Client({ name: "store-mcp-test", version: "1.0.0" });
  const transport = new StreamableHTTPClientTransport(
    new URL("https://indexes-store.vercel.app/api/mcp/store"),
    {
      requestInit: { headers: { Authorization: "Bearer test" } },
      fetch: (url, init) =>
        handleStoreMcp(new Request(url, init), {
          authorize: () => ({ sub: "admin", tenantId: "tenant-a" }),
          adapterFactory: (tenantId) => {
            expect(tenantId).toBe("tenant-a");
            return adapter;
          },
        }),
    },
  );
  await client.connect(transport);
  return { client, adapter };
}

describe("private store MCP", () => {
  it("exposes only tenant-bound read tools", async () => {
    const { client } = await connected();
    try {
      const { tools } = await client.listTools();
      expect(tools.map((tool) => tool.name).sort()).toEqual(
        [
          "audit_log",
          "get_product",
          "inspect_catalog",
          "inspect_inventory",
          "inspect_orders",
          "inspect_pages",
          "inspect_runtime_errors",
          "search_products",
          "store_health",
        ].sort(),
      );
      expect(
        tools.every((tool) => tool.annotations?.readOnlyHint && !tool.annotations?.destructiveHint),
      ).toBe(true);
      expect((await client.callTool({ name: "update_product", arguments: {} })).isError).toBe(true);
    } finally {
      await client.close();
    }
  });

  it("does not allow a caller-supplied tenant override", async () => {
    const { client, adapter } = await connected();
    try {
      const response = await client.callTool({
        name: "search_products",
        arguments: { query: "هاتف", tenant_id: "tenant-b" },
      });
      expect(response.isError).toBe(true);
      expect(adapter.searchProducts).not.toHaveBeenCalled();
    } finally {
      await client.close();
    }
  });

  it("rejects requests without OAuth before constructing an adapter", async () => {
    const adapterFactory = vi.fn(() => fixture());
    const response = await handleStoreMcp(
      new Request("https://indexes-store.vercel.app/api/mcp/store", { method: "POST" }),
      { adapterFactory },
    );
    expect(response.status).toBe(401);
    expect(response.headers.get("www-authenticate")).toContain("oauth-protected-resource");
    expect(adapterFactory).not.toHaveBeenCalled();
  });
});

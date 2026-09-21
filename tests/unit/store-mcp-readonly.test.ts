import { describe, expect, it } from "vitest";
import {
  STORE_MCP_PROTOCOL_VERSION,
  STORE_MCP_TOOLS,
  runStoreBridgeTool,
  type StoreBridgeContext,
} from "../../src/lib/mcp/store-bridge.server";
import { handleStoreMcpRequest } from "../../src/routes/api/mcp.store";

const tenantId = "11111111-1111-4111-8111-111111111111";
const otherTenantId = "22222222-2222-4222-8222-222222222222";

const context: StoreBridgeContext = {
  db: {} as StoreBridgeContext["db"],
  tenantId,
  userId: "33333333-3333-4333-8333-333333333333",
  access: "tenant_member",
};

describe("Indexes Store MCP read-only bridge", () => {
  it("publishes exactly the eight approved read-only tools", () => {
    expect(STORE_MCP_PROTOCOL_VERSION).toBe("2025-06-18");
    expect(STORE_MCP_TOOLS).toHaveLength(8);

    const names = STORE_MCP_TOOLS.map((tool) => tool.name);
    expect(new Set(names).size).toBe(names.length);
    expect(names).toEqual([
      "store_health",
      "search_products",
      "get_product",
      "inspect_catalog",
      "inspect_inventory",
      "inspect_orders",
      "inspect_pages",
      "audit_log",
    ]);
    expect(names.every((name) => !/^(create|update|delete|publish|rollback)/.test(name))).toBe(true);
  });

  it("requires explicit tenant_id for every tool", () => {
    for (const tool of STORE_MCP_TOOLS) {
      expect(tool.inputSchema.required).toContain("tenant_id");
      expect(tool.inputSchema.additionalProperties).toBe(false);
    }
  });

  it("fails closed before database access when tool tenant differs from authenticated tenant", async () => {
    const result = await runStoreBridgeTool(
      "store_health",
      { tenant_id: otherTenantId },
      context,
    );

    expect(result.isError).toBe(true);
    expect(result.content[0]?.text).toContain("does not match");
  });

  it("returns an MCP tool error for unknown tools", async () => {
    const result = await runStoreBridgeTool("update_product", { tenant_id: tenantId }, context);
    expect(result.isError).toBe(true);
    expect(result.content[0]?.text).toContain("Unknown read-only store tool");
  });

  it("rejects requests without a Supabase bearer token", async () => {
    const request = new Request("https://indexes-store.vercel.app/api/mcp/store", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-tenant-id": tenantId,
      },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize" }),
    });

    const result = await handleStoreMcpRequest(request);
    expect(result.status).toBe(401);
    expect(result.headers.get("cache-control")).toBe("no-store");
    expect(result.headers.get("www-authenticate")).toContain("Bearer");
  });

  it("rejects non-JWT bearer values before accessing Supabase", async () => {
    const request = new Request("https://indexes-store.vercel.app/api/mcp/store", {
      method: "POST",
      headers: {
        authorization: "Bearer not-a-jwt",
        "content-type": "application/json",
        "x-tenant-id": tenantId,
      },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }),
    });

    const result = await handleStoreMcpRequest(request);
    expect(result.status).toBe(401);
  });
});

import { describe, expect, it, vi } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { handleMcpRequest } from "@/lib/mcp/handler.server";

function fixture() {
  const product = {
    id: "car-diffuser",
    title: "معطر سيارة",
    description: "وصف المنتج",
    price: 8500,
    currency: "YER",
    available: true,
    url: "https://indexes-store.vercel.app/product/car-diffuser",
    imageUrl: null,
    updatedAt: "2026-09-16T00:00:00Z",
  };
  return {
    search: vi.fn(async () => ({ products: [product], nextCursor: null })),
    fetch: vi.fn(async () => product),
  };
}

async function connected(catalog = fixture()) {
  const client = new Client({ name: "mcp-verification", version: "1.0.0" });
  const transport = new StreamableHTTPClientTransport(
    new URL("https://indexes-store.vercel.app/api/mcp"),
    {
      fetch: (url, init) => handleMcpRequest(new Request(url, init), catalog),
    },
  );
  await client.connect(transport);
  return { client, catalog };
}

function request(body: string, headers: Record<string, string> = {}) {
  return new Request("https://indexes-store.vercel.app/api/mcp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      ...headers,
    },
    body,
  });
}

describe("public MCP connection", () => {
  it("initializes with the official client and exposes only three read-only tools", async () => {
    const { client } = await connected();
    try {
      expect(client.getServerVersion()?.name).toBe("indexes-store");
      const { tools } = await client.listTools();
      expect(tools.map((tool) => tool.name).sort()).toEqual(["fetch", "get_store_info", "search"]);
      expect(
        tools.every((tool) => tool.annotations?.readOnlyHint && !tool.annotations?.destructiveHint),
      ).toBe(true);
      const info = await client.callTool({ name: "get_store_info", arguments: {} });
      expect(info.structuredContent).toMatchObject({ access: "public-catalog-read-only" });
    } finally {
      await client.close();
    }
  });

  it("searches then fetches live details without exposing inventory quantity", async () => {
    const { client, catalog } = await connected();
    try {
      const search = await client.callTool({
        name: "search",
        arguments: { query: "معطر", limit: 5 },
      });
      expect(search.structuredContent).toMatchObject({
        results: [{ id: "car-diffuser", title: "معطر سيارة" }],
        nextCursor: null,
      });
      expect(catalog.search).toHaveBeenCalledWith("معطر", 5, undefined);
      const detail = await client.callTool({ name: "fetch", arguments: { id: "car-diffuser" } });
      expect(detail.structuredContent).toMatchObject({ found: true, price: 8500, available: true });
      expect(detail.structuredContent).not.toHaveProperty("stock");
      expect(detail.structuredContent).not.toHaveProperty("inventoryQuantity");
    } finally {
      await client.close();
    }
  });

  it("rejects excessive limits, tenant overrides and URL injection before reading data", async () => {
    const { client, catalog } = await connected();
    try {
      for (const args of [
        { query: "x", limit: 21 },
        { query: "x", tenantId: "another-store" },
      ]) {
        expect((await client.callTool({ name: "search", arguments: args })).isError).toBe(true);
      }
      expect(
        (await client.callTool({ name: "fetch", arguments: { id: "https://attacker.test/path" } }))
          .isError,
      ).toBe(true);
      expect(catalog.search).not.toHaveBeenCalled();
      expect(catalog.fetch).not.toHaveBeenCalled();
      expect((await client.callTool({ name: "delete_product", arguments: {} })).isError).toBe(true);
    } finally {
      await client.close();
    }
  });

  it("accepts Arabic product slugs with combining marks returned by the adapter", async () => {
    const { client, catalog } = await connected();
    try {
      const id = "مُعطّر-سيارة";
      expect((await client.callTool({ name: "fetch", arguments: { id } })).isError).not.toBe(true);
      expect(catalog.fetch).toHaveBeenCalledWith(id);
    } finally {
      await client.close();
    }
  });

  it("returns an explicit sanitized error rather than fabricated data on upstream failure", async () => {
    const catalog = fixture();
    catalog.search.mockRejectedValueOnce(new Error("private credential or upstream response"));
    const { client } = await connected(catalog);
    try {
      const response = await client.callTool({ name: "search", arguments: { query: "x" } });
      expect(response.isError).toBe(true);
      expect(JSON.stringify(response)).toContain("Live catalog unavailable");
      expect(JSON.stringify(response)).not.toContain("private credential");
      expect(response.structuredContent).toBeUndefined();
    } finally {
      await client.close();
    }
  });

  it("rejects untrusted origins, malformed JSON, batches and oversized bodies", async () => {
    const catalog = fixture();
    expect(
      (await handleMcpRequest(request("{}", { Origin: "https://attacker.test" }), catalog)).status,
    ).toBe(403);
    expect((await handleMcpRequest(request("{broken"), catalog)).status).toBe(400);
    expect((await handleMcpRequest(request("[]"), catalog)).status).toBe(400);
    expect(
      (await handleMcpRequest(request(JSON.stringify({ text: "x".repeat(17000) })), catalog))
        .status,
    ).toBe(413);
    expect(
      (await handleMcpRequest(new Request("https://indexes-store.vercel.app/api/mcp"), catalog))
        .status,
    ).toBe(405);
    expect(catalog.search).not.toHaveBeenCalled();
  });
});

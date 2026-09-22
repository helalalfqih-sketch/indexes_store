import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/mcp/store-handler.server", () => ({
  handleStoreMcp: vi.fn(async () => new Response("ok", { status: 200 })),
}));

describe("Store MCP V2 discovery route", () => {
  it("keeps a distinct versioned route source for connector schema refresh", async () => {
    const source = await import("@/routes/api/mcp.store-v2");
    expect(source.Route).toBeDefined();
  });
});

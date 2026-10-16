import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-start", () => {
  const serverFn = {
    inputValidator: () => serverFn,
    handler: (handler: unknown) => handler,
  };
  return { createServerFn: () => serverFn };
});

import { diagnoseShopifyCatalog } from "@/lib/shopify/catalog.functions";

describe("Shopify catalog health", () => {
  beforeEach(() => {
    vi.stubEnv("CATALOG_SOURCE", "shopify");
    vi.stubEnv("SHOPIFY_STORE_DOMAIN", "example.myshopify.com");
    vi.stubEnv("SHOPIFY_STOREFRONT_ACCESS_TOKEN", "test-token");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("checks the actual product fields without requiring inventory scope", async () => {
    const fetchMock = vi.fn(async (_url: string, options: RequestInit) => {
      const query = JSON.parse(String(options.body)).query as string;
      const payload = query.includes("quantityAvailable")
        ? { errors: [{ message: "Access denied for quantityAvailable field" }] }
        : { data: { products: { nodes: [{ id: "gid://shopify/Product/1" }] } } };
      return new Response(JSON.stringify(payload), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const health = await diagnoseShopifyCatalog();

    expect(health.healthy).toBe(true);
    expect(health.sampleProducts).toBe(1);
    expect(fetchMock).toHaveBeenCalledOnce();
    const query = JSON.parse(String(fetchMock.mock.calls[0][1].body)).query as string;
    expect(query).toContain("variants(first: 20)");
    expect(query).not.toContain("quantityAvailable");
  });
});


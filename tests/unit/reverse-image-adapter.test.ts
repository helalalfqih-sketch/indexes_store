import { afterEach, describe, expect, it, vi } from "vitest";
import { createReverseImageSearchAdapter } from "@/lib/mcp/reverse-image-adapter.server";

describe("reverse image MCP adapter", () => {
  afterEach(() => {
    delete process.env.SERPAPI_API_KEY;
    delete process.env.APIFY_API_TOKEN;
    delete process.env.APIFY_REVERSE_IMAGE_ACTOR_ID;
  });

  it("uses SerpApi Google Lens first and returns bounded normalized matches", async () => {
    process.env.SERPAPI_API_KEY = "secret-serpapi-key";
    process.env.APIFY_API_TOKEN = "secret-apify-token";
    const fetchMock = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      const endpoint = new URL(String(url));
      expect(endpoint.origin).toBe("https://serpapi.com");
      expect(endpoint.searchParams.get("engine")).toBe("google_lens");
      expect(endpoint.searchParams.get("url")).toBe("https://example.com/product.jpg");
      expect(endpoint.searchParams.get("api_key")).toBe("secret-serpapi-key");
      expect(init?.method).toBe("GET");
      return new Response(
        JSON.stringify({
          search_metadata: { status: "Success" },
          visual_matches: [
            {
              title: "Matching product",
              link: "https://shop.example/item",
              source: "shop.example",
              thumbnail: "https://images.example/thumb.jpg",
              price: { value: "$10", extracted_value: 10 },
              api_key: "must-not-pass-through",
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    });

    const result = await createReverseImageSearchAdapter(fetchMock as typeof fetch).search(
      "https://example.com/product.jpg",
      10,
    );

    expect(result).toMatchObject({
      provider: "serpapi",
      engine: "google_lens",
      count: 1,
      provider_secrets_included: false,
      matches: [
        {
          rank: 1,
          title: "Matching product",
          url: "https://shop.example/item",
          source: "shop.example",
          price: "$10",
        },
      ],
    });
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(JSON.stringify(result)).not.toContain("secret-serpapi-key");
    expect(JSON.stringify(result)).not.toContain("must-not-pass-through");
  });

  it("falls back to Apify without placing its token in the URL", async () => {
    process.env.SERPAPI_API_KEY = "secret-serpapi-key";
    process.env.APIFY_API_TOKEN = "secret-apify-token";
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("upstream failure", { status: 503 }))
      .mockImplementationOnce(async (url: string | URL | Request, init?: RequestInit) => {
        expect(String(url)).toContain("/acts/s-r~google-lens/run-sync-get-dataset-items");
        expect(String(url)).not.toContain("secret-apify-token");
        expect(new Headers(init?.headers).get("authorization")).toBe("Bearer secret-apify-token");
        expect(JSON.parse(String(init?.body))).toMatchObject({
          image_urls: ["https://example.com/product.jpg"],
        });
        return new Response(
          JSON.stringify([
            {
              matches: [
                {
                  title: "Fallback product",
                  pageUrl: "https://shop.example/fallback",
                  source: "shop.example",
                },
              ],
            },
          ]),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      });

    const result = await createReverseImageSearchAdapter(fetchMock as typeof fetch).search(
      "https://example.com/product.jpg",
      10,
    );

    expect(result).toMatchObject({
      provider: "apify",
      fallback_from: "serpapi",
      fallback_reason: "SERPAPI_HTTP_503",
      count: 1,
      provider_secrets_included: false,
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(JSON.stringify(result)).not.toContain("secret-apify-token");
    expect(JSON.stringify(result)).not.toContain("secret-serpapi-key");
  });

  it("uses Apify directly when SerpApi is not configured", async () => {
    process.env.APIFY_API_TOKEN = "secret-apify-token";
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const result = await createReverseImageSearchAdapter(fetchMock as typeof fetch).search(
      "https://example.com/product.jpg",
      10,
    );

    expect(result).toMatchObject({
      provider: "apify",
      actor: "s-r/google-lens",
      count: 0,
      provider_secrets_included: false,
    });
  });

  it("fails closed when no reverse-image provider is configured", async () => {
    const fetchMock = vi.fn();
    await expect(
      createReverseImageSearchAdapter(fetchMock as typeof fetch).search(
        "https://example.com/product.jpg",
        10,
      ),
    ).rejects.toThrow("REVERSE_IMAGE_PROVIDER_NOT_CONFIGURED");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

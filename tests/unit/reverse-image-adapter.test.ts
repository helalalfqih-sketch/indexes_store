import { afterEach, describe, expect, it, vi } from "vitest";
import { createReverseImageSearchAdapter } from "@/lib/mcp/reverse-image-adapter.server";

describe("reverse image MCP adapter", () => {
  afterEach(() => {
    delete process.env.APIFY_API_TOKEN;
    delete process.env.APIFY_REVERSE_IMAGE_ACTOR_ID;
  });

  it("calls Apify without placing the token in the URL and returns bounded normalized matches", async () => {
    process.env.APIFY_API_TOKEN = "secret-apify-token";
    const fetchMock = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
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
                title: "Matching product",
                pageUrl: "https://shop.example/item",
                source: "shop.example",
                thumbnailUrl: "https://images.example/thumb.jpg",
                price: "$10",
                accessToken: "must-not-pass-through",
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
      actor: "s-r/google-lens",
      count: 1,
      provider_secrets_included: false,
      matches: [
        {
          rank: 1,
          title: "Matching product",
          url: "https://shop.example/item",
          source: "shop.example",
        },
      ],
    });
    expect(JSON.stringify(result)).not.toContain("must-not-pass-through");
  });

  it("fails closed when the Apify token is absent", async () => {
    const fetchMock = vi.fn();
    await expect(
      createReverseImageSearchAdapter(fetchMock as typeof fetch).search(
        "https://example.com/product.jpg",
        10,
      ),
    ).rejects.toThrow("APIFY_API_TOKEN_NOT_CONFIGURED");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

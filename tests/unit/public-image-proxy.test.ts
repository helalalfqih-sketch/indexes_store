import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (config: unknown) => config,
}));

import {
  ImagePayloadTooLargeError,
  Route,
  getSupabasePublicImageTarget,
  normalizeImageVariant,
  readResponseBodyWithLimit,
} from "../../src/routes/api/public.image-proxy";

type ImageProxyHandler = (context: { request: Request }) => Promise<Response>;

const handler = (Route as unknown as { server: { handlers: { GET: ImageProxyHandler } } }).server
  .handlers.GET;
const originalTransformFlag = process.env.SUPABASE_IMAGE_TRANSFORMATIONS_ENABLED;

function proxyRequest(source: string, params: Record<string, string> = {}): Request {
  const url = new URL("https://indexes-store.com/api/public/image-proxy");
  url.searchParams.set("url", source);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  return new Request(url);
}

describe("public image proxy egress controls", () => {
  beforeEach(() => {
    delete process.env.SUPABASE_IMAGE_TRANSFORMATIONS_ENABLED;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    if (originalTransformFlag === undefined) {
      delete process.env.SUPABASE_IMAGE_TRANSFORMATIONS_ENABLED;
    } else {
      process.env.SUPABASE_IMAGE_TRANSFORMATIONS_ENABLED = originalTransformFlag;
    }
  });

  it("normalizes dimensions, quality, and format into bounded cache variants", () => {
    const variant = normalizeImageVariant(
      new URLSearchParams({ w: "129", h: "9999", q: "78", format: "JPG" }),
    );

    expect(variant).toEqual({
      width: 384,
      height: 1600,
      quality: 80,
      format: "jpeg",
      requested: true,
    });
  });

  it("maps transformed Supabase URLs back to the canonical public object URL by default", () => {
    const source = new URL(
      "https://project.supabase.co/storage/v1/render/image/public/product-images/a.jpg?width=999&token=unused",
    );
    const target = getSupabasePublicImageTarget(
      source,
      normalizeImageVariant(new URLSearchParams({ w: "300", q: "79", format: "webp" })),
      false,
    );

    expect(target?.toString()).toBe(
      "https://project.supabase.co/storage/v1/object/public/product-images/a.jpg",
    );
  });

  it("redirects public Supabase images to its CDN without downloading them", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const response = await handler({
      request: proxyRequest(
        "https://project.supabase.co/storage/v1/object/public/product-images/a.jpg?download=1",
        { w: "301", q: "79", format: "webp" },
      ),
    });

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://project.supabase.co/storage/v1/object/public/product-images/a.jpg",
    );
    expect(response.headers.get("cache-control")).toContain("s-maxage=86400");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("uses native Supabase transformation only when explicitly enabled", async () => {
    process.env.SUPABASE_IMAGE_TRANSFORMATIONS_ENABLED = "true";
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const response = await handler({
      request: proxyRequest(
        "https://project.supabase.co/storage/v1/object/public/product-images/a.jpg",
        { w: "301", q: "79", format: "webp" },
      ),
    });
    const target = new URL(response.headers.get("location") || "https://invalid.test");

    expect(response.status).toBe(307);
    expect(target.pathname).toBe("/storage/v1/render/image/public/product-images/a.jpg");
    expect(Object.fromEntries(target.searchParams)).toEqual({
      width: "384",
      quality: "80",
      resize: "contain",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("redirects arbitrary external requests to one canonical variant", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const response = await handler({
      request: proxyRequest("https://images.unsplash.com/photo.jpg", {
        w: "300",
        q: "78",
        format: "JPG",
      }),
    });
    const canonical = new URL(response.headers.get("location") || "https://invalid.test");

    expect(response.status).toBe(307);
    expect(canonical.searchParams.get("w")).toBe("384");
    expect(canonical.searchParams.get("q")).toBe("80");
    expect(canonical.searchParams.get("format")).toBe("jpeg");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("passes through original raster bytes when no transform was requested", async () => {
    const imageBytes = new Uint8Array([1, 2, 3, 4]);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(imageBytes, {
          headers: { "content-type": "image/png", "content-length": "4" },
        }),
      ),
    );

    const response = await handler({
      request: proxyRequest("https://images.unsplash.com/photo.png"),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/png");
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(imageBytes);
  });

  it("rejects an upstream body declared over the 5MB limit", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(null, {
          headers: {
            "content-type": "image/jpeg",
            "content-length": String(5 * 1024 * 1024 + 1),
          },
        }),
      ),
    );

    const response = await handler({
      request: proxyRequest("https://images.unsplash.com/photo.jpg"),
    });

    expect(response.status).toBe(413);
  });

  it("stops streamed bodies that exceed the limit without a content-length header", async () => {
    const response = new Response(
      new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array([1, 2]));
          controller.enqueue(new Uint8Array([3, 4]));
          controller.close();
        },
      }),
    );

    await expect(readResponseBodyWithLimit(response, 3)).rejects.toBeInstanceOf(
      ImagePayloadTooLargeError,
    );
  });
});

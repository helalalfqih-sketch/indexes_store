import { describe, expect, it, vi } from "vitest";
import { createStoreInspectionAdapter } from "@/lib/mcp/store-inspection.server";

describe("store site inspection adapter", () => {
  it("blocks inspection outside the Store origin", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const adapter = createStoreInspectionAdapter();
    await expect(adapter.inspectPage("https://example.com/")).rejects.toThrow("SITE_URL_FORBIDDEN");
    expect(fetchMock).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("extracts page and interaction signals without mutating the site", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(
        `<!doctype html><html><head><title>الرئيسية</title><meta name="description" content="متجر"></head>
        <body><h1>اندكس ستور</h1><a href="/products">المنتجات</a>
        <button aria-label="شراء">شراء</button><img src="/hero.jpg"></body></html>`,
        { status: 200, headers: { "content-type": "text/html" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    const adapter = createStoreInspectionAdapter();
    const result = await adapter.inspectPage("https://indexes-store.vercel.app/");
    expect(result.status).toBe(200);
    expect(result.title).toBe("الرئيسية");
    expect(result.elementCount).toBe(2);
    expect(result.missingAltImages).toBe(1);
    expect(result.inspectionMode).toBe("read-only-http");
    vi.unstubAllGlobals();
  });
});

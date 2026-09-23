/* eslint-disable prettier/prettier */
import { afterEach, describe, expect, it, vi } from "vitest";
import { createStoreInspectionAdapter } from "@/lib/mcp/store-inspection.server";

describe("store site inspection adapter", () => {
  afterEach(() => vi.unstubAllGlobals());

  it.each(["https://indexes-store.vercel.app", "https://indexes-store-rosy.vercel.app"])("inspects forms and crawls only the requested alias: %s", async (origin) => {
    const fetchMock = vi.fn<typeof fetch>(async () => new Response('<title>Store</title><a href="/account">Account</a><a href="https://example.com">External</a><form method="get"></form>', { headers: { "content-type": "text/html" } }));
    vi.stubGlobal("fetch", fetchMock);
    const adapter = createStoreInspectionAdapter();
    const forms = await adapter.inspectForms(origin);
    expect(forms.forms).toHaveLength(1);
    const crawl = await adapter.inspectSite(origin, 2);
    expect(crawl.scanned).toBe(2);
    expect(fetchMock.mock.calls.every(([url]) => new URL(String(url)).origin === origin)).toBe(true);
  });

  it.each(["https://indexes-store-rosy.vercel.app.evil.test", "https://indexes-store-untrusted.vercel.app", "http://indexes-store-rosy.vercel.app", "https://user:pass@indexes-store.vercel.app"])("rejects unapproved URL %s before fetching", async (url) => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(createStoreInspectionAdapter().inspectForms(url)).rejects.toThrow("SITE_URL_FORBIDDEN");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not follow redirects outside the approved origin", async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 302, headers: { location: "http://127.0.0.1/private" } }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(createStoreInspectionAdapter().inspectPage("https://indexes-store-rosy.vercel.app")).rejects.toThrow("SITE_URL_FORBIDDEN");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(expect.any(URL), expect.objectContaining({ redirect: "manual" }));
  });

  it("follows same-origin redirects", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response(null, { status: 302, headers: { location: "/account" } })).mockResolvedValueOnce(new Response("<title>Account</title>", { headers: { "content-type": "text/html" } }));
    vi.stubGlobal("fetch", fetchMock);
    const result = await createStoreInspectionAdapter().inspectPage("https://indexes-store-rosy.vercel.app");
    expect(result.title).toBe("Account");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
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

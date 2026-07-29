import { expect, test } from "@playwright/test";

const routes = [
  { path: "/robots.txt", contentType: "text/plain" },
  { path: "/sitemap.xml", contentType: "application/xml" },
  { path: "/google-shopping.xml", contentType: "application/rss+xml" },
] as const;

test.describe("canonical SEO routes", () => {
  for (const route of routes) {
    test(`${route.path} is served at the canonical dot path`, async ({ request }) => {
      const response = await request.get(route.path);
      expect(response.status()).toBe(200);
      expect(response.headers()["content-type"]).toContain(route.contentType);
      expect((await response.text()).length).toBeGreaterThan(20);
    });
  }

  test("legacy slash aliases are not treated as canonical endpoints", async ({ request }) => {
    for (const path of ["/robots/txt", "/sitemap/xml", "/google-shopping/xml"]) {
      const response = await request.get(path, { maxRedirects: 0 });
      expect([301, 302, 307, 308, 404]).toContain(response.status());
    }
  });
});

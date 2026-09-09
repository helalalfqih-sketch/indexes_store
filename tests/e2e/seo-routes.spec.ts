import { expect, test } from "@playwright/test";

const seoRoutes = [
  { path: "/robots.txt", contentType: "text/plain", marker: "User-agent: *" },
  { path: "/sitemap.xml", contentType: "application/xml", marker: "<urlset" },
  { path: "/google-shopping.xml", contentType: "application/rss+xml", marker: "<rss" },
] as const;

test.describe("public SEO and trust routes", () => {
  for (const route of seoRoutes) {
    test(`${route.path} serves the canonical response`, async ({ request }) => {
      const response = await request.get(route.path);
      expect(response.status()).toBe(200);
      expect(response.headers()["content-type"]).toContain(route.contentType);
      expect(await response.text()).toContain(route.marker);
    });
  }

  for (const path of ["/pages/shipping-policy", "/pages/return-policy", "/pages/faq"]) {
    test(`${path} is available without CMS seeding`, async ({ request }) => {
      const response = await request.get(path);
      expect(response.status()).toBe(200);
      expect(response.headers()["content-type"]).toContain("text/html");
      expect((await response.text()).length).toBeGreaterThan(100);
    });
  }
});

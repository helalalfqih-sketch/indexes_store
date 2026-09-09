import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const origin = new URL(request.url).origin;
        const baseUrl = process.env.SITE_URL || (origin !== "null" ? origin : "");
        const content = `# Robots.txt — Indexes Store | اندكس ستور
User-agent: *
Allow: /
Allow: /product/
Allow: /category/
Allow: /offers
Disallow: /admin
Disallow: /admin/
Disallow: /account
Disallow: /cart
Disallow: /checkout
Disallow: /auth
Disallow: /onboarding
Disallow: /api/
Disallow: /immersive-store
Disallow: /demo/
Sitemap: ${baseUrl}/sitemap.xml
`;
        return new Response(content, {
          status: 200,
          headers: {
            "content-type": "text/plain; charset=utf-8",
            "cache-control": "public, max-age=86400",
          },
        });
      },
    },
  },
});

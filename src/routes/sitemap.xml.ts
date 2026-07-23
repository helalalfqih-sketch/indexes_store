/**
 * Dynamic sitemap.xml server route
 * ─────────────────────────────────
 * Generates a comprehensive sitemap including:
 *   • Homepage
 *   • Static public pages (offers)
 *   • All product pages (from DB/seed)
 *   • All category pages (from DB/seed)
 *
 * TanStack Start server route — no React component needed.
 */

import { createFileRoute } from "@tanstack/react-router";
import { fetchProducts } from "@/lib/actions/product.actions";
import { fetchCategories } from "@/lib/actions/category.actions";

function toXmlDate(d = new Date()): string {
  return d.toISOString().split("T")[0];
}

function urlEntry(loc: string, opts?: { lastmod?: string; changefreq?: string; priority?: string }) {
  return `  <url>
    <loc>${loc}</loc>
    ${opts?.lastmod ? `<lastmod>${opts.lastmod}</lastmod>` : ""}
    ${opts?.changefreq ? `<changefreq>${opts.changefreq}</changefreq>` : ""}
    ${opts?.priority ? `<priority>${opts.priority}</priority>` : ""}
  </url>`;
}

// @ts-ignore — Route registered after vite build generates routeTree.gen.ts
export const Route = createFileRoute("/sitemap/xml")({

  server: {
    handlers: {
      GET: async ({ request }) => {
        const origin = new URL(request.url).origin;
        const baseUrl = process.env.SITE_URL || (origin !== "null" ? origin : "");
        const today = toXmlDate();

        const [products, categories] = await Promise.allSettled([
          fetchProducts({ limit: 500 }),
          fetchCategories(),
        ]);

        const productList = products.status === "fulfilled" ? products.value : [];
        const categoryList = categories.status === "fulfilled" ? categories.value : [];

        const staticPages = [
          urlEntry(`${baseUrl}/`, {
            lastmod: today,
            changefreq: "daily",
            priority: "1.0",
          }),
          urlEntry(`${baseUrl}/offers`, {
            lastmod: today,
            changefreq: "daily",
            priority: "0.9",
          }),
        ];

        const categoryPages = categoryList.map((cat) =>
          urlEntry(`${baseUrl}/category/${cat.id}`, {
            lastmod: today,
            changefreq: "weekly",
            priority: "0.8",
          })
        );

        const productPages = productList.map((p) =>
          urlEntry(`${baseUrl}/product/${p.slug}`, {
            lastmod: today,
            changefreq: "weekly",
            priority: "0.9",
          })
        );

        const allEntries = [...staticPages, ...categoryPages, ...productPages].join("\n");

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xhtml="http://www.w3.org/1999/xhtml"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
>
${allEntries}
</urlset>`;

        return new Response(xml, {
          status: 200,
          headers: {
            "content-type": "application/xml; charset=utf-8",
            "cache-control": "public, max-age=3600, s-maxage=3600",
          },
        });
      },
    },
  },
});

import { createFileRoute } from "@tanstack/react-router";
import { fetchProducts } from "@/lib/actions/product.actions";
import { fetchCategories } from "@/lib/actions/category.actions";
import { xmlEscape } from "@/lib/seo";

function toXmlDate(date = new Date()): string {
  return date.toISOString().split("T")[0];
}

function urlEntry(
  location: string,
  options?: { lastmod?: string; changefreq?: string; priority?: string },
) {
  return `  <url>
    <loc>${xmlEscape(location)}</loc>
    ${options?.lastmod ? `<lastmod>${options.lastmod}</lastmod>` : ""}
    ${options?.changefreq ? `<changefreq>${options.changefreq}</changefreq>` : ""}
    ${options?.priority ? `<priority>${options.priority}</priority>` : ""}
  </url>`;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const origin = new URL(request.url).origin;
        const baseUrl = process.env.SITE_URL || (origin !== "null" ? origin : "");
        const today = toXmlDate();
        const [products, categories] = await Promise.allSettled([
          fetchProducts({ limit: 100 }),
          fetchCategories(),
        ]);
        const productList = products.status === "fulfilled" ? products.value : [];
        const categoryList = categories.status === "fulfilled" ? categories.value : [];
        const entries = [
          urlEntry(`${baseUrl}/`, { lastmod: today, changefreq: "daily", priority: "1.0" }),
          urlEntry(`${baseUrl}/offers`, { lastmod: today, changefreq: "daily", priority: "0.9" }),
          ...categoryList.map((category) =>
            urlEntry(`${baseUrl}/category/${category.id}`, {
              lastmod: today,
              changefreq: "weekly",
              priority: "0.8",
            }),
          ),
          ...productList
            .filter((product) => Boolean(product.slug))
            .map((product) =>
              urlEntry(`${baseUrl}/product/${product.slug}`, {
                lastmod: today,
                changefreq: "weekly",
                priority: "0.9",
              }),
            ),
        ];
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join("\n")}
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
